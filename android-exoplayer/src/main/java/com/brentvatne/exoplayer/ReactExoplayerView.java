package com.brentvatne.exoplayer;

import static com.google.android.exoplayer2.DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF;
import static com.google.android.exoplayer2.trackselection.MappingTrackSelector.MappedTrackInfo.RENDERER_SUPPORT_UNSUPPORTED_TRACKS;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.ImageButton;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.DefaultRenderersFactory.ExtensionRendererMode;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.RenderersFactory;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.drm.DefaultDrmSessionManager;
import com.google.android.exoplayer2.drm.DrmSessionEventListener;
import com.google.android.exoplayer2.drm.DrmSessionManager;
import com.google.android.exoplayer2.drm.ExoMediaDrm;
import com.google.android.exoplayer2.drm.FrameworkMediaDrm;
import com.google.android.exoplayer2.drm.HttpMediaDrmCallback;
import com.google.android.exoplayer2.drm.UnsupportedDrmException;
import com.google.android.exoplayer2.mediacodec.MediaCodecInfo;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer;
import com.google.android.exoplayer2.mediacodec.MediaCodecUtil;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.source.BehindLiveWindowException;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.MergingMediaSource;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.source.SingleSampleMediaSource;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.source.dash.DashMediaSource;
import com.google.android.exoplayer2.source.dash.DefaultDashChunkSource;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.DefaultSsChunkSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.ExoTrackSelection;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector.MappedTrackInfo;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.ui.PlayerControlView;
import com.google.android.exoplayer2.upstream.BandwidthMeter;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultAllocator;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.HttpDataSource;
import com.google.android.exoplayer2.util.Util;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

