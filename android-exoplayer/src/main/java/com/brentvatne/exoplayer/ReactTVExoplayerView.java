package com.brentvatne.exoplayer;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.LayoutTransition;
import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.os.PowerManager;
import android.support.v4.media.session.MediaSessionCompat;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;
import android.view.Choreographer;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewTreeObserver;
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
import com.dice.shield.downloads.DownloadProviderImpl;
import com.dice.shield.downloads.dash.DrmDashManifestParser;
import com.dice.shield.downloads.manager.DlmWrapper;
import com.dice.shield.downloads.source.DefaultMediaSource;
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
import com.google.android.exoplayer2.ext.mediasession.MediaSessionConnector;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer;
import com.google.android.exoplayer2.mediacodec.MediaCodecUtil;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.MetadataOutput;
import com.google.android.exoplayer2.offline.FilteringManifestParser;
import com.google.android.exoplayer2.offline.StreamKey;
import com.google.android.exoplayer2.source.BehindLiveWindowException;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.MergingMediaSource;
import com.google.android.exoplayer2.source.SingleSampleMediaSource;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.source.dash.DashMediaSource;
import com.google.android.exoplayer2.source.dash.DefaultDashChunkSource;
import com.google.android.exoplayer2.source.dash.manifest.DashManifestParser;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultAllocator;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.util.Util;
import com.imggaming.mux.MuxData;
import com.imggaming.mux.MuxStats;
import com.imggaming.tracks.DcePlayerModel;
import com.imggaming.tracks.DceTracksDialog;
import com.imggaming.translations.DiceLocalizedStrings;
import com.imggaming.translations.DiceLocalizedStrings.StringId;
import com.imggaming.utils.DensityPixels;
import com.imggaming.widgets.DceSeekIndicator;
import com.previewseekbar.PreviewSeekBarLayout;
import com.previewseekbar.base.PreviewLoader;
import com.previewseekbar.base.PreviewView;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import androidx.annotation.IntegerRes;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.constraintlayout.widget.ConstraintSet;
import androidx.core.view.MarginLayoutParamsCompat;

