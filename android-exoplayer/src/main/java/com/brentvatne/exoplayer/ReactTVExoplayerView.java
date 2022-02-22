package com.brentvatne.exoplayer;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.os.PowerManager;
import android.support.v4.media.session.MediaSessionCompat;
import android.text.TextUtils;
import android.util.Log;
import android.view.Choreographer;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.accessibility.CaptioningManager;
import android.widget.FrameLayout;
import android.widget.ImageButton;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.amazon.device.ads.aftv.AdBreakPattern;
import com.amazon.device.ads.aftv.AmazonFireTVAdCallback;
import com.amazon.device.ads.aftv.AmazonFireTVAdRequest;
import com.amazon.device.ads.aftv.AmazonFireTVAdResponse;
import com.amazon.device.ads.aftv.AmazonFireTVAdsKeyValuePair;
import com.brentvatne.entity.ApsSource;
import com.brentvatne.entity.RNImaDaiSource;
import com.brentvatne.entity.RNMetadata;
import com.brentvatne.entity.RNSource;
import com.brentvatne.entity.RNTranslations;
import com.brentvatne.entity.RelatedVideo;
import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
import com.brentvatne.util.AdTagParametersHelper;
import com.brentvatne.util.ImdbGenreMap;
import com.dice.shield.drm.entity.ActionToken;
import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.ExoDorisBuilder;
import com.diceplatform.doris.entity.AdTagParameters;
import com.diceplatform.doris.entity.ImaDaiProperties;
import com.diceplatform.doris.entity.ImaDaiPropertiesBuilder;
import com.diceplatform.doris.entity.Source;
import com.diceplatform.doris.entity.SourceBuilder;
import com.diceplatform.doris.entity.TextTrack;
import com.diceplatform.doris.ext.imacsai.ExoDorisImaCsaiPlayer;
import com.diceplatform.doris.ext.imadai.ExoDorisImaDaiPlayer;
import com.diceplatform.doris.ext.imadai.ExoDorisImaDaiWrapperListener;
import com.diceplatform.doris.ext.imadai.entity.AdInfo;
import com.diceplatform.doris.ext.imadai.entity.ImaLanguage;
import com.diceplatform.doris.ui.ExoDorisPlayerView;
import com.diceplatform.doris.ui.ExoDorisPlayerViewListener;
import com.diceplatform.doris.ui.entity.Labels;
import com.diceplatform.doris.ui.entity.LabelsBuilder;
import com.diceplatform.doris.ui.entity.VideoTile;
import com.diceplatform.doris.util.DorisExceptionUtil;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.ads.interactivemedia.v3.api.AdError;
import com.google.ads.interactivemedia.v3.api.AdErrorEvent;
import com.google.ads.interactivemedia.v3.api.AdEvent;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.analytics.AnalyticsListener;
import com.google.android.exoplayer2.audio.AudioAttributes;
import com.google.android.exoplayer2.drm.DrmSession;
import com.google.android.exoplayer2.ext.mediasession.MediaSessionConnector;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer;
import com.google.android.exoplayer2.mediacodec.MediaCodecUtil;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.text.Cue;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.util.Util;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.previewseekbar.base.PreviewView;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.UUID;

import static com.google.ads.interactivemedia.v3.api.AdEvent.AdEventType.AD_BREAK_ENDED;
import static com.google.ads.interactivemedia.v3.api.AdEvent.AdEventType.AD_BREAK_STARTED;