@SuppressLint("ViewConstructor")
class ReactExoplayerView extends FrameLayout implements
        LifecycleEventListener,
        Player.Listener,
        BandwidthMeter.EventListener,
        BecomingNoisyListener,
        AudioManager.OnAudioFocusChangeListener,
        DrmSessionEventListener {

    private static final String TAG = "ReactExoplayerView";

    private static final CookieManager DEFAULT_COOKIE_MANAGER = new CookieManager();
    private static final int SHOW_PROGRESS = 1;

    private final VideoEventEmitter eventEmitter;
    private final ReactExoplayerConfig config;
    private final DefaultBandwidthMeter bandwidthMeter;
    private PlayerControlView playerControlView;
    private View playPauseControlContainer;
    private Player.Listener eventListener;

    private ExoPlayerView exoPlayerView;

    private DataSource.Factory mediaDataSourceFactory;
    private SimpleExoPlayer player;
    private DefaultTrackSelector trackSelector;
    private boolean playerNeedsSource;
    @Nullable
    private TrackGroupArray lastSeenTrackGroupArray;

    private int resumeWindow;
    private long resumePosition;
    private boolean loadVideoStarted;
    private boolean isFullscreen;
    private boolean isInBackground;
    private boolean isPaused;
    private boolean isBuffering;
    private boolean muted = false;
    private boolean hasAudioFocus = false;
    private float rate = 1f;
    private float audioVolume = 1f;
    private int minLoadRetryCount = 3;
    private int maxBitRate = 0;

    private int minBufferMs = DefaultLoadControl.DEFAULT_MIN_BUFFER_MS;
    private int maxBufferMs = DefaultLoadControl.DEFAULT_MAX_BUFFER_MS;
    private int bufferForPlaybackMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS;
    private int bufferForPlaybackAfterRebufferMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS;

    private Handler mainHandler;

    // Props from React
    private Uri srcUri;
    private String extension;
    private boolean repeat;
    private String audioTrackType;
    private Dynamic audioTrackValue;
    private String videoTrackType;
    private Dynamic videoTrackValue;
    private String textTrackType;
    private Dynamic textTrackValue;
    private ReadableArray textTracks;
    private boolean disableFocus;
    private boolean preventsDisplaySleepDuringVideoPlayback = true;
    private float mProgressUpdateInterval = 250.0f;
    private boolean playInBackground = false;
    private Map<String, String> requestHeaders;
    private boolean mReportBandwidth = false;
    private CookiesPolicy mCookiesPolicy = CookiesPolicy.SYSTEM_DEFAULT;
    private UUID drmUUID = null;
    private String drmLicenseUrl = null;
    private String[] drmLicenseHeader = null;
    private boolean controls;
    @ExtensionRendererMode
    private int extensionRenderMode = EXTENSION_RENDERER_MODE_OFF;
    // \ End props

    // React
    private final ThemedReactContext themedReactContext;
    private final AudioManager audioManager;
    private final AudioBecomingNoisyReceiver audioBecomingNoisyReceiver;

    private final Handler progressHandler = new Handler(Looper.getMainLooper()) {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case SHOW_PROGRESS:
                    if (player != null
                            && player.getPlaybackState() == Player.STATE_READY
                            && player.getPlayWhenReady()
                            ) {
                        long pos = player.getCurrentPosition();
                        long bufferedDuration = player.getBufferedPercentage() * player.getDuration() / 100;
                        eventEmitter.progressChanged(pos, bufferedDuration, player.getDuration(), getPositionInFirstPeriodMsForCurrentWindow(pos));
                        msg = obtainMessage(SHOW_PROGRESS);
                        sendMessageDelayed(msg, Math.round(mProgressUpdateInterval));
                    }
                    break;
            }
        }
    };
    
    public double getPositionInFirstPeriodMsForCurrentWindow(long currentPosition) {
        Timeline.Window window = new Timeline.Window();
        if(!player.getCurrentTimeline().isEmpty()) {    
            player.getCurrentTimeline().getWindow(player.getCurrentWindowIndex(), window);
        }
        return window.windowStartTimeMs + currentPosition;
    }

    public ReactExoplayerView(ThemedReactContext context, ReactExoplayerConfig config) {
        super(context);
        this.themedReactContext = context;
        this.eventEmitter = new VideoEventEmitter(context);
        this.config = config;
        this.bandwidthMeter = config.getBandwidthMeter();

        createViews();

        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        themedReactContext.addLifecycleEventListener(this);
        audioBecomingNoisyReceiver = new AudioBecomingNoisyReceiver(themedReactContext);
    }


    @Override
    public void setId(int id) {
        super.setId(id);
        eventEmitter.setViewId(id);
    }

    private void createViews() {
        clearResumePosition();
        mediaDataSourceFactory = buildDataSourceFactory(true);
        applyCookiesPolicy();

        LayoutParams layoutParams = new LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT);
        exoPlayerView = new ExoPlayerView(getContext());
        exoPlayerView.setLayoutParams(layoutParams);

        addView(exoPlayerView, 0, layoutParams);

        mainHandler = new Handler();
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        initializePlayer();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        /* We want to be able to continue playing audio when switching tabs.
         * Leave this here in case it causes issues.
         */
        // stopPlayback();
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

    //BandwidthMeter.EventListener implementation
    @Override
    public void onBandwidthSample(int elapsedMs, long bytes, long bitrate) {
        if (mReportBandwidth) {
            if (player == null) {
                eventEmitter.bandwidthReport(bitrate, 0, 0, "-1");
            } else {
                Format videoFormat = player.getVideoFormat();
                int width = videoFormat != null ? videoFormat.width : 0;
                int height = videoFormat != null ? videoFormat.height : 0;
                String trackId = videoFormat != null ? videoFormat.id : "-1";
                eventEmitter.bandwidthReport(bitrate, height, width, trackId);
            }
        }
    }

    // Internal methods

    /**
     * Toggling the visibility of the player control view
     */
    private void togglePlayerControlVisibility() {
        if(player == null) return;
        reLayout(playerControlView);
        if (playerControlView.isVisible()) {
            playerControlView.hide();
        } else {
            playerControlView.show();
        }
    }

    /**
     * Initializing Player control
     */
    private void initializePlayerControl() {
        if (playerControlView == null) {
            playerControlView = new PlayerControlView(getContext());
        }

        // Setting the player for the playerControlView
        playerControlView.setPlayer(player);
        playerControlView.show();
        playPauseControlContainer = playerControlView.findViewById(R.id.exo_play_pause_container);

        // Invoking onClick event for exoplayerView
        exoPlayerView.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                togglePlayerControlVisibility();
            }
        });

        //Handling the playButton click event
        ImageButton playButton = playerControlView.findViewById(R.id.exo_play);
        playButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (player != null && player.getPlaybackState() == Player.STATE_ENDED) {
                    player.seekTo(0);
                }
                setPausedModifier(false);
            }
        });

        //Handling the pauseButton click event
        ImageButton pauseButton = playerControlView.findViewById(R.id.exo_pause);
        pauseButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setPausedModifier(true);
            }
        });

        // Invoking onPlayerStateChanged event for Player
        eventListener = new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                reLayout(playPauseControlContainer);
                //Remove this eventListener once its executed. since UI will work fine once after the reLayout is done
                player.removeListener(eventListener);
            }

            @Override
            public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
                reLayout(playPauseControlContainer);
                //Remove this eventListener once its executed. since UI will work fine once after the reLayout is done
                player.removeListener(eventListener);
            }
        };
        player.addListener(eventListener);
    }

    /**
     * Adding Player control to the frame layout
     */
    private void addPlayerControl() {
        if(player == null) return;
        LayoutParams layoutParams = new LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT);
        playerControlView.setLayoutParams(layoutParams);
        int indexOfPC = indexOfChild(playerControlView);
        if (indexOfPC != -1) {
            removeViewAt(indexOfPC);
        }
        addView(playerControlView, 1, layoutParams);
    }

    /**
     * Update the layout
     * @param view  view needs to update layout
     *
     * This is a workaround for the open bug in react-native: https://github.com/facebook/react-native/issues/17968
     */
    private void reLayout(View view) {
        if (view == null) return;
        view.measure(MeasureSpec.makeMeasureSpec(getMeasuredWidth(), MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(getMeasuredHeight(), MeasureSpec.EXACTLY));
        view.layout(view.getLeft(), view.getTop(), view.getMeasuredWidth(), view.getMeasuredHeight());
    }

    private void initializePlayer() {
        ReactExoplayerView self = this;
        // This ensures all props have been settled, to avoid async racing conditions.
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                if (player == null) {
                    ExoTrackSelection.Factory videoTrackSelectionFactory = new AdaptiveTrackSelection.Factory();
                    trackSelector = new DefaultTrackSelector(getContext(), videoTrackSelectionFactory);
                    trackSelector.setParameters(trackSelector.buildUponParameters()
                            .setMaxVideoBitrate(maxBitRate == 0 ? Integer.MAX_VALUE : maxBitRate));

                    DefaultAllocator allocator = new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
                    DefaultLoadControl.Builder defaultLoadControlBuilder = new DefaultLoadControl.Builder();
                    defaultLoadControlBuilder.setAllocator(allocator);
                    defaultLoadControlBuilder.setBufferDurationsMs(minBufferMs, maxBufferMs, bufferForPlaybackMs, bufferForPlaybackAfterRebufferMs);
                    defaultLoadControlBuilder.setTargetBufferBytes(-1);
                    defaultLoadControlBuilder.setPrioritizeTimeOverSizeThresholds(true);
                    DefaultLoadControl defaultLoadControl = defaultLoadControlBuilder.build();
                    RenderersFactory renderersFactory = new DolbyRendersFactory(getContext())
                                    .setExtensionRendererMode(extensionRenderMode);
                    player = new SimpleExoPlayer.Builder(getContext(), renderersFactory)
                                .setTrackSelector(trackSelector)
                                .setBandwidthMeter(bandwidthMeter)
                                .setLoadControl(defaultLoadControl)
                                .build();
                    player.addListener(self);
                    exoPlayerView.setPlayer(player);
                    audioBecomingNoisyReceiver.setListener(self);
                    bandwidthMeter.addEventListener(new Handler(), self);
                    setPlayWhenReady(!isPaused);
                    playerNeedsSource = true;

                    PlaybackParameters params = new PlaybackParameters(rate, 1f);
                    player.setPlaybackParameters(params);
                }
                if (playerNeedsSource && srcUri != null) {
                    exoPlayerView.invalidateAspectRatio();
                    // DRM
                    DrmSessionManager drmSessionManager = null;
                    if (self.drmUUID != null) {
                        try {
                            drmSessionManager = buildDrmSessionManager(self.drmUUID, self.drmLicenseUrl,
                                    self.drmLicenseHeader);
                        } catch (UnsupportedDrmException e) {
                            int errorStringId = Util.SDK_INT < 18 ? R.string.error_drm_not_supported
                                    : (e.reason == UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME
                                    ? R.string.error_drm_unsupported_scheme : R.string.error_drm_unknown);
                            eventEmitter.error(getResources().getString(errorStringId), e);
                            return;
                        }
                    }
                    // End DRM

                    ArrayList<MediaSource> mediaSourceList = buildTextSources();
                    MediaSource videoSource = buildMediaSource(srcUri, extension, drmSessionManager);
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
                    player.setMediaSource(mediaSource, !haveResumePosition);
                    player.prepare();
                    playerNeedsSource = false;

                    reLayout(exoPlayerView);
                    eventEmitter.loadStart();
                    loadVideoStarted = true;
                }

                // Initializing the playerControlView
                initializePlayerControl();
                setControls(controls);
                applyModifiers();
            }
        }, 1);
    }

    private DrmSessionManager buildDrmSessionManager(UUID uuid,
                                                                           String licenseUrl, String[] keyRequestPropertiesArray) throws UnsupportedDrmException {
        if (Util.SDK_INT < 18) {
            return null;
        }
        HttpMediaDrmCallback drmCallback = new HttpMediaDrmCallback(licenseUrl,
                buildHttpDataSourceFactory(false));
        if (keyRequestPropertiesArray != null) {
            for (int i = 0; i < keyRequestPropertiesArray.length - 1; i += 2) {
                drmCallback.setKeyRequestProperty(keyRequestPropertiesArray[i],
                        keyRequestPropertiesArray[i + 1]);
            }
        }
        return new DefaultDrmSessionManager.Builder()
                .setUuidAndExoMediaDrmProvider(uuid, new ExoMediaDrm.AppManagedProvider(FrameworkMediaDrm.newInstance(uuid)))
                .setKeyRequestParameters(null)
                .setMultiSession(false)
                .build(drmCallback);
    }

    private MediaSource buildMediaSource(Uri uri, String overrideExtension, DrmSessionManager drmSessionManager) {
        int type = Util.inferContentType(!TextUtils.isEmpty(overrideExtension) ? "." + overrideExtension
                : uri.getLastPathSegment());
        MediaItem mediaItem = new MediaItem.Builder().setUri(uri).build();
        switch (type) {
            case C.TYPE_SS:
                return new SsMediaSource.Factory(
                        new DefaultSsChunkSource.Factory(mediaDataSourceFactory),
                        buildDataSourceFactory(false)
                ).setDrmSessionManager(drmSessionManager)
                 .setLoadErrorHandlingPolicy(
                        config.buildLoadErrorHandlingPolicy(minLoadRetryCount)
                ).createMediaSource(mediaItem);
            case C.TYPE_DASH:
                return new DashMediaSource.Factory(
                        new DefaultDashChunkSource.Factory(mediaDataSourceFactory),
                        buildDataSourceFactory(false)
                ).setDrmSessionManager(drmSessionManager)
                 .setLoadErrorHandlingPolicy(
                        config.buildLoadErrorHandlingPolicy(minLoadRetryCount)
                ).createMediaSource(mediaItem);
            case C.TYPE_HLS:
                return new HlsMediaSource.Factory(
                        mediaDataSourceFactory
                ).setDrmSessionManager(drmSessionManager)
                 .setLoadErrorHandlingPolicy(
                        config.buildLoadErrorHandlingPolicy(minLoadRetryCount)
                ).createMediaSource(mediaItem);
            case C.TYPE_OTHER:
                return new ProgressiveMediaSource.Factory(
                        mediaDataSourceFactory
                ).setDrmSessionManager(drmSessionManager)
                 .setLoadErrorHandlingPolicy(
                        config.buildLoadErrorHandlingPolicy(minLoadRetryCount)
                ).createMediaSource(mediaItem);
            default: {
                throw new IllegalStateException("Unsupported type: " + type);
            }
        }
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
        MediaItem.Subtitle subtitle = new MediaItem.Subtitle(uri, mimeType, language, C.SELECTION_FLAG_DEFAULT, C.ROLE_FLAG_SUBTITLE, title);
        return new SingleSampleMediaSource.Factory(mediaDataSourceFactory)
                .createMediaSource(subtitle, C.TIME_UNSET);
    }

    private void releasePlayer() {
        if (player != null) {
            updateResumePosition();
            player.release();
            player.removeListener(this);
            trackSelector = null;
            player = null;
        }
        progressHandler.removeMessages(SHOW_PROGRESS);
        themedReactContext.removeLifecycleEventListener(this);
        audioBecomingNoisyReceiver.removeListener();
        bandwidthMeter.removeEventListener(this);
    }

    private boolean requestAudioFocus() {
        if (disableFocus || srcUri == null || this.hasAudioFocus) {
            return true;
        }
        int result = audioManager.requestAudioFocus(this,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN);
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void setPlayWhenReady(boolean playWhenReady) {
        if (player == null) {
            return;
        }

        if (playWhenReady) {
            this.hasAudioFocus = requestAudioFocus();
            if (this.hasAudioFocus) {
                player.setPlayWhenReady(true);
            }
        } else {
            player.setPlayWhenReady(false);
        }
    }

    private void startPlayback() {
        if (player != null) {
            switch (player.getPlaybackState()) {
                case Player.STATE_IDLE:
                case Player.STATE_ENDED:
                    initializePlayer();
                    break;
                case Player.STATE_BUFFERING:
                case Player.STATE_READY:
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
            setKeepScreenOn(preventsDisplaySleepDuringVideoPlayback);
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
        audioManager.abandonAudioFocus(this);
    }

    private void updateResumePosition() {
        resumeWindow = player.getCurrentWindowIndex();
        resumePosition = player.isCurrentWindowSeekable() ? Math.max(0, player.getCurrentPosition())
                : C.TIME_UNSET;
    }

    private void clearResumePosition() {
        resumeWindow = C.INDEX_UNSET;
        resumePosition = C.TIME_UNSET;
    }

    /**
     * Returns a new DataSource factory.
     *
     * @param useBandwidthMeter Whether to set {@link #bandwidthMeter} as a listener to the new
     *                          DataSource factory.
     * @return A new DataSource factory.
     */
    private DataSource.Factory buildDataSourceFactory(boolean useBandwidthMeter) {
        return DataSourceUtil.getDefaultDataSourceFactory(this.themedReactContext,
                useBandwidthMeter ? bandwidthMeter : null, requestHeaders);
    }

    /**
     * Returns a new HttpDataSource factory.
     *
     * @param useBandwidthMeter Whether to set {@link #bandwidthMeter} as a listener to the new
     *     DataSource factory.
     * @return A new HttpDataSource factory.
     */
    private HttpDataSource.Factory buildHttpDataSourceFactory(boolean useBandwidthMeter) {
        return DataSourceUtil.getDefaultHttpDataSourceFactory(this.themedReactContext, useBandwidthMeter ? bandwidthMeter : null, requestHeaders);
    }


    // AudioManager.OnAudioFocusChangeListener implementation

    @Override
    public void onAudioFocusChange(int focusChange) {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_LOSS:
                this.hasAudioFocus = false;
                eventEmitter.audioFocusChanged(false);
                pausePlayback();
                audioManager.abandonAudioFocus(this);
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                eventEmitter.audioFocusChanged(false);
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                this.hasAudioFocus = true;
                eventEmitter.audioFocusChanged(true);
                break;
            default:
                break;
        }

        if (player != null) {
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                // Lower the volume
                if (!muted) {
                    player.setVolume(audioVolume * 0.8f);
                }
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                // Raise it back to normal
                if (!muted) {
                    player.setVolume(audioVolume * 1);
                }
            }
        }
    }

    // AudioBecomingNoisyListener implementation

    @Override
    public void onAudioBecomingNoisy() {
        eventEmitter.audioBecomingNoisy();
    }

    // Player.Listener implementation

    @Override
    public void onIsLoadingChanged(boolean isLoading) {
        // Do nothing.
    }

    @Override
    public void onEvents(Player player, Player.Events events) {
        if (events.contains(Player.EVENT_PLAYBACK_STATE_CHANGED) || events.contains(Player.EVENT_PLAY_WHEN_READY_CHANGED)) {
            int playbackState = player.getPlaybackState();
            boolean playWhenReady = player.getPlayWhenReady();
            String text = "onStateChanged: playWhenReady=" + playWhenReady + ", playbackState=";
            switch (playbackState) {
                case Player.STATE_IDLE:
                    text += "idle";
                    eventEmitter.idle();
                    clearProgressMessageHandler();
                    if (!player.getPlayWhenReady()) {
                        setKeepScreenOn(false);
                    }
                    break;
                case Player.STATE_BUFFERING:
                    text += "buffering";
                    onBuffering(true);
                    clearProgressMessageHandler();
                    setKeepScreenOn(preventsDisplaySleepDuringVideoPlayback);
                    break;
                case Player.STATE_READY:
                    text += "ready";
                    eventEmitter.ready();
                    onBuffering(false);
                    startProgressHandler();
                    videoLoaded();
                    // Setting the visibility for the playerControlView
                    if (playerControlView != null) {
                        playerControlView.show();
                    }
                    setKeepScreenOn(preventsDisplaySleepDuringVideoPlayback);
                    break;
                case Player.STATE_ENDED:
                    text += "ended";
                    eventEmitter.end();
                    onStopPlayback();
                    setKeepScreenOn(false);
                    break;
                default:
                    text += "unknown";
                    break;
            }
            Log.d(TAG, text);
        }
    }

    private void startProgressHandler() {
        progressHandler.sendEmptyMessage(SHOW_PROGRESS);
    }

    /*
        The progress message handler will duplicate recursions of the onProgressMessage handler
        on change of player state from any state to STATE_READY with playWhenReady is true (when
        the video is not paused). This clears all existing messages.
     */
    private void clearProgressMessageHandler() {
         progressHandler.removeMessages(SHOW_PROGRESS);
    }

    private void videoLoaded() {
        if (loadVideoStarted) {
            loadVideoStarted = false;
            setSelectedAudioTrack(audioTrackType, audioTrackValue);
            setSelectedVideoTrack(videoTrackType, videoTrackValue);
            setSelectedTextTrack(textTrackType, textTrackValue);
            Format videoFormat = player.getVideoFormat();
            int width = videoFormat != null ? videoFormat.width : 0;
            int height = videoFormat != null ? videoFormat.height : 0;
            String trackId = videoFormat != null ? videoFormat.id : "-1";
            MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
            eventEmitter.load(
                    player.getDuration(),
                    player.getCurrentPosition(),
                    width,
                    height,
                    TracksUtil.getAudioTrackInfo(info),
                    TracksUtil.getTextTrackInfo(info),
                    TracksUtil.getVideoTrackInfo(info),
                    trackId);
        }
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
    }

    @Override
    public void onPositionDiscontinuity(Player.PositionInfo oldPosition, Player.PositionInfo newPosition, int reason) {
        if (playerNeedsSource) {
            // This will only occur if the user has performed a seek whilst in the error state. Update the
            // resume position so that if the user then retries, playback will resume from the position to
            // which they seeked.
            updateResumePosition();
        }
        // When repeat is turned on, reaching the end of the video will not cause a state change
        // so we need to explicitly detect it.
        if (reason == Player.DISCONTINUITY_REASON_AUTO_TRANSITION
                && player.getRepeatMode() == Player.REPEAT_MODE_ONE) {
            eventEmitter.end();
        }
    }


    @Override
    public void onTimelineChanged(Timeline timeline, int reason) {
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
    public void onTracksChanged(@NonNull TrackGroupArray trackGroups, @NonNull TrackSelectionArray trackSelections) {
        if (trackGroups != lastSeenTrackGroupArray) {
            MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
            if (mappedTrackInfo != null) {
                if (mappedTrackInfo.getTypeSupport(C.TRACK_TYPE_VIDEO) == RENDERER_SUPPORT_UNSUPPORTED_TRACKS) {
                    eventEmitter.unsupportedTrack(C.TRACK_TYPE_VIDEO);
                }
                if (mappedTrackInfo.getTypeSupport(C.TRACK_TYPE_AUDIO) == RENDERER_SUPPORT_UNSUPPORTED_TRACKS) {
                    eventEmitter.unsupportedTrack(C.TRACK_TYPE_AUDIO);
                }
            }
            lastSeenTrackGroupArray = trackGroups;
        }
    }

    @Override
    public void onPlaybackParametersChanged(PlaybackParameters params) {
        eventEmitter.playbackRateChange(params.speed);
    }

    @Override
    public void onPlayerError(PlaybackException error) {
        if (!(error instanceof ExoPlaybackException)) {
            return;
        }
        ExoPlaybackException e = (ExoPlaybackException)error;
        String errorString = "ExoPlaybackException type : " + e.type;
        if (e.type == ExoPlaybackException.TYPE_RENDERER) {
            Exception cause = e.getRendererException();
            if (cause instanceof MediaCodecRenderer.DecoderInitializationException) {
                // Special case for decoder initialization failures.
                MediaCodecRenderer.DecoderInitializationException decoderInitializationException =
                        (MediaCodecRenderer.DecoderInitializationException) cause;
                MediaCodecInfo codecInfo = decoderInitializationException.codecInfo;
                if (codecInfo == null || codecInfo.name == null) {
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
                    errorString = getResources().getString(R.string.error_instantiating_decoder, codecInfo.name);
                }
            }
        }
        else if (e.type == ExoPlaybackException.TYPE_SOURCE) {
            errorString = getResources().getString(R.string.unrecognized_media_format);
        }
        eventEmitter.error(errorString, e);
        playerNeedsSource = true;
        if (isBehindLiveWindow(e)) {
            clearResumePosition();
            initializePlayer();
        } else {
            updateResumePosition();
        }
    }

    private static boolean isBehindLiveWindow(ExoPlaybackException e) {
        Log.e("ExoPlayer Exception", e.toString());
        if (e.type != ExoPlaybackException.TYPE_SOURCE) {
            return false;
        }
        Throwable cause = e.getSourceException();
        while (cause != null) {
            if (cause instanceof BehindLiveWindowException ||
                    cause instanceof HttpDataSource.HttpDataSourceException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    public int getTrackRendererIndex(int trackType) {
        if (player != null) {
            int rendererCount = player.getRendererCount();
            for (int rendererIndex = 0; rendererIndex < rendererCount; rendererIndex++) {
                if (player.getRendererType(rendererIndex) == trackType) {
                    return rendererIndex;
                }
            }
        }
        return C.INDEX_UNSET;
    }

    @Override
    public void onMetadata(Metadata metadata) {
        eventEmitter.timedMetadata(metadata);
    }

    // ReactExoplayerViewManager public api

    public void setSrc(final Uri uri, final String extension, Map<String, String> headers) {
        if (uri != null) {
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.requestHeaders = headers;
            this.mediaDataSourceFactory =
                    DataSourceUtil.getDefaultDataSourceFactory(this.themedReactContext, bandwidthMeter,
                            this.requestHeaders);

            if (!isSourceEqual) {
                reloadSource();
            }
        }
    }

    public void clearSrc() {
        if (srcUri != null) {
            player.stop(true);
            this.srcUri = null;
            this.extension = null;
            this.requestHeaders = null;
            this.mediaDataSourceFactory = null;
            clearResumePosition();
        }
    }

    public void setProgressUpdateInterval(final float progressUpdateInterval) {
        mProgressUpdateInterval = progressUpdateInterval;
    }

    public void setReportBandwidth(boolean reportBandwidth) {
        mReportBandwidth = reportBandwidth;
    }

    public void setCookiesPolicy(String cookiesPolicy) {
        mCookiesPolicy = CookiesPolicy.valueOf(cookiesPolicy);
        applyCookiesPolicy();
    }

    private void applyCookiesPolicy() {
        if (mCookiesPolicy.cookiePolicy != null) {
            DEFAULT_COOKIE_MANAGER.setCookiePolicy(mCookiesPolicy.cookiePolicy);
            CookieHandler.setDefault(DEFAULT_COOKIE_MANAGER);
        } else {
            CookieHandler.setDefault(null);
        }
    }

    public void setRawSrc(final Uri uri, final String extension) {
        if (uri != null) {
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.mediaDataSourceFactory = buildDataSourceFactory(true);

            if (!isSourceEqual) {
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

    private void applyModifiers() {
        setRepeatModifier(repeat);
        setMutedModifier(muted);
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

    public void setPreventsDisplaySleepDuringVideoPlayback(boolean preventsDisplaySleepDuringVideoPlayback) {
        this.preventsDisplaySleepDuringVideoPlayback = preventsDisplaySleepDuringVideoPlayback;
    }

    public void setSelectedVideoTrack(String type, Dynamic value) {
        videoTrackType = type;
        videoTrackValue = value;
        setSelectedTrack(C.TRACK_TYPE_VIDEO, videoTrackType, videoTrackValue);
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

    public void setSelectedTrack(int trackType, String type, Dynamic value) {
        if (player == null) return;
        MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
        if (info == null) return;
        DefaultTrackSelector.Parameters parameters = TracksUtil.buildSelectionParameters(
                themedReactContext,
                trackSelector.getParameters(),
                info,
                trackType,
                type,
                value);
        trackSelector.setParameters(parameters);
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
    }

    public void setMutedModifier(boolean muted) {
        this.muted = muted;
        audioVolume = muted ? 0.f : 1.f;
        if (player != null) {
            player.setVolume(audioVolume);
        }
    }


    public void setVolumeModifier(float volume) {
        audioVolume = volume;
        if (player != null) {
            player.setVolume(audioVolume);
        }
    }

    public void seekTo(long positionMs) {
        if (player != null) {
            player.seekTo(positionMs);
            eventEmitter.seek(player.getCurrentPosition(), positionMs);
        }
    }

    public void setRateModifier(float newRate) {
        rate = newRate;

        if (player != null) {
            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            player.setPlaybackParameters(params);
        }
    }

    public void setMaxBitRateModifier(int newMaxBitRate) {
        maxBitRate = newMaxBitRate;
        if (player != null) {
            trackSelector.setParameters(trackSelector.buildUponParameters()
                    .setMaxVideoBitrate(maxBitRate == 0 ? Integer.MAX_VALUE : maxBitRate));
        }
    }

    public void setMinLoadRetryCountModifier(int newMinLoadRetryCount) {
        minLoadRetryCount = newMinLoadRetryCount;
        releasePlayer();
        initializePlayer();
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
    }

    public void setUseTextureView(boolean useTextureView) {
        boolean finallyUseTextureView = useTextureView && this.drmUUID == null;
        exoPlayerView.setUseTextureView(finallyUseTextureView);
    }

    public void setHideShutterView(boolean hideShutterView) {
        exoPlayerView.setHideShutterView(hideShutterView);
    }

    public void setBufferConfig(int newMinBufferMs, int newMaxBufferMs, int newBufferForPlaybackMs, int newBufferForPlaybackAfterRebufferMs) {
        minBufferMs = newMinBufferMs;
        maxBufferMs = newMaxBufferMs;
        bufferForPlaybackMs = newBufferForPlaybackMs;
        bufferForPlaybackAfterRebufferMs = newBufferForPlaybackAfterRebufferMs;
        releasePlayer();
        initializePlayer();
    }

    public void setDrmType(UUID drmType) {
        this.drmUUID = drmType;
    }

    public void setDrmLicenseUrl(String licenseUrl){
        this.drmLicenseUrl = licenseUrl;
    }

    public void setDrmLicenseHeader(String[] header){
        this.drmLicenseHeader = header;
    }


    @Override
    public void onDrmKeysLoaded(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId) {
        Log.d("DRM Info", "onDrmKeysLoaded");
    }

    @Override
    public void onDrmSessionManagerError(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId, Exception e) {
        Log.d("DRM Info", "onDrmSessionManagerError");
        eventEmitter.error("onDrmSessionManagerError", e);
    }

    @Override
    public void onDrmKeysRestored(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId) {
        Log.d("DRM Info", "onDrmKeysRestored");
    }

    @Override
    public void onDrmKeysRemoved(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId) {
        Log.d("DRM Info", "onDrmKeysRemoved");
    }

    /**
     * Handling controls prop
     *
     * @param controls  Controls prop, if true enable controls, if false disable them
     */
    public void setControls(boolean controls) {
        this.controls = controls;
        if (player == null || exoPlayerView == null) return;
        if (controls) {
            addPlayerControl();
        } else {
            int indexOfPC = indexOfChild(playerControlView);
            if (indexOfPC != -1) {
                removeViewAt(indexOfPC);
            }
        }
    }

    public void setExtensionRenderMode(int mode) {
        extensionRenderMode = mode < 0 ? DolbyDefaultExtensionMode.getDefaultMode() : mode;
        if (player != null) {
            Log.d("ExtensionMode", "set extension mode after player initialized doesn't have effect");
        }
    }
}