@SuppressLint("ViewConstructor")
class ReactTVExoplayerView extends RelativeLayout implements LifecycleEventListener, Player.EventListener,
        BecomingNoisyListener, AudioManager.OnAudioFocusChangeListener, MetadataOutput {

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
    private TextView liveTextView;
    private ImageButton playPauseButton;
    private View controls;
    private ConstraintLayout bottomBarWidget;
    private TextView labelTextView;
    private DceSeekIndicator seekIndicator;
    private ImageButton audioSubtitlesButton;
    private ImageButton scheduleButton;
    private ImageButton statsButton;

    private ExoPlayerView exoPlayerView;
    private DceTracksDialog dialog;
    private DataSource.Factory mediaDataSourceFactory;
    private SimpleExoPlayer player;
    private DefaultTrackSelector trackSelector;
    private boolean playerNeedsSource;
    private int resumeWindow;
    private long resumePosition;
    private boolean loadVideoStarted;
    private boolean isInBackground = false;
    private boolean fromBackground = false;
    private boolean isPaused;
    private boolean isBuffering;
    private boolean isMediaKeysEnabled = true;
    private boolean areControlsVisible = true;
    private long shouldSeekTo = C.TIME_UNSET;
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
    private boolean hasEpg;
    private boolean hasStats;
    private float mProgressUpdateInterval = 250.0f;
    private boolean useTextureView = false;
    private boolean canSeekToLiveEdge = false;
    private Map<String, String> requestHeaders;
    private int accentColor;
    // \ End props

    // Custom
    private PowerManager powerManager;
    private long playerViewCreationTime;
    private long playerInitTime;
    private TextView seekIndicatorLabel;

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
            if (msg.what == SHOW_JS_PROGRESS) {
                if (player != null && player.getPlaybackState() == Player.STATE_READY && player.getPlayWhenReady()) {
                    long pos = player.getCurrentPosition();
                    long bufferedDuration = player.getBufferedPercentage() * player.getDuration() / 100;
                    eventEmitter.progressChanged(pos, bufferedDuration, player.getDuration());
                    progressHandler.removeMessages(SHOW_JS_PROGRESS);
                    msg = obtainMessage(SHOW_JS_PROGRESS);
                    sendMessageDelayed(msg, Math.round(mProgressUpdateInterval));
                }
            }
        }
    };

    @SuppressLint("HandlerLeak")
    private final Handler nativeProgressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            if (msg.what == SHOW_NATIVE_PROGRESS && player != null && player.getPlaybackState() == Player.STATE_READY && player.getPlayWhenReady()) {
                long currentMillis = player.getCurrentPosition();
                progressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
                msg = obtainMessage(SHOW_NATIVE_PROGRESS);
                sendMessageDelayed(msg, Math.round(NATIVE_PROGRESS_UPDATE_INTERVAL));

                updateProgressControl(currentMillis);
            }
        }
    };

    private Runnable seekIndicatorRunnable = new Runnable() {
        @Override
        public void run() {
            animateHideView(seekIndicator, 400);
            animateShowView(currentTextView, 400);
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
    private Runnable initRunnable;
    private PreviewView.OnPreviewChangeListener mPreviewChangeListener;

    //MediaSession
    private MediaSessionCompat mediaSession;
    private MediaSessionConnector mediaSessionConnector;

    public ReactTVExoplayerView(ThemedReactContext context) {
        super(context);
        this.themedReactContext = context;
        createViews();
        this.eventEmitter = new VideoEventEmitter(context);
        powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        themedReactContext.addLifecycleEventListener(this);
        audioBecomingNoisyReceiver = new AudioBecomingNoisyReceiver(themedReactContext);

        setPausedModifier(false);

        mediaSession = new MediaSessionCompat(getContext(), getContext().getPackageName());
        mediaSessionConnector = new MediaSessionConnector(mediaSession);
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
    protected int[] onCreateDrawableState(int extraSpace) {
        playerViewCreationTime = new Date().getTime();
        return super.onCreateDrawableState(extraSpace);
    }

    private void createViews() {
        clearResumePosition();
        mediaDataSourceFactory = buildDataSourceFactory(true);

        if (CookieHandler.getDefault() != DEFAULT_COOKIE_MANAGER) {
            CookieHandler.setDefault(DEFAULT_COOKIE_MANAGER);
        }

        LayoutParams layoutParams = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        exoPlayerView = new ExoPlayerView(getContext());
        exoPlayerView.setLayoutParams(layoutParams);
        addView(exoPlayerView, 0, layoutParams);
        setLayoutTransition(new LayoutTransition());

        if (areControlsVisible) {
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

            LayoutInflater inflater = LayoutInflater.from(getContext());
            controls = inflater.inflate(R.layout.controls_tv, null);
            LayoutParams controlsParam = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
            controls.setLayoutParams(controlsParam);
            addView(controls);

            bottomBarWidget = controls.findViewById(R.id.bottomBarWidget);

            playPauseButton = controls.findViewById(R.id.tvPlayPauseImageView);
            playPauseButton.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {
                    setPausedModifier(!isPaused);
                }
            });
            currentTextView = controls.findViewById(R.id.currentTimeTextView);
            liveTextView = controls.findViewById(R.id.liveTextView);
            previewSeekBarLayout = controls.findViewById(R.id.previewSeekBarLayout);
            previewSeekBarLayout.setPreviewLoader(new PreviewLoader() {
                @Override
                public void loadPreview(long currentPosition, long max) {

                }
            });
            bottomBarWidgetContainer = controls.findViewById(R.id.tvBottomBarWidgetContainer);

            audioSubtitlesButton = findViewById(R.id.tvAudioSubtitlesBtn);
            audioSubtitlesButton.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {

                    if (!live) {
                        setPausedModifier(true);
                    }

                    setStateOverlay(ControlState.HIDDEN.toString());

                    if (dialog != null) {
                        dialog.dismiss();
                        dialog = null;
                    }

                    dialog = new DceTracksDialog(getContext(), 0);
                    dialog.setModel(new DcePlayerModel(getContext(), player, trackSelector));
                    dialog.setAccentColor(accentColor);

                    dialog.show();
                }
            });

            scheduleButton = findViewById(R.id.tvScheduleBtn);

            scheduleButton.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {
                    eventEmitter.epgIconClick();
                    setStateOverlay(ControlState.HIDDEN.toString());
                }
            });

            statsButton = findViewById(R.id.tvStatsBtn);

            statsButton.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {
                    eventEmitter.statsIconClick();
                    setStateOverlay(ControlState.HIDDEN.toString());
                }
            });

            labelTextView = findViewById(R.id.tvLabelView);

            bottomBarWidget.getViewTreeObserver().addOnGlobalFocusChangeListener(new ViewTreeObserver.OnGlobalFocusChangeListener() {
                @Override
                public void onGlobalFocusChanged(View oldFocus, View newFocus) {
                    Log.d(TAG, "onGlobalFocusChanged()");

                    updateLabelView(newFocus);
                }
            });

            setEpg(false); // default value
            setStats(false);

            setupButton(playPauseButton);
            setupButton(audioSubtitlesButton);
            setupButton(scheduleButton);
            setupButton(statsButton);
            setupSubtitlesButton();

            // RN: Android native UI components are not re-layout on dynamically added views. Fix for View.GONE -> View.VISIBLE issue.
            Choreographer.getInstance().postFrameCallback(new Choreographer.FrameCallback() {
                @Override
                public void doFrame(long frameTimeNanos) {
                    manuallyLayoutChildren();
                    getViewTreeObserver().dispatchOnGlobalLayout();
                    Choreographer.getInstance().postFrameCallback(this);
                }
            });

            seekIndicator = findViewById(R.id.seekIndicator);
            seekIndicatorLabel = findViewById(R.id.seekIndicatorLabel);
        }
    }

    private void updateLabelView(View newFocus) {
        if (newFocus == playPauseButton) {
            moveLabelView(playPauseButton, DiceLocalizedStrings.getInstance().string(isPaused ? StringId.player_play_button : StringId.player_pause_button));
        } else if (newFocus == audioSubtitlesButton) {
            moveLabelView(audioSubtitlesButton, DiceLocalizedStrings.getInstance().string(StringId.player_audio_and_subtitles_button));
        } else if (newFocus == scheduleButton) {
            moveLabelView(scheduleButton, DiceLocalizedStrings.getInstance().string(StringId.player_epg_button));
        } else if (newFocus == statsButton) {
            moveLabelView(statsButton, DiceLocalizedStrings.getInstance().string(StringId.player_stats_button));
        } else {
            labelTextView.setVisibility(INVISIBLE);
        }
    }

    private void manuallyLayoutChildren() {
        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);
            child.measure(MeasureSpec.makeMeasureSpec(getMeasuredWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getMeasuredHeight(), MeasureSpec.EXACTLY));
            child.layout(0, 0, child.getMeasuredWidth(), child.getMeasuredHeight());
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        initializePlayer(false);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        stopPlayback();
    }

    // LifecycleEventListener implementation

    @Override
    public void onHostResume() {
        if (isInBackground) {
            Log.d(TAG, "onHostResume() isPaused: " + isPaused + " live: " + live);
            isInBackground = false; // reset to false first
            if (live) {
                // always seek to live edge when returning from background to a live event
                canSeekToLiveEdge = true;
                setPausedModifier(false);
                setPlayWhenReady(true);
            } else {
                // otherwise whatever abide by what the previous user action was
                setPausedModifier(isPaused);
                setPlayWhenReady(!isPaused);
            }
            fromBackground = true;
        }
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause()");
        setPlayInBackground(false);
        setPlayWhenReady(false);
        onStopPlayback();
        isInBackground = true;
    }

    @Override
    public void onHostDestroy() {
        stopPlayback();
    }

    public void cleanUpResources() {
        stopPlayback();
    }


    private void initializePlayer(final boolean force) {
        if (initRunnable != null) {
            removeCallbacks(initRunnable);
        }
        initRunnable = new Runnable() {
            @Override
            public void run() {
                doInitializePlayer(force);
            }
        };
        post(initRunnable);
    }

    // Internal methods
    private void doInitializePlayer(boolean force) {
        if (force) {
            releasePlayer();
        }
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

            TrackSelection.Factory videoTrackSelectionFactory = new AdaptiveTrackSelection.Factory();
            trackSelector = new DefaultTrackSelector(videoTrackSelectionFactory);
            DefaultAllocator allocator = new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
            DefaultLoadControl loadControl = new DefaultLoadControl.Builder()
                    .setAllocator(allocator)
                    .setBufferDurationsMs(
                            minBufferMs,
                            maxBufferMs,
                            bufferForPlaybackMs,
                            bufferForPlaybackAfterRebufferMs
                    ).createDefaultLoadControl();
            if (drmMgr != null) {
                player = ExoPlayerFactory.newSimpleInstance(getContext(), new DefaultRenderersFactory(getContext()), trackSelector, loadControl, drmMgr, BANDWIDTH_METER);
            } else {
                player = ExoPlayerFactory.newSimpleInstance(getContext(), new DefaultRenderersFactory(getContext()), trackSelector, loadControl, null, BANDWIDTH_METER);
            }

            player.addListener(this);
            player.setMetadataOutput(this);
            exoPlayerView.setPlayer(player, false);
            audioBecomingNoisyReceiver.setListener(this);
            setPlayWhenReady(!isPaused);
            playerNeedsSource = true;

            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            player.setPlaybackParameters(params);
            Log.d(TAG, "initialisePlayer() new instance: " + force);

            activateMediaSession();
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
            boolean shouldSeekOnInit = shouldSeekTo > C.TIME_UNSET;
            if (haveResumePosition && !force) {
                player.seekTo(resumeWindow, resumePosition);
            }

            if (shouldSeekOnInit) {
                this.seekTo(shouldSeekTo);
            }

            showOverlay();

            playerInitTime = new Date().getTime();

            if (muxData != null) {
                muxData.put(MuxData.KEY_PLAYER_STARTUP_TIME, getPlayerStartupTime());
                if (muxStats == null) {
                    muxStats = new MuxStats(getContext(), player, muxData);
                } else {
                    muxStats.setVideoData(muxData);
                }
                muxStats.setVideoView(exoPlayerView.getVideoSurfaceView());
            } else {
                releaseMux();
            }

            player.prepare(mediaSource, !haveResumePosition && !shouldSeekOnInit, true);
            playerNeedsSource = false;

            eventEmitter.loadStart();
            loadVideoStarted = true;
        }
    }

    private long getPlayerStartupTime() {
        return playerInitTime - playerViewCreationTime;
    }

    // MediaSession related functions.
    private void activateMediaSession() {
        Log.d(TAG, "activateMediaSession()");
        mediaSessionConnector.setPlayer(player, null);
        mediaSession.setActive(true);
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                super.onPlay();
                Log.d(TAG, "MediaSession onPlay()");
                setPausedModifier(false);
            }

            @Override
            public void onPause() {
                super.onPause();
                Log.d(TAG, "MediaSession onPause()");
                setPausedModifier(true);
            }
        });
    }

    private void deactivateMediaSession() {
        Log.d(TAG, "deactivateMediaSession()");
        mediaSessionConnector.setPlayer(null, null);
        mediaSession.setActive(false);
    }

    private void releaseMediaSession() {
        mediaSession.release();
    }


    @SuppressWarnings("unchecked")
    private MediaSource buildMediaSource(Uri uri, @Nullable String overrideExtension) {
        int type = Util.inferContentType(
                !TextUtils.isEmpty(overrideExtension) ? "." + overrideExtension : uri.getLastPathSegment());
        if (muxStats != null) {
            muxStats.setStreamType(type);
        }
        switch (type) {
            case C.TYPE_SS:
                return new SsMediaSource.Factory(mediaDataSourceFactory)
                        .createMediaSource(uri);

            case C.TYPE_DASH: {
                HttpMediaDrmCallback callback = drmCallback;
                UUID drmSchemeUuid = actionToken != null ? Util.getDrmUuid(actionToken.getDrmScheme()) : null;
                return new DashMediaSource.Factory(
                        new DefaultDashChunkSource.Factory(mediaDataSourceFactory),
                        buildDataSourceFactory(false))
                        .setManifestParser(
                                new FilteringManifestParser<>(
                                        (drmSchemeUuid != null && callback != null)
                                                ? new DrmDashManifestParser(drmSchemeUuid, callback)
                                                : new DashManifestParser(),
                                        getOfflineStreamKeys(uri)))
                        .createMediaSource(uri);
            }

            case C.TYPE_HLS:
                return new HlsMediaSource.Factory(mediaDataSourceFactory)
                        .createMediaSource(uri);
            case C.TYPE_OTHER:
                return new DefaultMediaSource.Factory(mediaDataSourceFactory)
                        .createMediaSource(uri);
            default: {
                throw new IllegalStateException("Unsupported type: " + type);
            }
        }
    }

    public void setMediaKeysListener(boolean visible) {
        if (!visible) {
            deactivateMediaSession();
        }

        if (visible && !isMediaKeysEnabled) {
            activateMediaSession();
        }

        isMediaKeysEnabled = visible;
    }

    @SuppressLint("ObsoleteSdkInt")
    private DefaultDrmSessionManager createDrmSessionManager(@NonNull ActionToken drmParam) throws UnsupportedDrmException {
        DefaultDrmSessionManager<FrameworkMediaCrypto> drmSessionManager;
        final String drmLicenseUrl = drmParam.getLicensingServerUrl();
        final HashMap<String, String> keyRequestProperties = Utils.getParams(drmParam);

        if (Util.SDK_INT < 18) {
            throw new UnsupportedDrmException(UnsupportedDrmException.REASON_INSTANTIATION_ERROR);
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
                errorStringId = R.string.error_drm_not_supported;
                break;
            case UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME:
                errorStringId = R.string.error_drm_unsupported_scheme;
                break;
            default:
                errorStringId = R.string.error_drm_unknown;
                break;
        }

        final String errorString = getContext().getString(errorStringId);
        eventEmitter.error(errorString, exception);
    }

    private DefaultDrmSessionManager<FrameworkMediaCrypto> buildDrmSessionManagerV18(
            @NonNull UUID uuid, @NonNull String licenseUrl, @Nullable Map<String, String> requestProperties, boolean multiSession)
            throws UnsupportedDrmException {
        HttpMediaDrmCallback callback = DownloadProviderImpl.getInstance(getContext().getApplicationContext())
                .createHttpMediaDrmCallback(licenseUrl, null);
        if (requestProperties != null) {
            for (String key : requestProperties.keySet()) {
                callback.setKeyRequestProperty(key, requestProperties.get(key));
            }
        }
        releaseMediaDrm();
        mediaDrm = FrameworkMediaDrm.newInstance(uuid);
        this.drmCallback = callback;
        return new DefaultDrmSessionManager<>(uuid, mediaDrm, callback, null, multiSession);
    }

    private void releaseMediaDrm() {
        if (mediaDrm != null) {
            mediaDrm.release();
            mediaDrm = null;
        }
        drmCallback = null;
    }

    private List<StreamKey> getOfflineStreamKeys(@NonNull Uri uri) {
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
        Log.d(TAG, "releasePlayer()");
        deactivateMediaSession();
        releaseMediaSession();

        dismissTracksDialog();

        if (player != null) {
            updateResumePosition();
            player.release();
            player.setMetadataOutput(null);
            player = null;
            trackSelector = null;
            shouldSeekTo = C.TIME_UNSET;
        }
        releaseMux();
        progressHandler.removeMessages(SHOW_JS_PROGRESS);
        progressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
        themedReactContext.removeLifecycleEventListener(this);
        audioBecomingNoisyReceiver.removeListener();
        releaseMediaDrm();
    }

    private void releaseMux() {
        if (muxStats != null) {
            muxStats.release();
            muxStats = null;
        }
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

    private boolean isInteractive() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            return powerManager.isInteractive();
        } else {
            return powerManager.isScreenOn();
        }
    }

    private void setPlayWhenReady(boolean playWhenReady) {
        if (player == null || isInBackground || !isInteractive()) {
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

        updateControlsState();
    }

    private void startPlayback() {
        if (!isInteractive()) {
            return;
        }

        if (player != null) {
            switch (player.getPlaybackState()) {
                case Player.STATE_IDLE:
                case Player.STATE_ENDED:
                    initializePlayer(false);
                    break;
                case Player.STATE_BUFFERING:
                case Player.STATE_READY:
                    if (!player.getPlayWhenReady() && !isInBackground) {
                        setPlayWhenReady(true);
                    }

                    /*
                     * Focus on play/pause button and update progress if coming from background
                     * state
                     */
                    if (fromBackground && isPaused) {
                        playPauseButton.requestFocus();
                        if (player != null) {
                            updateProgressControl(player.getCurrentPosition());
                        }
                        fromBackground = false;
                    }
                    break;
                default:
                    break;
            }

        } else {
            initializePlayer(false);
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
        setKeepScreenOn(false);
        keyPressTime = null;
        audioManager.abandonAudioFocus(this);
    }

    private void updateResumePosition() {
        Log.d(TAG, "updateResumePosition()");
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

    @Override
    public void onLoadingChanged(boolean isLoading) {

    }

    @Override
    public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
        String text = "onStateChanged: playWhenReady=" + playWhenReady + ", playbackState=";
        switch (playbackState) {
            case Player.STATE_IDLE:
                text += "idle";
                eventEmitter.idle();
                break;
            case Player.STATE_BUFFERING:
                text += "buffering";
                onBuffering(true);
                break;
            case Player.STATE_READY:
                text += "ready";
                // seek to edge of live window for live events
                seekToDefaultPosition();
                eventEmitter.ready();
                onBuffering(false);
                startProgressHandler();
                setupProgressBarSeekListener();
                videoLoaded();
                setupSubtitlesButton();
                break;
            case Player.STATE_ENDED:
                text += "ended";
                eventEmitter.end();
                onStopPlayback();
                if (
                        player.getRepeatMode() == Player.REPEAT_MODE_ONE
                                || player.getRepeatMode() == Player.REPEAT_MODE_ALL
                                || this.repeat
                ) {
                    this.seekTo(0);
                }

                break;
            default:
                text += "unknown";
                break;
        }
        if (areControlsVisible) {
            updateControlsState();
        }
        Log.d(TAG, text);
    }

    private void seekToDefaultPosition() {
        Log.d(TAG, "seekToDefaultPosition() live: " + live + " canSeekToLiveEdge: " + canSeekToLiveEdge);
        if (player != null && canSeekToLiveEdge && live) {
            player.seekToDefaultPosition();
            canSeekToLiveEdge = false; // reset needed otherwise falls into a loop when coming back from background
        }
    }

    private boolean isPlaying() {
        return player != null
                && player.getPlaybackState() != Player.STATE_ENDED
                && player.getPlaybackState() != Player.STATE_IDLE
                && player.getPlayWhenReady();
    }

    private void setupSubtitlesButton() {
        Log.d(TAG, "setupSubtitlesButton()");
        if (player != null && player.getPlaybackState() == Player.STATE_READY) {

            DcePlayerModel model = new DcePlayerModel(getContext(), player, trackSelector);

            if (model.areSubtitlesAvailable() || (model.areAudioTracksAvailable() && model.getAudioTracks().size() > 1)) {
                Log.d(TAG, "setupSubtitlesButton() VISIBLE");
                audioSubtitlesButton.setVisibility(View.VISIBLE);
            } else {
                Log.d(TAG, "setupSubtitlesButton() INVISIBLE");
                audioSubtitlesButton.setVisibility(View.GONE);
            }
        } else {
            Log.d(TAG, "setupSubtitlesButton() player or media not ready");
            audioSubtitlesButton.setVisibility(View.GONE);
        }

        post(new Runnable() {
            @Override
            public void run() {
                updateLabelView(bottomBarWidget.getFocusedChild());
            }
        });

        changeFocusedView();
    }

    private void changeFocusedView() {
        if (live) {
            if (audioSubtitlesButton.getVisibility() != View.VISIBLE && scheduleButton.getVisibility() != View.VISIBLE && statsButton.getVisibility() != View.VISIBLE) {
                controls.setFocusable(true);
                controls.setFocusableInTouchMode(false);
                post(new Runnable() {
                    @Override
                    public void run() {
                        controls.requestFocus();
                    }
                });
            } else {
                controls.setFocusable(false);
                controls.setFocusableInTouchMode(false);
            }
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

        progressBar.setProgress((int) currentMillis);
        progressBar.setMax((int) duration);

        String positionString = getSeekBarPositionString(currentMillis, duration);

        currentTextView.setText(positionString);
        seekIndicator.setLabel(positionString);
    }

    private String getSeekBarPositionString(long currentMillis, long duration) {
        String durationString = null;

        if (duration != C.TIME_UNSET) {
            int secs = (int) (duration / 1000) % 60;
            int mins = (int) ((duration / (1000 * 60)) % 60);
            int hours = (int) ((duration / (1000 * 60 * 60)) % 24);

            if (hours > 0) {
                durationString = String.format(Locale.UK, "%02d:%02d:%02d", hours, mins, secs);
            } else {
                durationString = String.format(Locale.UK, "%02d:%02d", mins, secs);
            }
        }

        if (currentMillis != C.TIME_UNSET && durationString != null) {
            int secs = (int) (currentMillis / 1000) % 60;
            int mins = (int) ((currentMillis / (1000 * 60)) % 60);
            int hours = (int) ((currentMillis / (1000 * 60 * 60)) % 24);
            boolean showHours = false;
            if (duration != C.TIME_UNSET) {
                showHours = ((int) ((duration / (1000 * 60 * 60)) % 24)) > 0;
            }
            String currentString;
            if (hours > 0 || showHours) {
                currentString = String.format(Locale.UK, "%02d:%02d:%02d", hours, mins, secs);
            } else {
                currentString = String.format(Locale.UK, "%02d:%02d", mins, secs);
            }

            return String.format(Locale.UK, "%s / %s", currentString, durationString);
        }

        return null;
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
            seekIndicator.setLabelMaxText(getSeekBarPositionString(0, player.getDuration()));
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
        if (reason == Player.DISCONTINUITY_REASON_PERIOD_TRANSITION
                && player.getRepeatMode() == Player.REPEAT_MODE_ONE) {
            eventEmitter.end();
        }
    }

    @Override
    public void onTimelineChanged(Timeline timeline, Object manifest, int reason) {
        if (reason == Player.TIMELINE_CHANGE_REASON_PREPARED && live) {
            canSeekToLiveEdge = true;
        }
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
            clearResumePosition();
            initializePlayer(false);
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
                errorString = getResources().getString(R.string.error_drm_unknown);
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

    public void setSrc(@NonNull final Uri uri, @Nullable final String extension, @Nullable final ActionToken actionToken,
                       @Nullable final Map<String, String> headers,  @Nullable final Map<String, Object> muxData, final ReadableArray textTracks) {
        if (uri != null) {
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.actionToken = actionToken;
            this.requestHeaders = headers;
            this.mediaDataSourceFactory = buildDataSourceFactory(true);
            this.muxData = muxData;
            this.textTracks = textTracks;

            initializePlayer(!isOriginalSourceNull && !isSourceEqual);
        }
    }

    public void setSrc(@NonNull final Uri uri, @Nullable final String extension, @Nullable final Map<String, String> headers) {
        setSrc(uri, extension, null, headers, null, null);
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

            initializePlayer(!isOriginalSourceNull && !isSourceEqual);
        }
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

    @SuppressLint("ObsoleteSdkInt")
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

    public void setShouldSeekTo(long seekToMs) {
        shouldSeekTo = seekToMs;
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

        eventEmitter.playbackRateChange(isPaused ? 0.0f : 1.0f);
    }

    private void updateControlsState() {
        if (playPauseButton != null) {
            if (isPaused) {
                playPauseButton.setImageResource(R.drawable.tv_play_btn_selector);
            } else {
                playPauseButton.setImageResource(R.drawable.tv_pause_btn_selector);
            }
            updateLabelView(bottomBarWidget.findFocus());
        }

        if (isPaused || isBuffering) {
            showOverlay();
        } else {
            hideOverlay();
        }
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

    public void setUseTextureView(boolean useTextureView) {
        exoPlayerView.setUseTextureView(useTextureView);
    }

    public void setBufferConfig(int newMinBufferMs, int newMaxBufferMs, int newBufferForPlaybackMs, int newBufferForPlaybackAfterRebufferMs) {
        minBufferMs = newMinBufferMs;
        maxBufferMs = newMaxBufferMs;
        bufferForPlaybackMs = newBufferForPlaybackMs;
        bufferForPlaybackAfterRebufferMs = newBufferForPlaybackAfterRebufferMs;
        releasePlayer();
        initializePlayer(false);
    }

    public void setColorProgressBar(String color) {
        try {
            accentColor = Color.parseColor(color);
            previewSeekBarLayout.setTintColor(accentColor);
        } catch (IllegalArgumentException e) {
            Log.e(getClass().getSimpleName(), e.getMessage(), e);
        }
    }

    public void setLabelFont(final String fontName) {
        Typeface typeface = Typeface.createFromAsset(getResources().getAssets(), "fonts/" + fontName + ".ttf");
        labelTextView.setTypeface(typeface);
        currentTextView.setTypeface(typeface);
        seekIndicatorLabel.setTypeface(typeface);
    }

    public void setLive(final boolean live) {
        this.live = live;
        if (liveTextView != null && currentTextView != null && previewSeekBarLayout != null) {
            liveTextView.setVisibility(live ? VISIBLE : GONE);
            @IntegerRes
            int controlsVisibility = live ? GONE : VISIBLE;
            currentTextView.setVisibility(controlsVisibility);
            previewSeekBarLayout.setVisibility(controlsVisibility);
            playPauseButton.setVisibility(controlsVisibility);

            post(new Runnable() {
                @Override
                public void run() {
                    updateLabelView(bottomBarWidget.getFocusedChild());
                }
            });
        }

        changeFocusedView();
    }

    public void setEpg(boolean hasEpg) {
        this.hasEpg = hasEpg;
        scheduleButton.setVisibility(hasEpg ? View.VISIBLE : View.GONE);
        post(new Runnable() {
            @Override
            public void run() {
                updateLabelView(bottomBarWidget.findFocus());
            }
        });
    }

    public void setStats(boolean hasStats) {
        this.hasStats = hasStats;
        statsButton.setVisibility(hasStats ? View.VISIBLE : View.GONE);
        post(new Runnable() {
            @Override
            public void run() {
                updateLabelView(bottomBarWidget.findFocus());
            }
        });
    }

    public void setControls(final boolean visible) {
        controls.setVisibility(visible ? VISIBLE : GONE);
        areControlsVisible = visible;
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
        previewSeekBarLayout.setEnabled(enabled);
        previewSeekBarLayout.setAlpha(alpha);
        ProgressBar progressBar = (ProgressBar) previewSeekBarLayout.getPreviewView();
        if (progressBar != null) {
            progressBar.setEnabled(enabled);
        }
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
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                    showOverlay();
                    break;
                case KeyEvent.KEYCODE_DPAD_LEFT:
                case KeyEvent.KEYCODE_DPAD_RIGHT:
                case KeyEvent.KEYCODE_DPAD_UP:
                case KeyEvent.KEYCODE_DPAD_DOWN:
                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                case KeyEvent.KEYCODE_MEDIA_REWIND:
                    if (controls.getAlpha() == 0.0f) {
                        showOverlay();
                        return true;
                    } else {
                        showOverlay();
                    }

            }

            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                    playPauseButton.requestFocus();
                    // Media session will pause the player
                    break;

                case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                case KeyEvent.KEYCODE_MEDIA_REWIND:
                    if (previewSeekBarLayout.getPreviewView() instanceof SeekBar && !((SeekBar) previewSeekBarLayout.getPreviewView()).hasFocus()) {
                        ((SeekBar) previewSeekBarLayout.getPreviewView()).requestFocus();
                    }
                case KeyEvent.KEYCODE_DPAD_LEFT:
                case KeyEvent.KEYCODE_DPAD_RIGHT:

                    if (live || player == null) {
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

                        SeekBar seekbar = ((SeekBar) previewSeekBarLayout.getPreviewView());

                        seekbar.setKeyProgressIncrement(increment * 1000);

                        boolean isRew = event.getKeyCode() == KeyEvent.KEYCODE_MEDIA_REWIND || event.getKeyCode() == KeyEvent.KEYCODE_DPAD_LEFT;
                        seekIndicator.show(isRew, getSeekBarPositionString(player.getCurrentPosition(), player.getDuration()), 500, seekIndicatorRunnable);
                        moveSeekBarIndicator(seekbar, isRew);

                        animateHideView(currentTextView, 200);
                    }

                    keyNotHandled = false;
                    break;
            }
        } else if (event.getAction() == KeyEvent.ACTION_UP) {

            if (keyNotHandled && previewSeekBarLayout.getPreviewView() instanceof SeekBar && ((SeekBar) previewSeekBarLayout.getPreviewView()).hasFocus()) {
                switch (event.getKeyCode()) {
                    case KeyEvent.KEYCODE_DPAD_LEFT:
                    case KeyEvent.KEYCODE_MEDIA_REWIND: {
                        if (player == null) {
                            break;
                        }

                        long position = player.getCurrentPosition() - 10000;
                        if (position < 0) {
                            position = 0;
                        }
                        player.seekTo(position);
                        //updateProgressControl(position);
                        seekIndicator.show(true, getSeekBarPositionString(player.getCurrentPosition(), player.getDuration()), 1000, seekIndicatorRunnable);
                        moveSeekBarIndicator((SeekBar) previewSeekBarLayout.getPreviewView(), true);
                        animateHideView(currentTextView, 200);
                        break;
                    }
                    case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                    case KeyEvent.KEYCODE_DPAD_RIGHT: {
                        if (player == null) {
                            break;
                        }

                        long position = player.getCurrentPosition() + 10000;
                        if (position > player.getDuration()) {
                            position = player.getDuration();
                        }
                        player.seekTo(position);
                        //updateProgressControl(position);
                        seekIndicator.show(false, getSeekBarPositionString(player.getCurrentPosition(), player.getDuration()), 1000, seekIndicatorRunnable);
                        moveSeekBarIndicator((SeekBar) previewSeekBarLayout.getPreviewView(), false);
                        animateHideView(currentTextView, 200);
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

    private void moveSeekBarIndicator(SeekBar seekbar, boolean isRew) {
        int paddingLeftX = previewSeekBarLayout.getPaddingLeft();
        int indicatorWidth = seekIndicator.getMeasuredWidth();
        Rect bounds = seekbar.getThumb().getBounds();
        int thumbPos = (int) seekbar.getX() + bounds.centerX() + seekbar.getThumbOffset();

        int indicatorX = !isRew ?
                thumbPos - ((indicatorWidth - seekIndicator.getForwardImageWidth()) / 2)
                : thumbPos - ((indicatorWidth - seekIndicator.getRewImageWidth()) / 2) - seekIndicator.getRewImageWidth();

        int paddingRightX = previewSeekBarLayout.getMeasuredWidth() - previewSeekBarLayout.getPaddingRight() - indicatorWidth;

        if (indicatorX < paddingLeftX) {
            indicatorX = paddingLeftX;
        } else if (indicatorX > paddingRightX) {
            indicatorX = paddingRightX;
        }

        seekIndicator.setX(indicatorX);
        animateShowView(seekIndicator, 0);
    }

    public void showOverlay() {
        if (this.repeat || !areControlsVisible) {
            return;
        }

        if (controlsAutoHideTimeout != null) {
            removeCallbacks(hideRunnable);
        }
        setStateOverlay(ControlState.ACTIVE.toString());
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

    private void setupButton(final ImageButton btn) {
        btn.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                setButtonState(btn);
            }
        });
        setButtonState(btn);
    }

    private void setButtonState(final ImageButton button) {
        if (button.hasFocus()) {
            ObjectAnimator anim = ObjectAnimator.ofFloat(button,"scaleX",1.1f);
            anim.setDuration(100);
            anim.start();

            ObjectAnimator anim2 = ObjectAnimator.ofFloat(button,"scaleY",1.1f);
            anim2.setDuration(100);
            anim2.start();
        } else {
            ObjectAnimator anim = ObjectAnimator.ofFloat(button,"scaleX",1f);
            anim.setDuration(100);
            anim.start();

            ObjectAnimator anim2 = ObjectAnimator.ofFloat(button,"scaleY",1f);
            anim2.setDuration(100);
            anim2.start();
        }
    }

    private void moveLabelView(ImageButton button, String label) {
        int buttonCentre = (int) (button.getX() + (button.getWidth() / 2));
        int labelWidth = (int) labelTextView.getPaint().measureText(label);

        MarginLayoutParams pl = (MarginLayoutParams) labelTextView.getLayoutParams();
        final int marginStart = MarginLayoutParamsCompat.getMarginStart(pl);
        final int marginEnd = MarginLayoutParamsCompat.getMarginEnd(pl);

        float leftSpace = buttonCentre - marginStart - marginEnd;
        float rightSpace = bottomBarWidget.getWidth() - buttonCentre - marginStart - marginEnd;
        float space = Math.min(leftSpace, rightSpace) * 2;
        float bias = labelWidth > 0 ? (space / labelWidth) / 2 : 0.5f;

        final int labelId = labelTextView.getId();
        final int buttonId = button.getId();

        ConstraintSet constraintSet = new ConstraintSet();
        constraintSet.clone(bottomBarWidget);
        constraintSet.connect(labelId, ConstraintSet.START, buttonId, ConstraintSet.START, marginStart);
        constraintSet.connect(labelId, ConstraintSet.END, buttonId, ConstraintSet.END, marginEnd);
        constraintSet.setHorizontalBias(labelId, Math.min(bias, 0.5f));
        constraintSet.applyTo(bottomBarWidget);

        labelTextView.setWidth(labelWidth);
        labelTextView.setText(label);
        labelTextView.setAlpha(0.0f);
        animateShowView(labelTextView, 100);
    }

    public void animateHideView(final View view, int duration) {
        view.animate()
                .alpha(0.0f)
                .setDuration(duration)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        super.onAnimationEnd(animation);
                        view.setVisibility(View.GONE);
                    }
                });
    }

    public void animateShowView(final View view, int duration) {
        view.animate()
                .alpha(1.0f)
                .setDuration(duration)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationStart(Animator animation) {
                        super.onAnimationStart(animation);
                        view.setVisibility(View.VISIBLE);
                    }
                });
    }

    public void applyTranslations() {
        updateLabelView(bottomBarWidget.getFocusedChild());
    }
}