@SuppressLint("ViewConstructor")
class ReactTVExoplayerView extends FrameLayout implements LifecycleEventListener,
        Player.Listener,
        AnalyticsListener,
        BecomingNoisyListener,
        AudioManager.OnAudioFocusChangeListener,
        ExoDorisPlayerViewListener,
        ExoDorisImaDaiWrapperListener {

    private static final String TAG = "ReactTvExoplayerView";
    private static final String AMAZON_FEATURE_FIRE_TV = "amazon.hardware.fire_tv";

    private static final int SECONDS_IN_30_MINUTES = 1800;
    private static final int SECONDS_IN_60_MINUTES = 3600;

    // APS
    private static final String APS_APP_ID = "1a0f83d069f04b8abc59bdf5176e6103";
    private static final String APS_SLOT_ID_30 = "8f56413a-5fe1-40f8-9d46-0a34792b849d";
    private static final String APS_SLOT_ID_60 = "a0bcae0c-df57-4544-8431-8e8d2f1ab577";
    private static final String APS_SLOT_ID_90_PLUS = "8164f377-cee1-4edc-9786-8f1323008cef";
    private static final String APS_SLOT_ID_LIVE = "1bf05a33-f5a1-47a9-bcd9-fae1cc953dca";
    private static final String APS_VOD_CHANNEL_NAME = "PrendeTV";
    private static final String APS_VIDEO_CONTENT_ROOT_ELEMENT = "content";

    private static final CookieManager DEFAULT_COOKIE_MANAGER;
    private static final int SHOW_JS_PROGRESS = 1;
    private static final int SHOW_NATIVE_PROGRESS = 2;

    private static final String KEY_FIRST_CATEGORY = "first_category=";
    private static final String KEY_RATING = "rating=";
    private static final String KEY_AD_TAG_PARAMETERS = "adTagParameters";
    private static final String KEY_START_DATE = "startDate";
    private static final String KEY_END_DATE = "endDate";

    private static final int MAX_LOAD_BUFFER_MS = 30_000;

    private static final long SEEK_POSITION_INVALID = C.POSITION_UNSET - 1;

    static {
        DEFAULT_COOKIE_MANAGER = new CookieManager();
        DEFAULT_COOKIE_MANAGER.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
    }

    private final VideoEventEmitter eventEmitter;

    private ExoDorisPlayerView exoDorisPlayerView;
    private ExoDoris player;
    private ExoDorisImaDaiPlayer exoDorisImaDaiPlayer;
    private ExoDorisImaCsaiPlayer exoDorisImaCsaiPlayer;
    private DefaultTrackSelector trackSelector;
    private Source source;
    private boolean playerNeedsSource;
    private int resumeWindow = C.INDEX_UNSET;
    private long resumePosition = C.POSITION_UNSET; // unit: millisecond
    private boolean haveResumePosition = false;
    private boolean loadVideoStarted;
    private boolean isInBackground = false;
    private boolean fromBackground = false;
    private boolean isPaused;
    private boolean isBuffering;
    private boolean isMediaKeysEnabled = true;
    private boolean areControlsVisible = true;
    private boolean areControlsAllowed = true;
    private long shouldSeekTo = C.TIME_UNSET;
    private float rate = 1f;
    private boolean isAmazonFireTv;
    private int viewWidth = 0;
    private int viewHeight = 0;
    private boolean hasReloadedCurrentSource = false;
    private boolean isMuted = false;
    private UUID correlationId;

    // Props from React
    private RNSource src;
    private RNMetadata metadata;
    private RNTranslations translations;
    private boolean repeat;
    private String audioTrackType;
    private Dynamic audioTrackValue;
    private ReadableArray audioTracks;
    private String textTrackType;
    private Dynamic textTrackValue;
    private boolean disableFocus;
    private boolean isLive = false;
    private boolean hasEpg;
    private boolean hasStats;
    private float jsProgressUpdateInterval = 250.0f;
    private boolean useTextureView = false;
    private Map<String, String> requestHeaders;
    private int accentColor;
    // \ End props

    // IMA DAI
    private RNImaDaiSource imaDaiSrc;
    private boolean isImaDaiStream = false;
    private boolean isImaDaiStreamLoaded = false;
    private AdTagParameters adTagParameters;

    // IMA CSAI
    private boolean isImaCsaiStream = false;

    // Custom
    private PowerManager powerManager;
    private long playerViewCreationTime;
    private long playerInitTime;

    // React
    private final ThemedReactContext themedReactContext;
    private final AudioManager audioManager;
    private final AudioBecomingNoisyReceiver audioBecomingNoisyReceiver;

    private final float NATIVE_PROGRESS_UPDATE_INTERVAL = 250.0f;
    private final int ANIMATION_DURATION_CONTROLS_VISIBILITY = 500;

    @SuppressLint("HandlerLeak")
    private final Handler jsProgressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            if (msg.what == SHOW_JS_PROGRESS) {
                ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
                if (exoPlayer != null && exoPlayer.getPlaybackState() == Player.STATE_READY && exoPlayer.getPlayWhenReady()) {
                    long position = exoPlayer.getCurrentPosition();
                    long bufferedDuration = exoPlayer.getBufferedPercentage() * exoPlayer.getDuration() / 100;

                    if (isLive) {
                        Timeline timeline = exoPlayer.getCurrentTimeline();
                        if (!timeline.isEmpty()) {
                            position -= timeline.getPeriod(exoPlayer.getCurrentPeriodIndex(), new Timeline.Period()).getPositionInWindowMs();
                        }
                    } else {
                        boolean isAboutToEnd = exoPlayer.getDuration() - position <= 10_000;
                        eventEmitter.videoAboutToEnd(isAboutToEnd);
                    }

                    eventEmitter.progressChanged(position, bufferedDuration, exoPlayer.getDuration());

                    jsProgressHandler.removeMessages(SHOW_JS_PROGRESS);
                    msg = obtainMessage(SHOW_JS_PROGRESS);
                    sendMessageDelayed(msg, Math.round(jsProgressUpdateInterval));
                }
            }
        }
    };

    @SuppressLint("HandlerLeak")
    private final Handler nativeProgressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            if (msg.what == SHOW_NATIVE_PROGRESS) {
                ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
                if (exoPlayer != null && exoPlayer.getPlaybackState() == Player.STATE_READY && exoPlayer.getPlayWhenReady()) {
                    long position = exoPlayer.getCurrentPosition();

                    if (isLive && isImaDaiStream) {
                        Timeline timeline = exoPlayer.getCurrentTimeline();
                        if (!timeline.isEmpty()) {
                            long windowStartTimeMs = timeline.getWindow(exoPlayer.getCurrentMediaItemIndex(), new Timeline.Window()).windowStartTimeMs;
                            position = (windowStartTimeMs + position) / 1000L;

                            if (position < imaDaiSrc.getStartDate() || position > imaDaiSrc.getEndDate()) {
                                eventEmitter.requireAdParameters((double) position, false);
                            }
                        }
                    }

                    nativeProgressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
                    msg = obtainMessage(SHOW_NATIVE_PROGRESS);
                    sendMessageDelayed(msg, Math.round(NATIVE_PROGRESS_UPDATE_INTERVAL));
                }
            }
        }
    };

    private final AmazonFireTVAdCallback amazonFireTVAdCallback = new AmazonFireTVAdCallback() {
        @Override
        public void onSuccess(AmazonFireTVAdResponse amazonFireTVAdResponse) {
            Log.v(TAG, "APS - Successful response");
            List<AmazonFireTVAdsKeyValuePair> amazonKeyWords = amazonFireTVAdResponse.getAdServerTargetingParams();
            StringBuilder customParams = new StringBuilder();
            for (AmazonFireTVAdsKeyValuePair pair: amazonKeyWords) {
                customParams.append(pair.getKey()).append("=").append(pair.getValue()).append("&");
            }

            customParams.append(adTagParameters.getCustParams());
            adTagParameters.setCustParams(customParams.toString());
            playImaDaiStream();
        }

        @Override
        public void onFailure(AmazonFireTVAdResponse amazonFireTVAdResponse) {
            Log.e(TAG, "APS - Unsuccessful response. Reason: " + amazonFireTVAdResponse.getReasonString());
            playImaDaiStream();
        }
    };

    private boolean playInBackground = false;

    //Drm
    private ActionToken actionToken;

    //Mux
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
        isAmazonFireTv = isAmazonFireTv(context);

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

        if (CookieHandler.getDefault() != DEFAULT_COOKIE_MANAGER) {
            CookieHandler.setDefault(DEFAULT_COOKIE_MANAGER);
        }

        LayoutInflater.from(getContext()).inflate(R.layout.react_tv_exoplayer_view, this);
        setDescendantFocusability(FOCUS_AFTER_DESCENDANTS);

        exoDorisPlayerView = findViewById(R.id.playerView);
        exoDorisPlayerView.setExoDorisPlayerViewListener(this);
        exoDorisPlayerView.setUseController(false);

        setEpg(false); // default value
        setStats(false);

        // RN: Android native UI components are not re-layout on dynamically added views. Fix for View.GONE -> View.VISIBLE issue.
        Choreographer.getInstance().postFrameCallback(new Choreographer.FrameCallback() {
            @Override
            public void doFrame(long frameTimeNanos) {
                manuallyLayoutChildren();
                getViewTreeObserver().dispatchOnGlobalLayout();
                Choreographer.getInstance().postFrameCallback(this);
            }
        });
    }

    private void manuallyLayoutChildren() {
        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);
            child.measure(MeasureSpec.makeMeasureSpec(getMeasuredWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getMeasuredHeight(), MeasureSpec.EXACTLY));
            child.layout(0, 0, child.getMeasuredWidth(), child.getMeasuredHeight());
        }
    }

    private boolean isAmazonFireTv(Context context) {
        return context.getPackageManager().hasSystemFeature(AMAZON_FEATURE_FIRE_TV);
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

    @Override
    protected void onSizeChanged(final int width, final int height, final int oldWidth, final int oldHeight) {
        super.onSizeChanged(width, height, oldWidth, oldHeight);
        viewWidth = width;
        viewHeight = height;
        if (player != null) {
            player.setMaxVideoSize(width, height);
        }
    }

    // LifecycleEventListener implementation

    @Override
    public void onHostResume() {
        if (isInBackground && player != null) {
            Log.d(TAG, "onHostResume() isPaused: " + isPaused + " live: " + isLive);
            isInBackground = false; // reset to false first
            if (isLive) {
                // always seek to live edge when returning from background to a live event
                clearResumePosition();
                player.getExoPlayer().seekToDefaultPosition();
            }
            activateMediaSession();
            setPlayWhenReady(true);
            fromBackground = true;
        }
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause()");
        setPlayInBackground(false);
        setPlayWhenReady(false);
        if (player != null) {
            player.getExoPlayer().pause();
        }
        updateResumePosition();
        onStopPlayback();
        isInBackground = isInteractive();
        deactivateMediaSession();
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
        if (player == null) {
            if (isImaDaiStream) {
                exoDorisImaDaiPlayer = new ExoDorisImaDaiPlayer(getContext(), exoDorisPlayerView,
                        exoDorisPlayerView.getAdViewGroup(), MAX_LOAD_BUFFER_MS);
                player = exoDorisImaDaiPlayer.getExoDoris();
            } else if (isImaCsaiStream) {
                exoDorisImaCsaiPlayer = new ExoDorisImaCsaiPlayer(getContext(), exoDorisPlayerView, MAX_LOAD_BUFFER_MS);
                player = exoDorisImaCsaiPlayer.getExoDoris();
            } else {
                player = new ExoDorisBuilder(getContext()).setLoadBufferMs(MAX_LOAD_BUFFER_MS).build();
            }
            trackSelector = player.getTrackSelector();
            ExoPlayer exoPlayer = player.getExoPlayer();

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.CONTENT_TYPE_MOVIE)
                    .build();

            exoPlayer.setAudioAttributes(audioAttributes, false);
            exoPlayer.addListener(this);
            exoPlayer.addAnalyticsListener(this);
            exoDorisPlayerView.setPlayer(exoPlayer);
            audioBecomingNoisyReceiver.setListener(this);
            setPlayWhenReady(!isPaused);
            playerNeedsSource = true;

            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            exoPlayer.setPlaybackParameters(params);
            exoPlayer.setVolume(isMuted ? 0 : 1);
            Log.d(TAG, "initialisePlayer() new instance: " + force);

            activateMediaSession();
        }
        if (playerNeedsSource && src.getUrl() != null) {
            haveResumePosition = resumeWindow != C.INDEX_UNSET;
            boolean shouldSeekOnInit = shouldSeekTo > C.TIME_UNSET;

            showOverlay();

            MediaItem.Builder mediaItemBuilder = new MediaItem.Builder().setUri(src.getUrl());
            if (src.getAdTagUrl() != null) {
                mediaItemBuilder.setAdsConfiguration(new MediaItem.AdsConfiguration.Builder(Uri.parse(src.getAdTagUrl())).build());
            }
            SourceBuilder sourceBuilder = new SourceBuilder()
                    .setMediaItemBuilder(mediaItemBuilder)
                    .setId(src.getId())
                    .setMuxProperties(src.getMuxData(), String.valueOf(correlationId), exoDorisPlayerView.getVideoSurfaceView())
                    .setTextTracks(src.getTextTracks())
                    .setMaxVideoSize(viewWidth, viewHeight)
                    .setDrmParams(actionToken);

            if (isImaDaiStream) {
                ImaDaiProperties imaDaiProperties = new ImaDaiPropertiesBuilder()
                        .setAssetKey(imaDaiSrc.getAssetKey())
                        .setContentSourceId(imaDaiSrc.getContentSourceId())
                        .setVideoId(imaDaiSrc.getVideoId())
                        .setAuthToken(imaDaiSrc.getAuthToken())
                        .setAdTagParameters(adTagParameters)
                        .setAdTagParametersValidFrom((long) imaDaiSrc.getStartDate())
                        .setAdTagParametersValidUntil((long) imaDaiSrc.getEndDate())
                        .build();
                sourceBuilder.setImaDaiProperties(imaDaiProperties);
            }

            if (shouldSeekOnInit) {
                sourceBuilder.setInitialWindowIndex(0);
                sourceBuilder.setInitialPlaybackPosition(shouldSeekTo);
            } else if (haveResumePosition && !force && !src.isLive()) {
                // For CSAI playback, the seek action may be ignored while playing pre-roll ads.
                // We can apply the resume position before load source.
                // For live playback, we should switch the resume timestamp to seek position of the window.
                // It need the timeline and it is not ready in here.
                trySeekToResumePosition();
            }

            source = sourceBuilder.build();

            playerInitTime = new Date().getTime();

            if (isImaDaiStream) {
                if (!isImaDaiStreamLoaded && viewWidth != 0 && viewHeight != 0) {
                    loadImaDaiStream();
                }
            } else if (isImaCsaiStream) {
                exoDorisImaCsaiPlayer.load(source, !haveResumePosition);
            } else {
                player.load(source, !haveResumePosition);
            }

            playerNeedsSource = false;
            eventEmitter.loadStart();
            loadVideoStarted = true;
        }
    }

    private void loadImaDaiStream() {
        isImaDaiStreamLoaded = true;

        adTagParameters = AdTagParametersHelper.createAdTagParameters(getContext(),
                imaDaiSrc.getAdTagParametersMap());
        adTagParameters.setCustParams(adTagParameters.getCustParams() + "&pw=" + viewWidth + "&ph="
                + viewHeight);

        if (isAmazonFireTv) {
            AmazonFireTVAdRequest amazonFireTVAdRequest = createApsBidRequest();
            if (amazonFireTVAdRequest != null) {
                amazonFireTVAdRequest.executeRequest();
                return;
            }
        }

        playImaDaiStream();
    }

    private void playImaDaiStream() {
        exoDorisImaDaiPlayer.enableControls(true);
        exoDorisImaDaiPlayer.setCanSeek(true);

        ImaDaiProperties imaDaiProperties = source.getImaDaiProperties();
        imaDaiProperties.setAdTagParameters(adTagParameters);
        imaDaiProperties.setAdTagParametersValidFrom((long) imaDaiSrc.getStartDate());
        imaDaiProperties.setAdTagParametersValidUntil((long) imaDaiSrc.getEndDate());

        exoDorisImaDaiPlayer.load(source, !haveResumePosition, ImaLanguage.SPANISH_UNITED_STATES);
        exoDorisImaDaiPlayer.getImaDaiWrapper().setExoDorisImaWrapperListener(this);
    }

    private AmazonFireTVAdRequest createApsBidRequest() {
        Gson gson = new Gson();
        ApsSource apsSource = createApsSource();
        JsonElement jsonElement = gson.toJsonTree(apsSource);
        JsonObject jsonObject = new JsonObject();
        jsonObject.add(APS_VIDEO_CONTENT_ROOT_ELEMENT, jsonElement);
        jsonObject.add("us_privacy", gson.toJsonTree("1---"));

        String slotId = null;

        if (isLive) {
            slotId = APS_SLOT_ID_LIVE;
        } else if (src.getDuration() <= SECONDS_IN_30_MINUTES) {
            slotId = APS_SLOT_ID_30;
        } else if (src.getDuration() <= SECONDS_IN_60_MINUTES) {
            slotId = APS_SLOT_ID_60;
        } else if (src.getDuration() > SECONDS_IN_60_MINUTES) {
            slotId = APS_SLOT_ID_90_PLUS;
        }

        if (slotId != null) {
            AdBreakPattern adBreakPattern = AdBreakPattern.builder()
                    .withId(slotId)
                    .withJsonString(jsonObject.toString())
                    .build();

            return AmazonFireTVAdRequest.builder()
                    .withAppID(APS_APP_ID)
                    .withContext(getContext())
                    .withAdBreakPattern(adBreakPattern)
                    .withTimeOut(1000L)
                    .withCallback(amazonFireTVAdCallback)
                    .withTestFlag(src.getApsTestFlag())
                    .build();
        }

        return null;
    }

    private ApsSource createApsSource() {
        String custParams = adTagParameters.getCustParams();

        int genreStartPos = custParams.indexOf(KEY_FIRST_CATEGORY) + KEY_FIRST_CATEGORY.length();
        String genreSubString = custParams.substring(genreStartPos);
        int genreEndPos = genreSubString.indexOf("&");
        String genreList = genreSubString.substring(0, genreEndPos);
        String[] genres = genreList.split(",");
        String[] imdbGenres = new String[genres.length];
        for (int i = 0; i < genres.length; i++) {
            imdbGenres[i] = ImdbGenreMap.getImdbGenre(genres[i]);
        }

        int ratingStartPos = custParams.indexOf(KEY_RATING) + KEY_RATING.length();
        String ratingSubString = custParams.substring(ratingStartPos);
        int ratingEndPos = ratingSubString.indexOf("&");
        String rating = ratingSubString.substring(0, ratingEndPos).toUpperCase();

        String vodId = src.getSeriesId() != null ? src.getSeriesId() : src.getId();
        String id = isLive ? src.getChannelId() : vodId;
        String channelName = isLive ? src.getChannelName() : APS_VOD_CHANNEL_NAME;
        String length = isLive ? null : Integer.toString(src.getDuration());

        return new ApsSource(id, rating, imdbGenres, channelName, length);
    }

    @Nullable
    private TextTrack[] getTextTracks(ReadableArray textTracks) {
        if (textTracks != null && textTracks.size() > 0) {
            TextTrack[] dorisTextTracks = new TextTrack[textTracks.size()];
            for (int i = 0; i < textTracks.size(); ++i) {
                ReadableMap textTrack = textTracks.getMap(i);
                String uri = textTrack.getString("uri");
                String name = textTrack.getString("type");
                String isoCode = textTrack.getString("language");

                dorisTextTracks[i] = new TextTrack(Uri.parse(uri), name, isoCode);
            }
            return dorisTextTracks;
        }
        return null;
    }

    private long getPlayerStartupTime() {
        return playerInitTime - playerViewCreationTime;
    }

    // MediaSession related functions.
    private void activateMediaSession() {
        Log.d(TAG, "activateMediaSession()");
        mediaSessionConnector.setPlayer(player.getExoPlayer());
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
        mediaSessionConnector.setPlayer(null);
        mediaSession.setActive(false);
    }

    private void releaseMediaSession() {
        mediaSession.release();
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

    private void handleDrmSessionManagerError(Exception exception) {
        final int errorStringId = R.string.error_drm_session_manager;
        final String errorString = getContext().getString(errorStringId);
        eventEmitter.error(errorString, exception);
    }

    private void releasePlayer() {
        Log.d(TAG, "releasePlayer()");
        deactivateMediaSession();
        releaseMediaSession();
        adTagParameters = null;
        isImaDaiStreamLoaded = false;
        isInBackground = false;

        if (player != null) {
            player.getExoPlayer().removeListener(this);
            player.release();
            player = null;
            trackSelector = null;
            shouldSeekTo = C.TIME_UNSET;
        }

        if (exoDorisImaDaiPlayer != null) {
            exoDorisImaDaiPlayer.release();
            exoDorisImaDaiPlayer = null;
        }

        if (exoDorisImaCsaiPlayer != null) {
            exoDorisImaCsaiPlayer.release();
            exoDorisImaCsaiPlayer = null;
        }

        jsProgressHandler.removeMessages(SHOW_JS_PROGRESS);
        nativeProgressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
        themedReactContext.removeLifecycleEventListener(this);
        audioBecomingNoisyReceiver.removeListener();
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

        isPaused = !playWhenReady;
        ExoPlayer exoPlayer = player.getExoPlayer();
        if (playWhenReady) {
            boolean hasAudioFocus = requestAudioFocus();
            if (hasAudioFocus) {
                exoPlayer.play();
            }
        } else {
            exoPlayer.pause();
        }

        updateControlsState();
    }

    private void startPlayback() {
        if (!isInteractive()) {
            return;
        }

        if (player != null) {
            ExoPlayer exoPlayer = player.getExoPlayer();
            switch (exoPlayer.getPlaybackState()) {
                case Player.STATE_IDLE:
                case Player.STATE_ENDED:
                    initializePlayer(false);
                    break;
                case Player.STATE_BUFFERING:
                case Player.STATE_READY:
                    if (!exoPlayer.getPlayWhenReady() && !isInBackground) {
                        setPlayWhenReady(true);
                    }

                    /*
                     * Focus on play/pause button and update progress if coming from background
                     * state
                     */
                    if (fromBackground && isPaused) {
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
            if (player.getExoPlayer().getPlayWhenReady()) {
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
        ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
        if (exoPlayer != null && exoPlayer.isCurrentMediaItemSeekable()) {
            resumeWindow = exoPlayer.getCurrentMediaItemIndex();
            resumePosition = Math.max(0, exoPlayer.getCurrentPosition());
        }
    }

    private void clearResumePosition() {
        resumeWindow = C.INDEX_UNSET;
        resumePosition = C.POSITION_UNSET;
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
            ExoPlayer exoPlayer = player.getExoPlayer();
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                // Lower the volume
                exoPlayer.setVolume(0.8f);
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                // Raise it back to normal
                exoPlayer.setVolume(1);
            }
        }
    }

    // AudioBecomingNoisyListener implementation

    @Override
    public void onAudioBecomingNoisy() {
        eventEmitter.audioBecomingNoisy();
    }

    // AnalyticsListener implementation

    @Override
    public void onDrmSessionManagerError(EventTime eventTime, Exception e) {
        handleDrmSessionManagerError(e);
    }

    @Override
    public void onIsPlayingChanged(EventTime eventTime, boolean isPlaying) {
        if (isPlaying) {
            isPaused = false;
            startProgressHandler();
        }
    }

    @Override
    public void onPlaybackStateChanged(int state) {
        if (state == Player.STATE_BUFFERING || state == Player.STATE_READY) {
            trySeekToResumePosition();
        }

        String text = "onStateChanged: playbackState = " + state;
        switch (state) {
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

                exoDorisPlayerView.setFocusable(true);
                exoDorisPlayerView.setFocusableInTouchMode(true);

                hasReloadedCurrentSource = false;

                if (isImaDaiStream && exoDorisImaDaiPlayer.getImaDaiWrapper() != null) {
                    AdInfo adInfo = exoDorisImaDaiPlayer.getImaDaiWrapper().getAdInfo();
                    exoDorisPlayerView.setExtraAdGroupMarkers(adInfo.getAdGroupTimesMs(),
                            adInfo.getPlayedAdGroups());

                    Log.d(TAG, "IMA Stream ID = " + exoDorisImaDaiPlayer.getImaDaiWrapper().getStreamId());
                }

                eventEmitter.ready();
                onBuffering(false);
                startProgressHandler();
                videoLoaded();
                break;
            case Player.STATE_ENDED:
                text += "ended";
                eventEmitter.end();
                onStopPlayback();
                if (player.getExoPlayer().getRepeatMode() == Player.REPEAT_MODE_ONE
                        || player.getExoPlayer().getRepeatMode() == Player.REPEAT_MODE_ALL
                        || this.repeat) {
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

    private boolean isPlaying() {
        ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
        return exoPlayer != null
                && exoPlayer.getPlaybackState() != Player.STATE_ENDED
                && exoPlayer.getPlaybackState() != Player.STATE_IDLE
                && exoPlayer.getPlayWhenReady();
    }

    private void startProgressHandler() {
        jsProgressHandler.sendEmptyMessage(SHOW_JS_PROGRESS);
        nativeProgressHandler.sendEmptyMessage(SHOW_NATIVE_PROGRESS);
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

    private void videoLoaded() {
        if (loadVideoStarted) {
            loadVideoStarted = false;
            setSelectedAudioTrack(audioTrackType, audioTrackValue);
            setSelectedTextTrack(textTrackType, textTrackValue);
            ExoPlayer exoPlayer = player.getExoPlayer();
            Format videoFormat = exoPlayer.getVideoFormat();
            int width = videoFormat != null ? videoFormat.width : 0;
            int height = videoFormat != null ? videoFormat.height : 0;
            // MockStreamSource.logDceTracks(C.TRACK_TYPE_AUDIO, exoPlayer, trackSelector);
            // MockStreamSource.logDceTracks(C.TRACK_TYPE_TEXT, exoPlayer, trackSelector);
            eventEmitter.load(exoPlayer.getDuration(), exoPlayer.getCurrentPosition(), width, height,
                    getAudioTrackInfo(), getTextTrackInfo());
        }
    }

    private WritableArray getAudioTrackInfo() {
        WritableArray audioTracks = Arguments.createArray();
        final Set<String> addedLanguages = new HashSet<>();

        MappingTrackSelector.MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
        int index = getTrackRendererIndex(C.TRACK_TYPE_AUDIO);
        if (info == null || index == C.INDEX_UNSET) {
            return audioTracks;
        }

        TrackGroupArray groups = info.getTrackGroups(index);
        for (int i = 0; i < groups.length; ++i) {
            Format format = groups.get(i).getFormat(0);
            WritableMap audioTrack = Arguments.createMap();
            String name = format.label != null ? format.label : format.language;
            if (name == null) {
                name = "";
            }
            if (!addedLanguages.contains(name)) {
                audioTrack.putInt("index", i);
                audioTrack.putString("title", format.id != null ? format.id : "");
                audioTrack.putString("type", format.sampleMimeType);
                audioTrack.putString("language", format.language != null ? format.language : "");
                audioTracks.pushMap(audioTrack);
                addedLanguages.add(name);
            }
        }
        return audioTracks;
    }

    private WritableArray getTextTrackInfo() {
        WritableArray textTracks = Arguments.createArray();
        final Set<String> addedLanguages = new HashSet<>();

        MappingTrackSelector.MappedTrackInfo info = trackSelector.getCurrentMappedTrackInfo();
        int index = getTrackRendererIndex(C.TRACK_TYPE_TEXT);
        if (info == null || index == C.INDEX_UNSET) {
            return textTracks;
        }

        TrackGroupArray groups = info.getTrackGroups(index);
        for (int i = 0; i < groups.length; ++i) {
            Format format = groups.get(i).getFormat(0);
            String name = format.label != null ? format.label : format.language;
            if (name == null) {
                name = "";
            }
            if (!addedLanguages.contains(name)) {
                WritableMap textTrack = Arguments.createMap();
                textTrack.putInt("index", i);
                textTrack.putString("title", format.id != null ? format.id : "");
                textTrack.putString("type", format.sampleMimeType);
                textTrack.putString("language", format.language != null ? format.language : "");
                textTracks.pushMap(textTrack);
                addedLanguages.add(name);
            }
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
    public void onCues(List<Cue> cues) {
    }

    @Override
    public void onPositionDiscontinuity(
            Player.PositionInfo oldPosition, Player.PositionInfo newPosition, @Player.DiscontinuityReason int reason) {
        if (playerNeedsSource) {
            // This will only occur if the user has performed a seek whilst in the error state. Update the
            // resume position so that if the user then retries, playback will resume from the position to
            // which they seeked.
            updateResumePosition();
        }

        if (reason == Player.DISCONTINUITY_REASON_SEEK) {
            clearResumePosition();
        }

        // While switching from ad period to content period, the onPlaybackStateChanged() event
        // is not triggered sometimes, because the media file will be preloaded, so the buffer /
        // ready state switching may not occur. We can try to handle the seek action in here.
        if (reason == Player.DISCONTINUITY_REASON_AUTO_TRANSITION) {
            trySeekToResumePosition();
        }

        // When repeat is turned on, reaching the end of the video will not cause a state change
        // so we need to explicitly detect it.
        if (reason == Player.DISCONTINUITY_REASON_AUTO_TRANSITION
                && player.getExoPlayer().getRepeatMode() == Player.REPEAT_MODE_ONE) {
            eventEmitter.end();
        }
    }

    @Override
    public void onTimelineChanged(Timeline timeline, int reason) {
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
    public void onPlayerError(@NonNull PlaybackException error) {
        String errorString = null;
        Exception ex = error;
        @ExoPlaybackException.Type int errorType = DorisExceptionUtil.getErrorType(error);
        if (DorisExceptionUtil.isBehindLiveWindow(error)) {
            ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
            if (exoPlayer != null) {
                clearResumePosition();
                exoPlayer.seekToDefaultPosition();
                exoPlayer.prepare();
            }
        } else if (!hasReloadedCurrentSource && DorisExceptionUtil.isUnauthorizedException(error)) {
            hasReloadedCurrentSource = true;
            eventEmitter.reloadCurrentSource(src.getId(), metadata.getType());
            resetSourceUrl();
        } else if (errorType == ExoPlaybackException.TYPE_RENDERER) {
            Exception cause = (Exception) error.getCause();
            if (cause instanceof MediaCodecRenderer.DecoderInitializationException) {
                ex = cause;
                // Special case for decoder initialization failures.
                MediaCodecRenderer.DecoderInitializationException decoderInitializationException = (MediaCodecRenderer.DecoderInitializationException) cause;
                if (decoderInitializationException.getCause() instanceof MediaCodecUtil.DecoderQueryException) {
                    errorString = getResources().getString(R.string.error_querying_decoders);
                } else if (decoderInitializationException.secureDecoderRequired) {
                    errorString = getResources().getString(R.string.error_no_secure_decoder,
                            decoderInitializationException.mimeType);
                } else {
                    errorString = getResources().getString(R.string.error_no_decoder,
                            decoderInitializationException.mimeType);
                }
            } else if (cause instanceof DrmSession.DrmSessionException) {
                ex = cause;
                errorString = getResources().getString(R.string.error_drm_unknown);
            }
        } else if (errorType == ExoPlaybackException.TYPE_SOURCE) {
            Exception cause = (Exception) error.getCause();
            if (cause != null) {
                ex = cause;
            }
            errorString = getResources().getString(R.string.unrecognized_media_format);
        }
        if (errorString != null) {
            resetSourceUrl();
            eventEmitter.error(errorString, ex);
        }
        playerNeedsSource = true;
        if (!DorisExceptionUtil.isBehindLiveWindow(error)) {
            updateResumePosition();
        }
    }

    private void resetSourceUrl() {
        if (src != null) {
            src.setUrl("");
        }
    }

    public int getTrackRendererIndex(int trackType) {
        if (player != null) {
            ExoPlayer exoPlayer = player.getExoPlayer();
            int rendererCount = exoPlayer.getRendererCount();
            for (int rendererIndex = 0; rendererIndex < rendererCount; rendererIndex++) {
                if (exoPlayer.getRendererType(rendererIndex) == trackType) {
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

    public void setSrc(
            String url,
            String id,
            String extension,
            String type,
            ReadableArray textTracks,
            ActionToken actionToken,
            Map<String, String> headers,
            Map<String, Object> muxData,
            Map<String, Object> ima,
            String channelId,
            String seriesId,
            String seasonId,
            String playlistId,
            int duration,
            String channelName,
            boolean apsTestFlag,
            @Nullable String adTagUrl) {
        if (url != null) {
            String srcUrl = src != null ? src.getUrl() : null;
            boolean isOriginalSourceNull = srcUrl == null;
            boolean isSourceEqual = url.equals(srcUrl);

            this.correlationId = UUID.randomUUID();
            this.isImaDaiStream = false;
            this.isImaDaiStreamLoaded = false;
            this.isImaCsaiStream = false;
            if (ima != null && !ima.isEmpty()) {
                this.isImaDaiStream = true;
                this.imaDaiSrc = new RNImaDaiSource(ima);
            } else if (adTagUrl != null) {
                this.isImaCsaiStream = true;
            }

            this.src = new RNSource(
                    url,
                    id,
                    extension,
                    isLive,
                    getTextTracks(textTracks),
                    headers,
                    muxData,
                    null,
                    null,
                    channelId,
                    seriesId,
                    seasonId,
                    playlistId,
                    duration,
                    channelName,
                    apsTestFlag,
                    adTagUrl);
            this.actionToken = actionToken;

            initializePlayer(!isOriginalSourceNull && !isSourceEqual);
        }
    }

    public void setMetadata(RNMetadata metadata) {
        this.metadata = metadata;

        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setTitle(metadata.getTitle());
            exoDorisPlayerView.setDescription(metadata.getDescription());
            exoDorisPlayerView.setChannelLogo(metadata.getChannelLogoUrl());
        }
    }

    public void setProgressUpdateInterval(final float progressUpdateInterval) {
        this.jsProgressUpdateInterval = progressUpdateInterval;
    }

    public void setRawSrc(@NonNull final Uri uri, @Nullable final String extension) {
        if (uri != null) {
            boolean isOriginalSourceNull = src.getUrl() == null;
            boolean isSourceEqual = uri.equals(src.getUrl());

            this.src.setUri(uri);
            this.src.setExtension(extension);

            initializePlayer(!isOriginalSourceNull && !isSourceEqual);
        }
    }

    public void setResizeModeModifier(@ResizeMode.Mode int resizeMode) {
        exoDorisPlayerView.setResizeMode(resizeMode);
    }

    public void setRepeatModifier(boolean repeat) {
        if (player != null) {
            ExoPlayer exoPlayer = player.getExoPlayer();
            if (repeat) {
                exoPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);
            } else {
                exoPlayer.setRepeatMode(Player.REPEAT_MODE_OFF);
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

        if (groups.isEmpty()) {
            type = "disabled";
        } else if (TextUtils.isEmpty(type)) {
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
                        = (CaptioningManager) themedReactContext.getSystemService(Context.CAPTIONING_SERVICE);
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
        if (isPaused || isBuffering) {
            showOverlay();
        } else {
            hideOverlay();
        }
    }

    public void setMutedModifier(boolean muted) {
        isMuted = muted;

        if (player != null) {
            player.getExoPlayer().setVolume(muted ? 0 : 1);
        }
    }

    public void setVolumeModifier(float volume) {
        if (player != null) {
            player.getExoPlayer().setVolume(volume);
        }
    }

    private void trySeekToResumePosition() {
        // For CSAI playback, the seekTo() may be ignored while playing ads.
        // We should suspend the seek action until we start playing the content period.
        if (resumePosition != C.POSITION_UNSET && player != null && !player.getExoPlayer().isPlayingAd()) {
            // For live playback, we should switch the timestamp to seek position of the window.
            long seekPosition = getSeekPosition(resumePosition);
            if (seekPosition == SEEK_POSITION_INVALID) {
                // The provided timestamp is invalid: before the start or after the end of the window.
                clearResumePosition();
            } else if (seekPosition != C.POSITION_UNSET) {
                // For live playback, the timeline is ready for seek in here.
                seekTo(seekPosition);
                clearResumePosition();
            }
        }
    }

    public void resumeTo(long positionMs) {
        resumeWindow = 0;
        resumePosition = positionMs;
        haveResumePosition = true;
    }

    public void seekTo(long positionMs) {
        if (player != null) {
            ExoPlayer exoPlayer = player.getExoPlayer();
            eventEmitter.seek(exoPlayer.getCurrentPosition(), positionMs);
            exoPlayer.seekTo(exoPlayer.getCurrentMediaItemIndex(), positionMs);
        } else {
            shouldSeekTo = positionMs;
        }
    }

    public void seekTo(String timestamp) {
        long positionMs = parseTimestamp(timestamp);
        long seekPosition = (positionMs == C.POSITION_UNSET ? C.POSITION_UNSET : getSeekPosition(positionMs));
        if (seekPosition != C.POSITION_UNSET && seekPosition != SEEK_POSITION_INVALID) {
            seekTo(seekPosition);
        }
    }

    public long parseTimestamp(String timestamp) {
        Locale currentLocale = getCurrentLocale();
        String dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(dateFormat, currentLocale);
        simpleDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

        try {
            Date seekPosition = simpleDateFormat.parse(timestamp);
            return seekPosition.getTime();
        } catch (ParseException e) {
            Log.e(TAG, "Unable to parse provided timestamp, " + timestamp +
                    ". Timestamp should be of the format \"2020-01-01T00:00:00.000Z\".");
        }
        return C.POSITION_UNSET;
    }

    private long getSeekPosition(long positionMs) {
        if (src == null || !src.isLive() || positionMs == C.TIME_UNSET) {
            return positionMs;
        }

        long seekPosition = C.POSITION_UNSET;
        ExoPlayer exoPlayer = player.getExoPlayer();
        Timeline timeline = exoPlayer.getCurrentTimeline();

        if (!timeline.isEmpty()) {
            long windowStartTimeMs = timeline.getWindow(exoPlayer.getCurrentMediaItemIndex(), new Timeline.Window()).windowStartTimeMs;
            if (windowStartTimeMs != C.TIME_UNSET) {
                long seekPositionInWindowMs = positionMs - windowStartTimeMs;
                long duration = exoPlayer.getDuration();

                if (seekPositionInWindowMs > 0 && seekPositionInWindowMs <= duration) {
                    seekPosition = seekPositionInWindowMs;
                } else {
                    seekPosition = SEEK_POSITION_INVALID;
                    Log.e(TAG, "The provided timestamp, " + positionMs + ", is either " +
                            "before the start of the stream or the difference between the " +
                            "current time and the provided timestamp is greater than the " +
                            "duration of the content.");
                }
            } else {
                Log.e(TAG, "HLS playlist doesn't have an EXT-X-PROGRAM-DATE-TIME tag.");
            }
        }
        return seekPosition;
    }

    @SuppressWarnings("deprecation")
    private Locale getCurrentLocale() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return getResources().getConfiguration().getLocales().get(0);
        } else {
            return getResources().getConfiguration().locale;
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
            player.getExoPlayer().setPlaybackParameters(params);
        }
    }

    public void setPlayInBackground(boolean playInBackground) {
        this.playInBackground = playInBackground;
    }

    public void setDisableFocus(boolean disableFocus) {
        this.disableFocus = disableFocus;
    }

    public void setUseTextureView(boolean useTextureView) {
    }

    public void setBufferConfig(int newMinBufferMs, int newMaxBufferMs, int newBufferForPlaybackMs, int newBufferForPlaybackAfterRebufferMs) {
        releasePlayer();
        initializePlayer(false);
    }

    public void setColorProgressBar(String color) {
        try {
            accentColor = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            Log.e(getClass().getSimpleName(), e.getMessage(), e);
        }
    }

    public void setLabelFont(final String fontName) {
        Typeface typeface = Typeface.createFromAsset(getResources().getAssets(), "fonts/" + fontName + ".ttf");
    }

    public void setLive(final boolean live) {
        this.isLive = live;

        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setIsLive(live);
        }
    }

    public void setEpg(boolean hasEpg) {
        this.hasEpg = hasEpg;
    }

    public void setStats(boolean hasStats) {
        this.hasStats = hasStats;
    }

    public void setAreControlsAllowed(boolean allowed) {
        areControlsAllowed = allowed;
        setControls(allowed);
    }

    public void setControls(final boolean visible) {
        areControlsVisible = visible;
        if (visible) {
            if (!exoDorisPlayerView.getUseController()) {
                exoDorisPlayerView.setUseController(true);
            }
            exoDorisPlayerView.showController();
            exoDorisPlayerView.requestFocus();
        } else {
            exoDorisPlayerView.hideController();
        }
    }

    public void setRelatedVideos(List<RelatedVideo> relatedVideos, int playlistHeadIndex, boolean hasMore) {
        if (exoDorisPlayerView != null) {
            VideoTile[] videoTiles = new VideoTile[relatedVideos.size()];

            for (int i = 0; i < relatedVideos.size(); i++) {
                String thumbnailUrl = relatedVideos.get(i).getThumbnailUrl();
                String title = relatedVideos.get(i).getTitle();
                String subtitle = relatedVideos.get(i).getSubtitle();
                Map<String, Object> relatedVideoMap = relatedVideos.get(i).getRelatedVideoMap();

                videoTiles[i] = new VideoTile(thumbnailUrl, title, subtitle, relatedVideoMap);
            }

            exoDorisPlayerView.setMoreVideosTiles(videoTiles);
        }
    }

    public void setButtons(
            boolean showWatchlistButton,
            boolean showFavouriteButton,
            boolean showEpgButton,
            boolean showStatsButton) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setShowWatchlistButton(showWatchlistButton);
            exoDorisPlayerView.setShowFavoriteButton(showFavouriteButton);
            exoDorisPlayerView.setShowEpgButton(showEpgButton);
            exoDorisPlayerView.setShowStatsButton(showStatsButton);
        }
    }

    public void setIsFavourite(boolean isFavourite) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setIsFavorite(isFavourite);
        }
    }

    public void setControlsOpacity(final float opacity) {
    }

    public void setProgressBarMarginBottom(int marginBottom) {
    }

    public void setStateOverlay(final String state) {
        float alpha = getAlphaFromState(state);
    }

    public void setStateMiddleCoreControls(final String state) {
        float alpha = getAlphaFromState(state);
    }

    public void setStateProgressBar(final String state) {
        boolean enabled = getEnabledFromState(state);
        float alpha = getAlphaFromState(state);
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

        if (player != null) {
            player.setVideoSurfaceView(exoDorisPlayerView.getVideoSurfaceView());

            if (isImaDaiStream && !isImaDaiStreamLoaded && exoDorisImaDaiPlayer != null) {
                loadImaDaiStream();
            }
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
        if (!areControlsVisible &&
                event.getKeyCode() != KeyEvent.KEYCODE_MEDIA_PLAY &&
                event.getKeyCode() != KeyEvent.KEYCODE_MEDIA_PAUSE &&
                event.getKeyCode() != KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE &&
                event.getKeyCode() != KeyEvent.KEYCODE_BACK) {
            return true;
        }

        return (exoDorisPlayerView.getPlayer() != null && exoDorisPlayerView.dispatchKeyEvent(event)) || super.dispatchKeyEvent(event);
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
            ObjectAnimator anim = ObjectAnimator.ofFloat(button, "scaleX", 1.1f);
            anim.setDuration(100);
            anim.start();

            ObjectAnimator anim2 = ObjectAnimator.ofFloat(button, "scaleY", 1.1f);
            anim2.setDuration(100);
            anim2.start();
        } else {
            ObjectAnimator anim = ObjectAnimator.ofFloat(button, "scaleX", 1f);
            anim.setDuration(100);
            anim.start();

            ObjectAnimator anim2 = ObjectAnimator.ofFloat(button, "scaleY", 1f);
            anim2.setDuration(100);
            anim2.start();
        }
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

    public void applyTranslations(Map<String, Object> translations) {
        this.translations = new RNTranslations(translations);
        setLabelsOnPLayerUi();
    }

    private void setLabelsOnPLayerUi() {
        if (exoDorisPlayerView != null && translations != null) {
            Labels labels = new LabelsBuilder()
                    .setEpgLabel(translations.getEpgLabel())
                    .setStatsLabel(translations.getStatsLabel())
                    .setPlayLabel(translations.getPlayLabel())
                    .setPauseLabel(translations.getPauseLabel())
                    .setLiveLabel(translations.getLiveLabel())
                    .setFavoriteLabel(translations.getFavoriteLabel())
                    .setWatchlistLabel(translations.getWatchlistLabel())
                    .setMoreVideosLabel(translations.getMoreVideosLabel())
                    .setSubtitlesLabel(translations.getCaptionsLabel())
                    .setRewindLabel(translations.getRewindLabel())
                    .setFastForwardLabel(translations.getFastForwardLabel())
                    .setAudioLanguagesLabel(translations.getAudioTracksLabel())
                    .setInfoLabel(translations.getInfoLabel())
                    .setAdsCountdownAdLabel(translations.getAdsCountdownAdLabel())
                    .setAdsCountdownOfLabel(translations.getAdsCountdownOfLabel())
                    .build();

            exoDorisPlayerView.setLabels(labels);
        }
    }

    @Override
    public void onAdEvent(AdEvent adEvent) {
        if (adEvent.getType() == AD_BREAK_STARTED) {
            if (areControlsAllowed) {
                setControls(false);
            }
            return;
        }

        if (adEvent.getType() == AD_BREAK_ENDED) {
            if (areControlsAllowed) {
                setControls(true);
            }
        }
    }

    @Override
    public void onAdError(AdErrorEvent adErrorEvent) {
        AdError error = adErrorEvent.getError();
        if (!hasReloadedCurrentSource && isUnauthorizedAdError(error)) {
            hasReloadedCurrentSource = true;
            eventEmitter.reloadCurrentSource(src.getId(), metadata.getType());
        } else {
            eventEmitter.error(error.getMessage(), error);
        }

        // Reset imaDaiSrc and isImaDaiStream to allow a new source to be loaded
        imaDaiSrc = null;
        isImaDaiStream = false;
    }

    private boolean isUnauthorizedAdError(AdError error) {
        return error.getMessage().contains("HTTP status code: 403");
    }

    @Override
    public void onVideoTileClicked(VideoTile videoTile) {
        RelatedVideo relatedVideo = new RelatedVideo(videoTile.getTitle(),
                videoTile.getSubtitle(),
                videoTile.getThumbnailUrl(),
                videoTile.getRelatedVideo());
        eventEmitter.relatedVideoClick(relatedVideo.getId(), relatedVideo.getType());
    }

    @Override
    public void onMoreVideosButtonClicked() {
        eventEmitter.relatedVideosIconClicked();
    }

    @Override
    public void onFavoriteButtonClicked() {
        eventEmitter.favouriteButtonClick();
    }

    @Override
    public void onWatchlistButtonClicked() {
        // Todo: Once the watchlist button has been implemented, fire an event here when user clicks it
    }

    @Override
    public void onEpgButtonClicked() {
        eventEmitter.epgIconClick();
    }

    @Override
    public void onStatsButtonClicked() {
        eventEmitter.statsIconClick();
    }

    public void replaceAdTagParameters(Map<String, Object> replaceAdTagParametersMap) {
        if (replaceAdTagParametersMap == null || exoDorisImaDaiPlayer == null || exoDorisImaDaiPlayer.getImaDaiWrapper() == null) {
            return;
        }

        double startDate = replaceAdTagParametersMap.get(KEY_START_DATE) != null ? (double) replaceAdTagParametersMap.get(KEY_START_DATE) : Long.MIN_VALUE;
        double endDate = replaceAdTagParametersMap.get(KEY_END_DATE) != null ? (double) replaceAdTagParametersMap.get(KEY_END_DATE) : Long.MAX_VALUE;

        if (imaDaiSrc.getStartDate() != startDate || imaDaiSrc.getEndDate() != endDate) {
            Map<String, Object> adTagParametersMap = (Map<String, Object>) replaceAdTagParametersMap.get(KEY_AD_TAG_PARAMETERS);
            AdTagParameters adTagParameters = AdTagParametersHelper.createAdTagParameters(getContext(), adTagParametersMap);
            adTagParameters.setCustParams(adTagParameters.getCustParams() + "&pw=" + viewWidth
                    + "&ph=" + viewHeight);

            imaDaiSrc.replaceAdTagParameters(adTagParametersMap, startDate, endDate);
            exoDorisImaDaiPlayer.getImaDaiWrapper().replaceAdTagParameters(adTagParameters, (long) startDate, (long) endDate);
        }
    }

    @Override
    public void onRequireAdTagParameters(long seekPosition) {
        eventEmitter.requireAdParameters((double) seekPosition, true);
    }
}
