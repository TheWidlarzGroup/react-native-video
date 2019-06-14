package com.brentvatne.exoplayer;

import android.animation.LayoutTransition;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Message;
import android.support.annotation.IntegerRes;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.view.GestureDetectorCompat;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;
import android.view.GestureDetector;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.accessibility.CaptioningManager;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.SeekBar;
import android.widget.TextView;

import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
import com.dice.shield.downloads.dash.DashManifest;
import com.dice.shield.downloads.dash.DashParser;
import com.dice.shield.downloads.manager.DlmWrapper;
import com.dice.shield.drm.entity.ActionToken;
import com.dice.shield.drm.utils.Utils;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.DefaultRenderersFactory;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.drm.DefaultDrmSessionManager;
import com.google.android.exoplayer2.drm.DrmSession;
import com.google.android.exoplayer2.drm.FrameworkMediaCrypto;
import com.google.android.exoplayer2.drm.FrameworkMediaDrm;
import com.google.android.exoplayer2.drm.HttpMediaDrmCallback;
import com.google.android.exoplayer2.drm.UnsupportedDrmException;
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer;
import com.google.android.exoplayer2.mediacodec.MediaCodecUtil;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.MetadataRenderer;
import com.google.android.exoplayer2.offline.FilteringManifestParser;
import com.google.android.exoplayer2.source.BehindLiveWindowException;
import com.google.android.exoplayer2.source.ExtractorMediaSource;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.MergingMediaSource;
import com.google.android.exoplayer2.source.SingleSampleMediaSource;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.source.dash.DashMediaSource;
import com.google.android.exoplayer2.source.dash.DefaultDashChunkSource;
import com.google.android.exoplayer2.source.dash.manifest.RepresentationKey;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.DefaultSsChunkSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultAllocator;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.HttpDataSource;
import com.google.android.exoplayer2.util.Util;
import com.imggaming.mux.MuxStats;
import com.imggaming.tracks.DcePlayerModel;
import com.imggaming.tracks.DceTracksDialog;
import com.imggaming.utils.DrawableUtils;
import com.imggaming.utils.DensityPixels;
import com.previewseekbar.PreviewSeekBarLayout;
import com.previewseekbar.base.PreviewLoader;
import com.previewseekbar.base.PreviewView;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@SuppressLint("ViewConstructor")
class ReactTVExoplayerView extends RelativeLayout implements LifecycleEventListener, ExoPlayer.EventListener,
        BecomingNoisyListener, AudioManager.OnAudioFocusChangeListener, MetadataRenderer.Output {

    private static final String TAG = "ReactTvExoplayerView";

    private static final DefaultBandwidthMeter BANDWIDTH_METER = new DefaultBandwidthMeter();
    private static final CookieManager DEFAULT_COOKIE_MANAGER;
    private static final int SHOW_JS_PROGRESS = 1;
    private static final int SHOW_NATIVE_PROGRESS = 2;

    static {
        DEFAULT_COOKIE_MANAGER = new CookieManager();
        DEFAULT_COOKIE_MANAGER.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
    }

    private final VideoEventEmitter eventEmitter;

    private PreviewSeekBarLayout previewSeekBarLayout;
    private LinearLayout bottomBarWidgetContainer;
    private TextView currentTextView;
    private TextView durationTextView;
    private TextView dividerTextView;
    private TextView liveTextView;
    private ImageButton playPauseButton;
    private ImageButton bottomRightIconButton;
    private View controls;
    private View bottomBarWidget;
    private ImageButton audioSubtitlesButton;
    private GestureDetectorCompat gestureDetector;
    private long startTouchActionDownTime;
    private float eventDownX;
    private float eventDownY;

    private Handler mainHandler;
    private ExoPlayerView exoPlayerView;
    private DceTracksDialog dialog;
    private DataSource.Factory mediaDataSourceFactory;
    private SimpleExoPlayer player;
    private DefaultTrackSelector trackSelector;
    private boolean playerNeedsSource;
    private int resumeWindow;
    private long resumePosition;
    private boolean loadVideoStarted;
    private boolean isFullscreen;
    private boolean isInBackground;
    private boolean isPaused;
    private boolean isBuffering;
    private float rate = 1f;
    private int minBufferMs = DefaultLoadControl.DEFAULT_MIN_BUFFER_MS;
    private int maxBufferMs = DefaultLoadControl.DEFAULT_MAX_BUFFER_MS;
    private int bufferForPlaybackMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS;
    private int bufferForPlaybackAfterRebufferMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS;

    // Props from React
    private Uri srcUri;
    private String extension;
    private boolean repeat;
    private String audioTrackType;
    private Dynamic audioTrackValue;
    private ReadableArray audioTracks;
    private String textTrackType;
    private Dynamic textTrackValue;
    private ReadableArray textTracks;
    private boolean disableFocus;
    private boolean live = false;
    private boolean controlsVisibilityGestureDisabled = false;
    private float mProgressUpdateInterval = 250.0f;
    private boolean useTextureView = false;
    private Map<String, String> requestHeaders;
    private int accentColor;
    // \ End props

    // React
    private final ThemedReactContext themedReactContext;
    private final AudioManager audioManager;
    private final AudioBecomingNoisyReceiver audioBecomingNoisyReceiver;

    private final float NATIVE_PROGRESS_UPDATE_INTERVAL = 250.0f;
    private final int ANIMATION_DURATION_CONTROLS_VISIBILITY = 500;

    @SuppressLint("HandlerLeak")
    private final Handler progressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case SHOW_JS_PROGRESS:
                    if (player != null && player.getPlaybackState() == ExoPlayer.STATE_READY && player.getPlayWhenReady()) {
                        long pos = player.getCurrentPosition();
                        long bufferedDuration = player.getBufferedPercentage() * player.getDuration() / 100;
                        eventEmitter.progressChanged(pos, bufferedDuration, player.getDuration());
                        progressHandler.removeMessages(SHOW_JS_PROGRESS);
                        msg = obtainMessage(SHOW_JS_PROGRESS);
                        sendMessageDelayed(msg, Math.round(mProgressUpdateInterval));
                    }
                    break;
            }
        }
    };

    @SuppressLint("HandlerLeak")
    private final Handler nativeProgressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case SHOW_NATIVE_PROGRESS:
                    if (player != null && player.getPlaybackState() == ExoPlayer.STATE_READY && player.getPlayWhenReady()) {
                        long currentMillis = player.getCurrentPosition();
                        progressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
                        msg = obtainMessage(SHOW_NATIVE_PROGRESS);
                        sendMessageDelayed(msg, Math.round(NATIVE_PROGRESS_UPDATE_INTERVAL));

                        updateProgressControl(currentMillis);
                    }
                    break;
            }
        }
    };
    private boolean playInBackground = false;

    //Drm
    private FrameworkMediaDrm mediaDrm;
    private HttpMediaDrmCallback drmCallback;
    private ActionToken actionToken;

    //Mux
    private MuxStats muxStats;
    private Map<String, Object> muxData;
    private PreviewView.OnPreviewChangeListener mPreviewChangeListener;

    public ReactTVExoplayerView(ThemedReactContext context) {
        super(context);
        this.themedReactContext = context;
        createViews();
        this.eventEmitter = new VideoEventEmitter(context);
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        themedReactContext.addLifecycleEventListener(this);
        audioBecomingNoisyReceiver = new AudioBecomingNoisyReceiver(themedReactContext);
        GestureDetector.SimpleOnGestureListener gestureListener = new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                if (!controlsVisibilityGestureDisabled) {
                    eventEmitter.touchActionMove(distanceX, distanceY);
                    float newTranslationY = bottomBarWidget.getTranslationY() + distanceY;
                    if (newTranslationY > 0 && newTranslationY < bottomBarWidget.getHeight()) {
                        bottomBarWidget.setTranslationY(newTranslationY);
                        float alpha = 1 - newTranslationY / bottomBarWidget.getHeight();
                        bottomBarWidgetContainer.setAlpha(alpha);
                        playPauseButton.setAlpha(alpha);
                    }
                }
                return true;
            }
        };
        gestureDetector = new GestureDetectorCompat(themedReactContext, gestureListener);
        setPausedModifier(false);
    }


    @Override
    public void setId(int id) {
        super.setId(id);
        eventEmitter.setViewId(id);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        gestureDetector.onTouchEvent(event);
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN: {
                startTouchActionDownTime = System.currentTimeMillis();
                eventDownX = event.getX();
                eventDownY = event.getY();
                break;
            }
            case MotionEvent.ACTION_UP: {
                eventEmitter.touchActionUp();
            }
        }
        return true;
    }

    private void createViews() {
        addOnLayoutChangeListener(new OnLayoutChangeListener() {
            @Override
            public void onLayoutChange(View v, int left, int top, int right, int bottom, int oldLeft, int oldTop,
                                       int oldRight, int oldBottom) {
                postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        controls.requestLayout();
                    }
                }, 200);
            }
        });
        clearResumePosition();
        mediaDataSourceFactory = buildDataSourceFactory(true);
        mainHandler = new Handler();
        if (CookieHandler.getDefault() != DEFAULT_COOKIE_MANAGER) {
            CookieHandler.setDefault(DEFAULT_COOKIE_MANAGER);
        }

        LayoutInflater inflater = LayoutInflater.from(getContext());

        LayoutParams layoutParams = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        exoPlayerView = new ExoPlayerView(getContext());
        exoPlayerView.setLayoutParams(layoutParams);
        addView(exoPlayerView, 0, layoutParams);
        setLayoutTransition(new LayoutTransition());

        controls = inflater.inflate(R.layout.controls_tv, null);
        LayoutParams controlsParam = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        controls.setLayoutParams(controlsParam);
        addView(controls);

        bottomBarWidget = controls.findViewById(R.id.bottomBarWidget);

        playPauseButton = (ImageButton) controls.findViewById(R.id.tvPlayPauseImageView);
        playPauseButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                setPausedModifier(!isPaused);
            }
        });
        bottomRightIconButton = (ImageButton) findViewById(R.id.bottomRightIconButton);
        bottomRightIconButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                eventEmitter.bottomRightIconClick();
            }
        });
        durationTextView = (TextView) controls.findViewById(R.id.durationTextView);
        currentTextView = (TextView) controls.findViewById(R.id.currentTimeTextView);
        dividerTextView = controls.findViewById(R.id.timeDividerTextView);
        liveTextView = (TextView) controls.findViewById(R.id.liveTextView);
        previewSeekBarLayout = (PreviewSeekBarLayout) controls.findViewById(R.id.previewSeekBarLayout);
        previewSeekBarLayout.setPreviewLoader(new PreviewLoader() {
            @Override
            public void loadPreview(long currentPosition, long max) {

            }
        });
        bottomBarWidgetContainer = (LinearLayout) controls.findViewById(R.id.tvBottomBarWidgetContainer);

        audioSubtitlesButton = findViewById(R.id.tvAudioSubtitlesBtn);
        audioSubtitlesButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {

                if (!live) {
                    setPausedModifier(true);
                }

                if (dialog != null) {
                    dialog.dismiss();
                    dialog = null;
                }

                dialog = new DceTracksDialog(getContext(), R.style.DiceTracksDialog);
                dialog.setModel(new DcePlayerModel(getContext(), player, trackSelector));
                dialog.setAccentColor(accentColor);

                dialog.show();
            }
        });
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        initializePlayer();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        stopPlayback();
    }

    // LifecycleEventListener implementation

    @Override
    public void onHostResume() {
        if (!playInBackground || !isInBackground) {
            setPlayWhenReady(!isPaused);
        }
        isInBackground = false;
    }

    @Override
    public void onHostPause() {
        isInBackground = true;
        if (playInBackground) {
            return;
        }
        setPlayWhenReady(false);
    }

    @Override
    public void onHostDestroy() {
        stopPlayback();
    }

    public void cleanUpResources() {
        stopPlayback();
    }


    // Internal methods
    private void initializePlayer() {
        Log.d("initialisePlayer", "--");
        if (player == null)  {
            DefaultDrmSessionManager drmMgr = null;
            if (actionToken != null) {
                try {
                    drmMgr = createDrmSessionManager(actionToken);
                } catch (UnsupportedDrmException e) {
                    handleDrmError(e);
                    return; //?
                }
            }

            TrackSelection.Factory videoTrackSelectionFactory = new AdaptiveTrackSelection.Factory(BANDWIDTH_METER);
            trackSelector = new DefaultTrackSelector(videoTrackSelectionFactory);
            DefaultAllocator allocator = new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
            DefaultLoadControl defaultLoadControl = new DefaultLoadControl(allocator, minBufferMs, maxBufferMs, bufferForPlaybackMs, bufferForPlaybackAfterRebufferMs, -1, true);

            if (drmMgr != null) {
                player = ExoPlayerFactory.newSimpleInstance(new DefaultRenderersFactory(getContext(), drmMgr), trackSelector, defaultLoadControl, drmMgr);
            } else {
                player = ExoPlayerFactory.newSimpleInstance(getContext(), trackSelector, defaultLoadControl);
            }

            player.addListener(this);
            player.setMetadataOutput(this);
            exoPlayerView.setPlayer(player, false);
            audioBecomingNoisyReceiver.setListener(this);
            setPlayWhenReady(!isPaused);
            playerNeedsSource = true;

            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            player.setPlaybackParameters(params);
        }
        if (playerNeedsSource && srcUri != null) {
            ArrayList<MediaSource> mediaSourceList = buildTextSources();
            MediaSource videoSource = buildMediaSource(srcUri, extension);
            MediaSource mediaSource;
            if (mediaSourceList.size() == 0) {
                mediaSource = videoSource;
            } else {
                mediaSourceList.add(0, videoSource);
                MediaSource[] textSourceArray = mediaSourceList.toArray(
                        new MediaSource[mediaSourceList.size()]
                );
                mediaSource = new MergingMediaSource(textSourceArray);
            }

            boolean haveResumePosition = resumeWindow != C.INDEX_UNSET;
            if (haveResumePosition) {
                player.seekTo(resumeWindow, resumePosition);
            }
            player.prepare(mediaSource, !haveResumePosition, false);
            playerNeedsSource = false;

            setupSubtitlesButton();
            showOverlay();

            eventEmitter.loadStart();
            loadVideoStarted = true;

            if (muxData != null) {
                if (muxStats == null) {
                    muxStats = new MuxStats(getContext(), player, muxData);
                } else {
                    muxStats.setVideoData(muxData);
                }
                muxStats.setVideoView(exoPlayerView.getVideoSurfaceView());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private MediaSource buildMediaSource(Uri uri, @Nullable String overrideExtension) {
        int type = Util.inferContentType(
                !TextUtils.isEmpty(overrideExtension) ? "." + overrideExtension : uri.getLastPathSegment());
        switch (type) {
            case C.TYPE_SS:
                return new SsMediaSource(uri, buildDataSourceFactory(false),
                        new DefaultSsChunkSource.Factory(mediaDataSourceFactory), mainHandler, null);
            case C.TYPE_DASH:
                return new DashMediaSource.Factory(
                        new DefaultDashChunkSource.Factory(mediaDataSourceFactory),
                        buildDataSourceFactory(false))
                        .setManifestParser(
                                new FilteringManifestParser<>(
                                        new DashParser(new DashParser.Callback() {
                                            @Override
                                            public void onManifestParsed(com.google.android.exoplayer2.source.dash.manifest.DashManifest manifest) {

                                                final ActionToken actionToken = ReactTVExoplayerView.this.actionToken;

                                                if (manifest instanceof DashManifest && actionToken != null) {
                                                    List kids = ((DashManifest) manifest).getDefaultKIds();
                                                    String header = Utils.createXDrmInfoHeader(Utils.getSystem(actionToken.getDrmScheme()), kids);
                                                    drmCallback.setKeyRequestProperty("X-DRM-INFO", header);
                                                }
                                            }
                                        }), getOfflineStreamKeys(uri)))
                        .createMediaSource(uri);

            case C.TYPE_HLS:
                return new HlsMediaSource(uri, mediaDataSourceFactory, mainHandler, null);
            case C.TYPE_OTHER:
                return new ExtractorMediaSource(uri, mediaDataSourceFactory, new DefaultExtractorsFactory(), mainHandler,
                        null);
            default: {
                throw new IllegalStateException("Unsupported type: " + type);
            }
        }
    }

    private DefaultDrmSessionManager createDrmSessionManager(@NonNull ActionToken drmParam) throws UnsupportedDrmException {
        DefaultDrmSessionManager<FrameworkMediaCrypto> drmSessionManager = null;
        final String drmLicenseUrl = drmParam.getLicensingServerUrl();
        final HashMap<String, String> keyRequestProperties = Utils.getParams(drmParam);

        UnsupportedDrmException exception = null;
        if (Util.SDK_INT < 18) {
            throw new UnsupportedDrmException(0);
        } else {
            UUID drmSchemeUuid = Util.getDrmUuid(drmParam.getDrmScheme());
            if (drmSchemeUuid == null) {
                throw new UnsupportedDrmException(UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME);
            } else {
                drmSessionManager = buildDrmSessionManagerV18(drmSchemeUuid, drmLicenseUrl, keyRequestProperties, false);

                final String offline = drmParam.getOfflineLicense();

                if (offline != null) {
                    drmSessionManager.setMode(DefaultDrmSessionManager.MODE_QUERY, Base64.decode(offline, Base64.NO_WRAP));
                }
            }
        }
        return drmSessionManager;
    }

    private void handleDrmError(UnsupportedDrmException exception) {
        final int errorStringId;
        switch (exception.reason) {
            case 0:
                errorStringId = com.dice.shield.downloads.R.string.error_drm_not_supported;
                break;
            case UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME:
                errorStringId = com.dice.shield.downloads.R.string.error_drm_unsupported_scheme;
                break;
            default:
                errorStringId = com.dice.shield.downloads.R.string.error_drm_unknown;
                break;
        }

        final String errorString = getContext().getString(errorStringId);
        eventEmitter.error(errorString, exception);
    }

    private DefaultDrmSessionManager<FrameworkMediaCrypto> buildDrmSessionManagerV18(
            @NonNull UUID uuid, @NonNull String licenseUrl, @Nullable Map<String, String> requestProperties, boolean multiSession)
            throws UnsupportedDrmException {
        HttpDataSource.Factory licenseDataSourceFactory =
                (DlmWrapper.getInstance(getContext().getApplicationContext())).buildHttpDataSourceFactory(/* listener= */ null);
        HttpMediaDrmCallback drmCallback =
                new HttpMediaDrmCallback(licenseUrl, licenseDataSourceFactory);
        if (requestProperties != null) {
            for (String key : requestProperties.keySet()) {
                drmCallback.setKeyRequestProperty(key, requestProperties.get(key));
            }
        }
        releaseMediaDrm();
        mediaDrm = FrameworkMediaDrm.newInstance(uuid);
        this.drmCallback = drmCallback;
        return new DefaultDrmSessionManager<>(uuid, mediaDrm, drmCallback, null, multiSession);
    }

    private void releaseMediaDrm() {
        if (mediaDrm != null) {
            mediaDrm.release();
            mediaDrm = null;
        }
        drmCallback = null;
    }

    private List<RepresentationKey> getOfflineStreamKeys(@NonNull Uri uri) {
        //ToDo: implement this method when download quality selection is added to download flow. For now using all streams.
        return Collections.emptyList();
    }

    private ArrayList<MediaSource> buildTextSources() {
        ArrayList<MediaSource> textSources = new ArrayList<>();
        if (textTracks == null) {
            return textSources;
        }

        for (int i = 0; i < textTracks.size(); ++i) {
            ReadableMap textTrack = textTracks.getMap(i);
            String language = textTrack.getString("language");
            String title = textTrack.hasKey("title")
                    ? textTrack.getString("title") : language + " " + i;
            Uri uri = Uri.parse(textTrack.getString("uri"));
            MediaSource textSource = buildTextSource(title, uri, textTrack.getString("type"),
                    language);
            if (textSource != null) {
                textSources.add(textSource);
            }
        }
        return textSources;
    }

    private MediaSource buildTextSource(String title, Uri uri, String mimeType, String language) {
        Format textFormat = Format.createTextSampleFormat(title, mimeType, Format.NO_VALUE, language);
        return new SingleSampleMediaSource(uri, mediaDataSourceFactory, textFormat, C.TIME_UNSET);
    }

    private void releasePlayer() {
        if (muxStats != null) {
            muxStats.release();
            muxStats = null;
        }
        dismissTracksDialog();
        if (player != null) {
            updateResumePosition();
            player.release();
            player.setMetadataOutput(null);
            player = null;
            trackSelector = null;
        }
        progressHandler.removeMessages(SHOW_JS_PROGRESS);
        progressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
        themedReactContext.removeLifecycleEventListener(this);
        audioBecomingNoisyReceiver.removeListener();
        releaseMediaDrm();
    }

    private void dismissTracksDialog() {
        if (dialog != null) {
            dialog.dismiss();
            dialog = null;
        }
    }

    private boolean requestAudioFocus() {
        if (disableFocus) {
            return true;
        }
        int result = audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void setPlayWhenReady(boolean playWhenReady) {
        if (player == null) {
            return;
        }

        if (playWhenReady) {
            boolean hasAudioFocus = requestAudioFocus();
            if (hasAudioFocus) {
                player.setPlayWhenReady(true);
            }
        } else {
            player.setPlayWhenReady(false);
        }
    }

    private void startPlayback() {
        if (player != null) {
            switch (player.getPlaybackState()) {
                case ExoPlayer.STATE_IDLE:
                case ExoPlayer.STATE_ENDED:
                    initializePlayer();
                    break;
                case ExoPlayer.STATE_BUFFERING:
                case ExoPlayer.STATE_READY:
                    if (!player.getPlayWhenReady()) {
                        setPlayWhenReady(true);
                    }
                    break;
                default:
                    break;
            }

        } else {
            initializePlayer();
        }
        if (!disableFocus) {
            setKeepScreenOn(true);
        }
    }

    private void pausePlayback() {
        if (player != null) {
            if (player.getPlayWhenReady()) {
                setPlayWhenReady(false);
            }
        }
        setKeepScreenOn(false);
    }

    private void stopPlayback() {
        onStopPlayback();
        releasePlayer();
    }

    private void onStopPlayback() {
        if (isFullscreen) {
            setFullscreen(false);
        }
        setKeepScreenOn(false);
        audioManager.abandonAudioFocus(this);
    }

    private void updateResumePosition() {
        resumeWindow = player.getCurrentWindowIndex();
        resumePosition = player.isCurrentWindowSeekable() ? Math.max(0, player.getCurrentPosition()) : C.TIME_UNSET;
    }

    private void clearResumePosition() {
        resumeWindow = C.INDEX_UNSET;
        resumePosition = C.TIME_UNSET;
    }

    /**
     * Returns a new DataSource factory.
     *
     * @param useBandwidthMeter Whether to set {@link #BANDWIDTH_METER} as a listener to the new
     *                          DataSource factory.
     * @return A new DataSource factory.
     */
    private DataSource.Factory buildDataSourceFactory(boolean useBandwidthMeter) {
        return DlmWrapper.getInstance(getContext().getApplicationContext())
                .buildDataSourceFactory(useBandwidthMeter ? BANDWIDTH_METER : null);
    }

    // AudioManager.OnAudioFocusChangeListener implementation

    @Override
    public void onAudioFocusChange(int focusChange) {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_LOSS:
                eventEmitter.audioFocusChanged(false);
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                eventEmitter.audioFocusChanged(true);
                break;
            default:
                break;
        }

        if (player != null) {
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                // Lower the volume
                player.setVolume(0.8f);
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                // Raise it back to normal
                player.setVolume(1);
            }
        }
    }

    // AudioBecomingNoisyListener implementation

    @Override
    public void onAudioBecomingNoisy() {
        eventEmitter.audioBecomingNoisy();
    }

    // ExoPlayer.EventListener implementation

    @Override
    public void onLoadingChanged(boolean isLoading) {

    }

    @Override
    public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
        String text = "onStateChanged: playWhenReady=" + playWhenReady + ", playbackState=";
        switch (playbackState) {
            case ExoPlayer.STATE_IDLE:
                text += "idle";
                eventEmitter.idle();
                break;
            case ExoPlayer.STATE_BUFFERING:
                text += "buffering";
                onBuffering(true);
                break;
            case ExoPlayer.STATE_READY:
                text += "ready";
                eventEmitter.ready();
                onBuffering(false);
                startProgressHandler();
                setupProgressBarSeekListener();
                videoLoaded();
                setupSubtitlesButton();
                break;
            case ExoPlayer.STATE_ENDED:
                text += "ended";
                eventEmitter.end();
                onStopPlayback();
                break;
            default:
                text += "unknown";
                break;
        }
        Log.d(TAG, text);
    }

    private void setupSubtitlesButton() {
        Log.d(TAG, "setupSubtitlesButton() " + player.getPlaybackState());
        if (player != null && player.getPlaybackState() == ExoPlayer.STATE_READY) {


            DcePlayerModel model = new DcePlayerModel(getContext(), player, trackSelector);

            if (model.areSubtitlesAvailable() || (model.areAudioTracksAvailable() && model.getAudioTracks().size() > 1)) {
                Log.d(TAG, "setupSubtitlesButton() VISIBLE");
                audioSubtitlesButton.setVisibility(View.VISIBLE);
            } else {
                Log.d(TAG, "setupSubtitlesButton() INVISIBLE");
                audioSubtitlesButton.setVisibility(View.INVISIBLE);
            }
        } else {
            Log.d(TAG, "setupSubtitlesButton() media not ready");
            audioSubtitlesButton.setVisibility(View.INVISIBLE);
        }
    }

    private void startProgressHandler() {
        progressHandler.sendEmptyMessage(SHOW_JS_PROGRESS);
        nativeProgressHandler.sendEmptyMessage(SHOW_NATIVE_PROGRESS);
    }

    private void updateProgressControl(long currentMillis) {

        ProgressBar progressBar = (ProgressBar) previewSeekBarLayout.getPreviewView();
        if (player == null || progressBar == null) {
            return;
        }
        long duration = player.getDuration();

        if (duration != C.TIME_UNSET && durationTextView != null) {
            int secs = (int) (duration / 1000) % 60;
            int mins = (int) ((duration / (1000 * 60)) % 60);
            int hours = (int) ((duration / (1000 * 60 * 60)) % 24);
            String durationString = "";
            if (hours > 0) {
                durationString = String.format(Locale.UK, "%02d:%02d:%02d", hours, mins, secs);
            } else {
                durationString = String.format(Locale.UK, "%02d:%02d", mins, secs);
            }

            durationTextView.setText(durationString);
            progressBar.setMax((int) duration);
        }

        if (currentMillis != C.TIME_UNSET && currentTextView != null) {
            int secs = (int) (currentMillis / 1000) % 60;
            int mins = (int) ((currentMillis / (1000 * 60)) % 60);
            int hours = (int) ((currentMillis / (1000 * 60 * 60)) % 24);
            boolean showHours = false;
            if (duration != C.TIME_UNSET) {
                showHours = ((int) ((duration / (1000 * 60 * 60)) % 24)) > 0;
            }

            String currentString = "";
            if (hours > 0 || showHours) {
                currentString = String.format(Locale.UK, "%02d:%02d:%02d", hours, mins, secs);
            } else {
                currentString = String.format(Locale.UK, "%02d:%02d", mins, secs);
            }
            currentTextView.setText(currentString);
            progressBar.setProgress((int) currentMillis);
        }

    }

    private void setupProgressBarSeekListener() {
        if (previewSeekBarLayout != null
                && previewSeekBarLayout.checkChilds()
                && previewSeekBarLayout.getPreviewView() instanceof ProgressBar) {
            if (mPreviewChangeListener == null) {
                mPreviewChangeListener = new PreviewView.OnPreviewChangeListener() {
                    @Override
                    public void onStartPreview(PreviewView previewView) {
                    }

                    @Override
                    public void onStopPreview(PreviewView previewView) {
                    }

                    @Override
                    public void onPreview(PreviewView previewView, int progress, boolean fromUser) {
                        if (fromUser && player != null) {
                            player.seekTo(progress);
                            updateProgressControl(progress);
                        }
                    }
                };
            }
            previewSeekBarLayout.getPreviewView().addOnPreviewChangeListener(mPreviewChangeListener);
        }
    }

    private void videoLoaded() {
        if (loadVideoStarted) {
            loadVideoStarted = false;
            setSelectedAudioTrack(audioTrackType, audioTrackValue);
            setSelectedTextTrack(textTrackType, textTrackValue);
            Format videoFormat = player.getVideoFormat();
            int width = videoFormat != null ? videoFormat.width : 0;
            int height = videoFormat != null ? videoFormat.height : 0;
            eventEmitter.load(player.getDuration(), player.getCurrentPosition(), width, height,
                    getAudioTrackInfo(), getTextTrackInfo());
        }
    }

    private WritableArray getAudioTrackInfo() {
        WritableArray audioTracks = Arguments.createArray();

        MappingTrackSelector.MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
        int index = getTrackRendererIndex(C.TRACK_TYPE_AUDIO);
        if (info == null || index == C.INDEX_UNSET) {
            return audioTracks;
        }

        TrackGroupArray groups = info.getTrackGroups(index);
        for (int i = 0; i < groups.length; ++i) {
            Format format = groups.get(i).getFormat(0);
            WritableMap audioTrack = Arguments.createMap();
            audioTrack.putInt("index", i);
            audioTrack.putString("title", format.id != null ? format.id : "");
            audioTrack.putString("type", format.sampleMimeType);
            audioTrack.putString("language", format.language != null ? format.language : "");
            audioTracks.pushMap(audioTrack);
        }
        return audioTracks;
    }

    private WritableArray getTextTrackInfo() {
        WritableArray textTracks = Arguments.createArray();

        MappingTrackSelector.MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
        int index = getTrackRendererIndex(C.TRACK_TYPE_TEXT);
        if (info == null || index == C.INDEX_UNSET) {
            return textTracks;
        }

        TrackGroupArray groups = info.getTrackGroups(index);
        for (int i = 0; i < groups.length; ++i) {
             Format format = groups.get(i).getFormat(0);
             WritableMap textTrack = Arguments.createMap();
             textTrack.putInt("index", i);
             textTrack.putString("title", format.id != null ? format.id : "");
             textTrack.putString("type", format.sampleMimeType);
             textTrack.putString("language", format.language != null ? format.language : "");
             textTracks.pushMap(textTrack);
        }
        return textTracks;
    }

    private void onBuffering(boolean buffering) {
        if (isBuffering == buffering) {
            return;
        }

        isBuffering = buffering;
        if (buffering) {
            eventEmitter.buffering(true);
        } else {
            eventEmitter.buffering(false);
        }

        if (buffering) {
            showOverlay();
        } else {
            if (!isPaused) {
                hideOverlay();
            } else {
                showOverlay();
            }
        }
    }

    @Override
    public void onPositionDiscontinuity(int reason) {
        if (playerNeedsSource) {
            // This will only occur if the user has performed a seek whilst in the error state. Update the
            // resume position so that if the user then retries, playback will resume from the position to
            // which they seeked.
            updateResumePosition();
        }
        // When repeat is turned on, reaching the end of the video will not cause a state change
        // so we need to explicitly detect it.
        if (reason == ExoPlayer.DISCONTINUITY_REASON_PERIOD_TRANSITION
                && player.getRepeatMode() == Player.REPEAT_MODE_ONE) {
            eventEmitter.end();
        }
    }

    @Override
    public void onTimelineChanged(Timeline timeline, Object manifest, int reason) {
        // Do nothing.
    }

    @Override
    public void onSeekProcessed() {
        // Do nothing.
    }

    @Override
    public void onShuffleModeEnabledChanged(boolean shuffleModeEnabled) {
        // Do nothing.
    }

    @Override
    public void onRepeatModeChanged(int repeatMode) {
        // Do nothing.
    }

    @Override
    public void onTracksChanged(TrackGroupArray trackGroups, TrackSelectionArray trackSelections) {
        // Do Nothing.
    }

    @Override
    public void onPlaybackParametersChanged(PlaybackParameters params) {
        eventEmitter.playbackRateChange(params.speed);
    }

    @Override
    public void onPlayerError(ExoPlaybackException e) {
        String errorString = null;
        Exception ex = e;
        if (isBehindLiveWindow(e)) {
            errorString = getResources().getString(R.string.error_behind_live_window);
            ex = new Exception("BehindLiveWindowException");
        } else if (e.type == ExoPlaybackException.TYPE_RENDERER) {
            Exception cause = e.getRendererException();
            if (cause instanceof MediaCodecRenderer.DecoderInitializationException) {
                // Special case for decoder initialization failures.
                MediaCodecRenderer.DecoderInitializationException decoderInitializationException = (MediaCodecRenderer.DecoderInitializationException) cause;
                if (decoderInitializationException.decoderName == null) {
                    if (decoderInitializationException.getCause() instanceof MediaCodecUtil.DecoderQueryException) {
                        errorString = getResources().getString(R.string.error_querying_decoders);
                    } else if (decoderInitializationException.secureDecoderRequired) {
                        errorString = getResources().getString(R.string.error_no_secure_decoder,
                                decoderInitializationException.mimeType);
                    } else {
                        errorString = getResources().getString(R.string.error_no_decoder,
                                decoderInitializationException.mimeType);
                    }
                } else {
                    errorString = getResources().getString(R.string.error_instantiating_decoder,
                            decoderInitializationException.decoderName);
                }
            } else if (cause instanceof DrmSession.DrmSessionException) {
                ex = cause;
                errorString = getResources().getString(com.dice.shield.downloads.R.string.error_drm_unknown);
            }
        } else if (e.type == ExoPlaybackException.TYPE_SOURCE) {
            ex = e.getSourceException();
            errorString = getResources().getString(R.string.unrecognized_media_format);
        }
        if (errorString != null) {
            eventEmitter.error(errorString, ex);
        }
        playerNeedsSource = true;
        if (!isBehindLiveWindow(e)) {
            updateResumePosition();
        }
    }

    private static boolean isBehindLiveWindow(ExoPlaybackException e) {
        if (e.type != ExoPlaybackException.TYPE_SOURCE) {
            return false;
        }
        Throwable cause = e.getSourceException();
        while (cause != null) {
            if (cause instanceof BehindLiveWindowException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    public int getTrackRendererIndex(int trackType) {
        int rendererCount = player.getRendererCount();
        for (int rendererIndex = 0; rendererIndex < rendererCount; rendererIndex++) {
            if (player.getRendererType(rendererIndex) == trackType) {
                return rendererIndex;
            }
        }
        return C.INDEX_UNSET;
    }

    @Override
    public void onMetadata(Metadata metadata) {
        eventEmitter.timedMetadata(metadata);
    }

    // ReactExoplayerViewManager public api

    public void setSrc(@NonNull final Uri uri, @Nullable final String extension, @Nullable final ActionToken actionToken,
                       @Nullable final Map<String, String> headers,  @Nullable final Map<String, Object> muxData) {
        if (uri != null) {
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.actionToken = actionToken;
            this.requestHeaders = headers;
            this.mediaDataSourceFactory = buildDataSourceFactory(true);
            this.muxData = muxData;

            initializePlayer();

            if (!isOriginalSourceNull && !isSourceEqual) {
                reloadSource();
            }
        }
    }

    public void setSrc(@NonNull final Uri uri, @Nullable final String extension, @Nullable final Map<String, String> headers) {
        setSrc(uri, extension, null, headers, null);
    }

    public void setProgressUpdateInterval(final float progressUpdateInterval) {
        mProgressUpdateInterval = progressUpdateInterval;
    }

    public void setRawSrc(@NonNull final Uri uri, @Nullable final String extension) {
        if (uri != null) {
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.mediaDataSourceFactory = buildDataSourceFactory(false);

            initializePlayer();

            if (!isOriginalSourceNull && !isSourceEqual) {
                reloadSource();
            }
        }
    }

    public void setTextTracks(ReadableArray textTracks) {
        this.textTracks = textTracks;
        reloadSource();
    }

    private void reloadSource() {
        playerNeedsSource = true;
        initializePlayer();
    }

    public void setResizeModeModifier(@ResizeMode.Mode int resizeMode) {
        exoPlayerView.setResizeMode(resizeMode);
    }

    public void setRepeatModifier(boolean repeat) {
        if (player != null) {
            if (repeat) {
                player.setRepeatMode(Player.REPEAT_MODE_ONE);
            } else {
                player.setRepeatMode(Player.REPEAT_MODE_OFF);
            }
        }
        this.repeat = repeat;
    }

    public void setSelectedTrack(int trackType, String type, Dynamic value) {
        int rendererIndex = getTrackRendererIndex(trackType);
        if (rendererIndex == C.INDEX_UNSET) {
            return;
        }
        MappingTrackSelector.MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
        if (info == null) {
            return;
        }

        TrackGroupArray groups = info.getTrackGroups(rendererIndex);
        int trackIndex = C.INDEX_UNSET;

        if (TextUtils.isEmpty(type)) {
            type = "default";
        }

        DefaultTrackSelector.Parameters disableParameters = trackSelector.getParameters()
                .buildUpon()
                .setRendererDisabled(rendererIndex, true)
                .build();

        if (type.equals("disabled")) {
            trackSelector.setParameters(disableParameters);
            return;
        } else if (type.equals("language")) {
            for (int i = 0; i < groups.length; ++i) {
                Format format = groups.get(i).getFormat(0);
                if (format.language != null && format.language.equals(value.asString())) {
                    trackIndex = i;
                    break;
                }
            }
        } else if (type.equals("title")) {
            for (int i = 0; i < groups.length; ++i) {
                Format format = groups.get(i).getFormat(0);
                if (format.id != null && format.id.equals(value.asString())) {
                    trackIndex = i;
                    break;
                }
            }
        } else if (type.equals("index")) {
            if (value.asInt() < groups.length) {
                trackIndex = value.asInt();
            }
        } else { // default
            if (rendererIndex == C.TRACK_TYPE_TEXT && Util.SDK_INT > 18 && groups.length > 0) {
                // Use system settings if possible
                CaptioningManager captioningManager
                        = (CaptioningManager)themedReactContext.getSystemService(Context.CAPTIONING_SERVICE);
                if (captioningManager != null && captioningManager.isEnabled()) {
                    trackIndex = getTrackIndexForDefaultLocale(groups);
                }
            } else if (rendererIndex == C.TRACK_TYPE_AUDIO) {
                trackIndex = getTrackIndexForDefaultLocale(groups);
            }
        }

        if (trackIndex == C.INDEX_UNSET) {
            trackSelector.setParameters(disableParameters);
            return;
        }

        DefaultTrackSelector.Parameters selectionParameters = trackSelector.getParameters()
                .buildUpon()
                .setRendererDisabled(rendererIndex, false)
                .setSelectionOverride(rendererIndex, groups,
                        new DefaultTrackSelector.SelectionOverride(trackIndex, 0))
                .build();
        trackSelector.setParameters(selectionParameters);
    }

    private int getTrackIndexForDefaultLocale(TrackGroupArray groups) {
        int trackIndex = 0; // default if no match
        String locale2 = Locale.getDefault().getLanguage(); // 2 letter code
        String locale3 = Locale.getDefault().getISO3Language(); // 3 letter code
        for (int i = 0; i < groups.length; ++i) {
            Format format = groups.get(i).getFormat(0);
            String language = format.language;
            if (language != null && (language.equals(locale2) || language.equals(locale3))) {
                trackIndex = i;
                break;
            }
        }
        return trackIndex;
    }

    public void setSelectedAudioTrack(String type, Dynamic value) {
        audioTrackType = type;
        audioTrackValue = value;
        setSelectedTrack(C.TRACK_TYPE_AUDIO, audioTrackType, audioTrackValue);
    }

    public void setSelectedTextTrack(String type, Dynamic value) {
        textTrackType = type;
        textTrackValue = value;
        setSelectedTrack(C.TRACK_TYPE_TEXT, textTrackType, textTrackValue);
    }

    public void setPausedModifier(boolean paused) {
        isPaused = paused;
        if (player != null) {
            if (!paused) {
                startPlayback();
            } else {
                pausePlayback();
            }
        }
        if (playPauseButton != null) {
            if (isPaused) {
                playPauseButton.setImageResource(R.drawable.tv_play_btn_selector);
            } else {
                playPauseButton.setImageResource(R.drawable.tv_pause_btn_selector);
            }
        }

        if (isPaused) {
            showOverlay();
        } else {
            hideOverlay();
        }


        eventEmitter.playbackRateChange(isPaused ? 0.0f : 1.0f);
    }

    public void setMutedModifier(boolean muted) {
        if (player != null) {
            player.setVolume(muted ? 0 : 1);
        }
    }

    public void setVolumeModifier(float volume) {
        if (player != null) {
            player.setVolume(volume);
        }
    }

    public void seekTo(long positionMs) {
        if (player != null) {
            eventEmitter.seek(player.getCurrentPosition(), positionMs);
            player.seekTo(positionMs);
        }
    }

    public void setRateModifier(float newRate) {

        if (newRate == 0.0) {
            setPausedModifier(true);
        } else {
            setPausedModifier(false);
            rate = newRate;
        }

        if (player != null) {
            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            player.setPlaybackParameters(params);
        }
    }

    public void setPlayInBackground(boolean playInBackground) {
        this.playInBackground = playInBackground;
    }

    public void setDisableFocus(boolean disableFocus) {
        this.disableFocus = disableFocus;
    }

    public void setFullscreen(boolean fullscreen) {
        if (fullscreen == isFullscreen) {
            return; // Avoid generating events when nothing is changing
        }
        isFullscreen = fullscreen;

        Activity activity = themedReactContext.getCurrentActivity();
        if (activity == null) {
            return;
        }
        Window window = activity.getWindow();
        View decorView = window.getDecorView();
        int uiOptions;
        if (isFullscreen) {
            if (Util.SDK_INT >= 19) { // 4.4+
                uiOptions = SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | SYSTEM_UI_FLAG_FULLSCREEN;
            } else {
                uiOptions = SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | SYSTEM_UI_FLAG_FULLSCREEN;
            }
            eventEmitter.fullscreenWillPresent();
            decorView.setSystemUiVisibility(uiOptions);
            eventEmitter.fullscreenDidPresent();
        } else {
            uiOptions = View.SYSTEM_UI_FLAG_VISIBLE;
            eventEmitter.fullscreenWillDismiss();
            decorView.setSystemUiVisibility(uiOptions);
            eventEmitter.fullscreenDidDismiss();
        }

        LayoutParams params = (LayoutParams) bottomBarWidgetContainer.getLayoutParams();
        if (fullscreen) {
            playPauseButton.setScaleX(1f);
            playPauseButton.setScaleY(1f);
            params.setMargins(DensityPixels.dpToPx(16), 0, DensityPixels.dpToPx(16), 0);
        } else {
            playPauseButton.setScaleX(0.8f);
            playPauseButton.setScaleY(0.8f);
            params.setMargins(0, 0, 0, 0);
        }
        bottomBarWidgetContainer.setLayoutParams(params);
    }

    public void setUseTextureView(boolean useTextureView) {
        exoPlayerView.setUseTextureView(useTextureView);
    }

    public void setBufferConfig(int newMinBufferMs, int newMaxBufferMs, int newBufferForPlaybackMs, int newBufferForPlaybackAfterRebufferMs) {
        minBufferMs = newMinBufferMs;
        maxBufferMs = newMaxBufferMs;
        bufferForPlaybackMs = newBufferForPlaybackMs;
        bufferForPlaybackAfterRebufferMs = newBufferForPlaybackAfterRebufferMs;
        releasePlayer();
        initializePlayer();
	}

    public void setColorProgressBar(String color) {
        try {
            accentColor = Color.parseColor(color);
            previewSeekBarLayout.setTintColor(accentColor);

            DrawableUtils.setTint(playPauseButton.getBackground(), accentColor);
            DrawableUtils.setTint(audioSubtitlesButton.getBackground(), accentColor);

        } catch (IllegalArgumentException e) {
            Log.e(getClass().getSimpleName(), e.getMessage(), e);
        }
    }

    public void setLive(final boolean live) {
        this.live = live;
        if (liveTextView != null && currentTextView != null && previewSeekBarLayout != null && durationTextView != null) {
            liveTextView.setVisibility(live ? VISIBLE : GONE);
            @IntegerRes
            int controlsVisibility = live ? GONE : VISIBLE;
            currentTextView.setVisibility(controlsVisibility);
            previewSeekBarLayout.setVisibility(controlsVisibility);
            durationTextView.setVisibility(controlsVisibility);
            dividerTextView.setVisibility(controlsVisibility);
            playPauseButton.setVisibility(controlsVisibility);
        }
    }

    public void setControlsOpacity(final float opacity) {
        float newTranslationY = ((1 - opacity) * bottomBarWidget.getHeight() * 0.5f);
        if (newTranslationY < 0) {
            newTranslationY = 0;
        } else if (newTranslationY > bottomBarWidget.getHeight()) {
            newTranslationY = bottomBarWidget.getHeight();
        }
        bottomBarWidget.setTranslationY(newTranslationY);
        controls.setAlpha(opacity);
    }

    public void setIconBottomRight(@Nullable String icon) {
        if (icon != null) {
            switch (icon) {
                case "fullscreenOn":
                    bottomRightIconButton.setImageResource(R.drawable.ic_fullscreen_on);
                    break;
                case "fullscreenOff":
                    bottomRightIconButton.setImageResource(R.drawable.ic_fullscreen_off);
                    break;
                case "zoomCompress":
                    bottomRightIconButton.setImageResource(R.drawable.ic_zoom_compress);
                    break;
                case "zoomExpand":
                    bottomRightIconButton.setImageResource(R.drawable.ic_zoom_expand);
                    break;
                default:
                    break;
            }
        }
    }

    public void setProgressBarMarginBottom(int marginBottom) {
        bottomBarWidgetContainer.setTranslationY(-DensityPixels.dpToPx(marginBottom));
    }

    public void setStateOverlay(final String state) {
        float alpha = getAlphaFromState(state);
        controls.animate().alpha(alpha).setDuration(ANIMATION_DURATION_CONTROLS_VISIBILITY).start();
    }

    public void setStateMiddleCoreControls(final String state) {
        float alpha = getAlphaFromState(state);

        playPauseButton.setAlpha(alpha);
    }

    public void setStateProgressBar(final String state) {
        boolean enabled = getEnabledFromState(state);
        float alpha = getAlphaFromState(state);

        float newTranslationY = ((1 - alpha) * bottomBarWidget.getHeight() * 0.5f);
        if (newTranslationY < 0) {
            newTranslationY = 0;
        } else if (newTranslationY > bottomBarWidget.getHeight()) {
            newTranslationY = bottomBarWidget.getHeight();
        }
        bottomBarWidget.setTranslationY(newTranslationY);


        bottomBarWidgetContainer.animate().alpha(alpha).start();
        bottomBarWidgetContainer.setEnabled(enabled);
        bottomBarWidget.setAlpha(alpha);
        currentTextView.setEnabled(enabled);
        currentTextView.setAlpha(alpha);
        durationTextView.setEnabled(enabled);
        durationTextView.setAlpha(alpha);
        previewSeekBarLayout.setEnabled(enabled);
        previewSeekBarLayout.setAlpha(alpha);
        bottomRightIconButton.setEnabled(enabled);
        bottomRightIconButton.setAlpha(alpha);
        ProgressBar progressBar = (ProgressBar) previewSeekBarLayout.getPreviewView();
        if (progressBar != null) {
            progressBar.setEnabled(enabled);
        }
    }

    public void setControlsVisibilityGestureDisabled(final boolean disabled) {
        controlsVisibilityGestureDisabled = disabled;
    }

    private void animateControls(final float opacity, final long duration) {
        postDelayed(new Runnable() {
            @Override
            public void run() {
                float newTranslationY = ((1 - opacity) * bottomBarWidget.getHeight() * 0.5f);
                if (newTranslationY < 0) {
                    newTranslationY = 0;
                } else if (newTranslationY > bottomBarWidget.getHeight()) {
                    newTranslationY = bottomBarWidget.getHeight();
                }

                bottomBarWidget.setTranslationY(newTranslationY);
                bottomBarWidget.setAlpha(opacity);
            }
        }, 150);
    }

    private boolean getEnabledFromState(String stateStr) {
        ControlState state = ControlState.make(stateStr);
        switch (state) {
            case HIDDEN:
                return false;
            case INACTIVE:
                return false;
            case ACTIVE:
            case UNKNOWN:
            default:
                return true;
        }
    }

    private float getAlphaFromState(String stateStr) {
        ControlState state = ControlState.make(stateStr);
        switch (state) {
            case HIDDEN:
                return 0;
            case INACTIVE:
                return 0.5f;
            case ACTIVE:
            case UNKNOWN:
            default:
                return 1.0f;
        }
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {
        super.onLayout(changed, l, t, r, b);

        if (muxStats != null) {
            muxStats.setVideoView(exoPlayerView.getVideoSurfaceView());
        }
    }

    private Long keyPressTime;
    private boolean keyNotHandled;

    private Long controlsAutoHideTimeout;
    private Runnable hideRunnable = new Runnable() {
        @Override
        public void run() {
            setStateOverlay(ControlState.HIDDEN.toString());
        }
    };

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {

            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_DPAD_LEFT:
                case KeyEvent.KEYCODE_DPAD_RIGHT:
                case KeyEvent.KEYCODE_DPAD_UP:
                case KeyEvent.KEYCODE_DPAD_DOWN:
                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                    if (controls.getAlpha() == 0.0f) {
                        showOverlay();
                        return true;
                    } else {
                        showOverlay();
                    }
            }

            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_DPAD_LEFT:
                case KeyEvent.KEYCODE_DPAD_RIGHT:
                case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                case KeyEvent.KEYCODE_MEDIA_REWIND:

                    if (live) {
                        break;
                    }

                    if (previewSeekBarLayout.getPreviewView() instanceof SeekBar && ((SeekBar) previewSeekBarLayout.getPreviewView()).hasFocus()) {
                        final long currentTime = System.currentTimeMillis();

                        final int increment;
                        if (keyPressTime == null) {
                            keyPressTime = currentTime;
                            keyNotHandled = true;
                            showOverlay();
                            return true;
                        } else if ((currentTime - keyPressTime) / 1000 > 10) {
                            increment = 40;
                        } else if ((currentTime - keyPressTime) / 1000 > 6) {
                            increment = 25;
                        } else if ((currentTime - keyPressTime) / 1000 > 3) {
                            increment = 10;
                        } else {
                            increment = 1;
                        }

                        ((SeekBar) previewSeekBarLayout.getPreviewView()).setKeyProgressIncrement(increment * 1000);
                    }

                    keyNotHandled = false;
                    break;
            }
        } else if (event.getAction() == KeyEvent.ACTION_UP) {

            if (keyNotHandled && previewSeekBarLayout.getPreviewView() instanceof SeekBar && ((SeekBar) previewSeekBarLayout.getPreviewView()).hasFocus()) {
                switch (event.getKeyCode()) {
                    case KeyEvent.KEYCODE_DPAD_LEFT:
                    case KeyEvent.KEYCODE_MEDIA_REWIND: {
                        long position = player.getCurrentPosition() - 10000;
                        if (position < 0) {
                            position = 0;
                        }
                        player.seekTo(position);
                        updateProgressControl(position);
                        break;
                    }
                    case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                    case KeyEvent.KEYCODE_DPAD_RIGHT: {
                        long position = player.getCurrentPosition() + 10000;
                        if (position > player.getDuration()) {
                            position = player.getDuration();
                        }
                        player.seekTo(position);
                        updateProgressControl(position);
                        break;
                    }
                }
            }

            if (!isPaused) {
                hideOverlay();
            }

            keyPressTime = null;
            keyNotHandled = false;
        }

        return super.dispatchKeyEvent(event);
    }

    public void showOverlay() {

        if (controlsAutoHideTimeout != null) {
            removeCallbacks(hideRunnable);
        }
        setStateOverlay(ControlState.ACTIVE.toString());

        if (isPaused) {
            controls.setBackgroundResource(R.drawable.bg_controls);
        } else {
            controls.setBackground(null);
        }
    }

    public void hideOverlay() {
        if (controlsAutoHideTimeout != null) {
            postDelayed(hideRunnable, controlsAutoHideTimeout);
        } else {
            setStateOverlay(ControlState.HIDDEN.toString());
        }
    }

    public void setOverlayAutoHideTimeout(Long hideTimeout) {
        controlsAutoHideTimeout = hideTimeout;
    }
}
