package com.brentvatne.exoplayer;

import static com.diceplatform.doris.entity.DorisPlayerEvent.Event.TIMELINE_ADJUSTER_CHANGED;

import android.annotation.SuppressLint;
import android.content.Context;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.os.PowerManager;
import android.support.v4.media.session.MediaSessionCompat;
import android.text.TextUtils;
import android.view.Choreographer;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.accessibility.CaptioningManager;
import android.widget.FrameLayout;

import androidx.annotation.ColorInt;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.AdViewProvider;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.Format;
import androidx.media3.common.Metadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.PlaybackParameters;
import androidx.media3.common.Player;
import androidx.media3.common.Timeline;
import androidx.media3.common.TrackSelectionOverride;
import androidx.media3.common.Tracks;
import androidx.media3.common.endeavor.LimitedSeekRange;
import androidx.media3.common.text.CueGroup;
import androidx.media3.common.util.Log;
import androidx.media3.common.util.Util;
import androidx.media3.exoplayer.ExoPlaybackException;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.analytics.AnalyticsListener;
import androidx.media3.exoplayer.drm.DrmSession;
import androidx.media3.exoplayer.mediacodec.MediaCodecRenderer;
import androidx.media3.exoplayer.mediacodec.MediaCodecUtil;
import androidx.media3.exoplayer.source.TrackGroupArray;
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector;
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector.Parameters;
import androidx.media3.exoplayer.trackselection.MappingTrackSelector;
import androidx.media3.session.ext.MediaSessionConnector;

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
import com.brentvatne.entity.Watermark;
import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
import com.brentvatne.util.AdTagParametersHelper;
import com.brentvatne.util.ImdbGenreMap;
import com.dice.shield.drm.entity.ActionToken;
import com.diceplatform.doris.DorisPlayerOutput;
import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.custom.ui.entity.program.ProgramInfo;
import com.diceplatform.doris.entity.AdTagParameters;
import com.diceplatform.doris.entity.DorisAdEvent;
import com.diceplatform.doris.entity.DorisAdEvent.AdMarkers;
import com.diceplatform.doris.entity.DorisAdEvent.AdType;
import com.diceplatform.doris.entity.DorisPlayerEvent;
import com.diceplatform.doris.entity.ImaCsaiProperties;
import com.diceplatform.doris.entity.ImaDaiProperties;
import com.diceplatform.doris.entity.ImaDaiPropertiesBuilder;
import com.diceplatform.doris.entity.Source;
import com.diceplatform.doris.entity.SourceBuilder;
import com.diceplatform.doris.entity.TextTrack;
import com.diceplatform.doris.entity.YoSsaiProperties;
import com.diceplatform.doris.ext.imacsailive.ExoDorisImaCsaiLivePlayer;
import com.diceplatform.doris.internal.ResumePositionHandler;
import com.diceplatform.doris.ui.ExoDorisPlayerView;
import com.diceplatform.doris.ui.ExoDorisPlayerViewListener;
import com.diceplatform.doris.ui.ExoDorisTvPlayerView;
import com.diceplatform.doris.ui.entity.Labels;
import com.diceplatform.doris.ui.entity.LabelsBuilder;
import com.diceplatform.doris.ui.entity.VideoTile;
import com.diceplatform.doris.util.DorisExceptionUtil;
import com.diceplatform.doris.util.LocalizationService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.imggaming.tracks.TrackPreferenceStorage;
import com.imggaming.widgets.DceWatermarkWidget;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

@SuppressLint("ViewConstructor")
class ReactTVExoplayerView extends FrameLayout implements LifecycleEventListener,
        Player.Listener,
        AnalyticsListener,
        BecomingNoisyListener,
        AudioManager.OnAudioFocusChangeListener,
        ExoDorisPlayerViewListener {

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

    static {
        DEFAULT_COOKIE_MANAGER = new CookieManager();
        DEFAULT_COOKIE_MANAGER.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
    }

    private final VideoEventEmitter eventEmitter;

    private final ReactTVExoDorisFactory exoDorisFactory;
    private ExoDorisTvPlayerView exoDorisPlayerView;
    private DceWatermarkWidget watermarkWidget;
    private ExoDoris player;
    private DefaultTrackSelector trackSelector;
    private Source source;
    private boolean playerNeedsSource;
    private long resumePosition; // unit: millisecond
    private boolean loadVideoStarted;
    private boolean isInBackground = false;
    private boolean fromBackground = false;
    private boolean isPaused;
    private boolean isBuffering;
    private boolean isMediaKeysEnabled = true;
    private boolean areControlsVisible = true;
    private boolean areControlsAllowed = true;
    private float rate = 1f;
    private final boolean isAmazonFireTv;
    private int viewWidth = 0;
    private int viewHeight = 0;
    private boolean hasReloadedCurrentSource = false;
    private boolean isMuted = false;

    // Props from React
    private RNSource src;
    private RNMetadata metadata;
    private RNTranslations translations;
    private boolean repeat;
    private String audioTrackType;
    private Dynamic audioTrackValue;
    private String textTrackType;
    private Dynamic textTrackValue;
    private boolean disableFocus;
    private boolean isLive = false;
    private boolean hasEpg;
    private boolean hasStats;
    private float jsProgressUpdateInterval = 250.0f;
    // \ End props

    // AD relative
    private AdType adType;
    private ExoDorisTvPlayerView secondaryPlayerView;

    // IMA DAI
    private RNImaDaiSource imaDaiSrc;
    private boolean isImaDaiStreamLoaded = false;
    private AdTagParameters adTagParameters;

    // Custom
    private final PowerManager powerManager;
    private long playerViewCreationTime;
    private long playerInitTime;

    // React
    private final ThemedReactContext themedReactContext;
    private final AudioManager audioManager;
    private final AudioBecomingNoisyReceiver audioBecomingNoisyReceiver;

    private final float NATIVE_PROGRESS_UPDATE_INTERVAL = 250.0f;

    @SuppressLint("HandlerLeak")
    private final Handler jsProgressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            if (msg.what == SHOW_JS_PROGRESS) {
                ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
                if (exoPlayer != null && exoPlayer.getPlaybackState() == Player.STATE_READY && exoPlayer.getPlayWhenReady()) {
                    long position = player.getCurrentPosition();
                    long bufferedDuration = player.getBufferedPosition();
                    long duration = player.getDuration();

                    if (!isLive) {
                        boolean isAboutToEnd = duration - position <= 5_000;
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
                    if (isLive && adType == AdType.IMA_DAI) {
                        long windowStartTimeMs = player.getWindowStartTime();
                        if (windowStartTimeMs != C.TIME_UNSET) {
                            long positionMs = player.getCurrentPosition();
                            long playingDate = (windowStartTimeMs + positionMs) / 1000L;
                            if (playingDate < imaDaiSrc.getStartDate() || playingDate > imaDaiSrc.getEndDate()) {
                                eventEmitter.requireAdParameters((double) playingDate, false);
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
            Log.d(TAG, "APS - Successful response");
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
    private Runnable initRunnable;

    //MediaSession
    private final MediaSessionCompat mediaSession;
    private final MediaSessionConnector mediaSessionConnector;

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
        exoDorisFactory = new ReactTVExoDorisFactory();

        clearResumePosition();
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
        exoDorisPlayerView.setShowBuffering(ExoDorisPlayerView.SHOW_BUFFERING_WHEN_PLAYING);
        secondaryPlayerView = findViewById(R.id.secondaryPlayerView);

        // Watermark view.
        if (exoDorisPlayerView.getChildCount() > 1) {
            watermarkWidget = new DceWatermarkWidget(themedReactContext);
            exoDorisPlayerView.addView(watermarkWidget, 1);
        }

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
        if (trackSelector != null && width > 0 && height > 0) {
            trackSelector.setParameters(trackSelector.buildUponParameters().setMaxVideoSize(viewWidth, viewHeight));
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

    protected boolean isInBackground() {
        return isInBackground;
    }

    private void initializePlayer(final boolean force) {
        if (initRunnable != null) {
            removeCallbacks(initRunnable);
        }
        initRunnable = () -> doInitializePlayer(force);
        post(initRunnable);
    }

    // Internal methods
    private void doInitializePlayer(boolean force) {
        if (force) {
            releasePlayer();
        }
        if (player == null) {
            Parameters.Builder parametersBuilder = new Parameters.Builder(getContext());
            String preferredSubtitleLang = getPreferredSubtitleLang();
            if (preferredSubtitleLang != null) {
                parametersBuilder.setPreferredTextLanguage(preferredSubtitleLang);
            } else {
                parametersBuilder.setDisabledTextTrackSelectionFlags(C.SELECTION_FLAG_DEFAULT);
            }

            AdViewProvider adViewProvider = adType == AdType.IMA_CSAI_LIVE ? secondaryPlayerView : exoDorisPlayerView;
            player = exoDorisFactory.createPlayer(
                    getContext(),
                    adType,
                    MAX_LOAD_BUFFER_MS,
                    exoDorisPlayerView.getFastForwardIncrementMs(),
                    exoDorisPlayerView.getRewindIncrementMs(),
                    parametersBuilder,
                    adViewProvider);

            player.setDorisListener(dorisListener);
            trackSelector = player.getTrackSelector();
            ExoPlayer exoPlayer = player.getExoPlayer();

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .build();

            exoPlayer.setAudioAttributes(audioAttributes, false);
            exoPlayer.addListener(this);
            exoPlayer.addAnalyticsListener(this);
            exoDorisPlayerView.setPlayer(player.createForwardPlayer());
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

            showOverlay();
            showWatermark();

            SourceBuilder sourceBuilder = new SourceBuilder();
            if (adType == AdType.IMA_DAI) {
                ImaDaiProperties imaDaiProperties = new ImaDaiPropertiesBuilder()
                        .setAssetKey(imaDaiSrc.getAssetKey())
                        .setContentSourceId(imaDaiSrc.getContentSourceId())
                        .setVideoId(imaDaiSrc.getVideoId())
                        .setAuthToken(imaDaiSrc.getAuthToken())
                        .setLanguage("es_US") // TODO get language from JS side as mobile done.
                        .setAdTagParameters(adTagParameters)
                        .setAdTagParametersValidFrom((long) imaDaiSrc.getStartDate())
                        .setAdTagParametersValidUntil((long) imaDaiSrc.getEndDate())
                        .build();
                sourceBuilder.setImaDaiProperties(imaDaiProperties);
            } else if (src.getImaCsai() != null) {
                sourceBuilder.setImaCsaiProperties(src.getImaCsai());
            }
            sourceBuilder
                    .setId(src.getId())
                    .setUrl(src.getUrl())
                    .setMimeType(src.getMimeType())
                    .setYoSsaiProperties(src.getYoSsai())
                    .setTextTracks(src.getTextTracks())
                    .setDrmParams(actionToken);

            Map<String, Object> muxData = src.getMuxData();
            if (muxData != null) {
                String correlationId = (String) muxData.get("correlationId");
                sourceBuilder.setMuxProperties(muxData, correlationId, exoDorisPlayerView.getVideoSurfaceView());
            }

            LimitedSeekRange limitedSeekRange = isLive ? src.getLimitedSeekRange() : null;
            if (limitedSeekRange != null) {
                sourceBuilder.setLimitedSeekRange(limitedSeekRange);
            } else {
                sourceBuilder.setResumePosition(resumePosition);
            }
            source = sourceBuilder.build();

            playerInitTime = new Date().getTime();

            if (adType == AdType.IMA_DAI) {
                if (!isImaDaiStreamLoaded && viewWidth != 0 && viewHeight != 0) {
                    loadImaDaiStream();
                }
            } else {
                player.load(source);
            }

            exoDorisPlayerView.setLimitedSeekRange(limitedSeekRange);

            playerNeedsSource = false;
            eventEmitter.loadStart();
            loadVideoStarted = true;
        }
    }

    private String getPreferredSubtitleLang() {
        TrackPreferenceStorage trackPreferenceStorage = TrackPreferenceStorage.getInstance(getContext());
        if (!trackPreferenceStorage.isEnabled()) {
            return src.getSelectedSubtitleTrack();
        }
        return trackPreferenceStorage.isNoSubtitlePreferred() ?
                null : trackPreferenceStorage.getPreferredSubtitleLanguage();
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
        exoDorisPlayerView.showController();

        ImaDaiProperties imaDaiProperties = source.getImaDaiProperties();
        imaDaiProperties.setAdTagParameters(adTagParameters);
        imaDaiProperties.setAdTagParametersValidFrom((long) imaDaiSrc.getStartDate());
        imaDaiProperties.setAdTagParametersValidUntil((long) imaDaiSrc.getEndDate());

        player.load(source);
    }

    private AmazonFireTVAdRequest createApsBidRequest() {
        Gson gson = new Gson();
        ApsSource apsSource = createApsSource();
        if (apsSource == null) {
            return null;
        }
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
        if (TextUtils.isEmpty(custParams)
                || custParams.indexOf(KEY_FIRST_CATEGORY) < 0
                || custParams.indexOf(KEY_RATING) < 0) {
            return null;
        }

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
        LocalizationService localizationService = new LocalizationService(Locale.getDefault());
        if (textTracks != null && textTracks.size() > 0) {
            TextTrack[] dorisTextTracks = new TextTrack[textTracks.size()];
            for (int i = 0; i < textTracks.size(); ++i) {
                ReadableMap textTrack = textTracks.getMap(i);
                String uri = textTrack.getString("uri");
                String isoCode = textTrack.getString("language");
                String name = isoCode != null
                        ? localizationService.getLocalizedLanguageLabel(isoCode, true)
                        : null;
                dorisTextTracks[i] = new TextTrack(
                        Uri.parse(uri),
                        name,
                        isoCode);
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
        eventEmitter.error("DRM exception: " + errorString, exception);
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
            clearResumePosition();
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
        hideWatermark();
        onStopPlayback();
        releasePlayer();
    }

    private void onStopPlayback() {
        setKeepScreenOn(false);
        audioManager.abandonAudioFocus(this);
    }

    private void updateResumePosition() {
        ExoPlayer exoPlayer = (player == null ? null : player.getExoPlayer());
        if (exoPlayer != null && !exoPlayer.isCurrentMediaItemLive()) {
            resumePosition = Math.max(0, exoPlayer.getCurrentPosition());
        }
    }

    private void clearResumePosition() {
        resumePosition = ResumePositionHandler.RESUME_UNSET;
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
        } else if (player != null) {
            // When reach the endTime of limited seek range, we need to notify the JS side to show the restart layout.
            // We will seek to start position at first, and then play() when user click the restart button.
            if (LimitedSeekRange.isUseLiveAsVod(player.getLimitedSeekRange()) && player.getPlaybackState() == Player.STATE_ENDED) {
                player.seekTo(0);
                eventEmitter.endLiveChannelAsVod();
            }
        }
    }

    @Override
    public void onPlaybackStateChanged(int state) {
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

    private void startProgressHandler() {
        jsProgressHandler.sendEmptyMessage(SHOW_JS_PROGRESS);
        nativeProgressHandler.sendEmptyMessage(SHOW_NATIVE_PROGRESS);
    }

    private void videoLoaded() {
        if (loadVideoStarted) {
            loadVideoStarted = false;
            if (audioTrackType != null && audioTrackValue != null) {
                setSelectedAudioTrack(audioTrackType, audioTrackValue);
            }
            if (textTrackType != null && textTrackValue != null) {
                setSelectedTextTrack(textTrackType, textTrackValue);
            }
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
        eventEmitter.buffering(buffering);
    }

    @Override
    public void onCues(@NonNull CueGroup cueGroup) {
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
    public void onTracksChanged(@NonNull Tracks tracksInfo) {
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
            eventEmitter.error("Playback exception: " + errorString, ex);
        }
        playerNeedsSource = true;
        if (!DorisExceptionUtil.isBehindLiveWindow(error)) {
            updateResumePosition();
        }
    }

    private void resetSourceUrl() {
        if (src != null) {
            src.setUrl("");
            src.setMimeType(null);
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
            String mimeType,
            String id,
            String extension,
            String type,
            ReadableArray textTracks,
            ActionToken actionToken,
            Map<String, String> headers,
            Map<String, Object> muxData,
            ImaCsaiProperties imaCsai,
            Map<String, Object> imaDai,
            YoSsaiProperties yoSsai,
            String channelId,
            String seriesId,
            String seasonId,
            String playlistId,
            int duration,
            String channelName,
            boolean apsTestFlag,
            Watermark watermark,
            LimitedSeekRange limitedSeekRange,
            boolean shouldSaveSubtitleSelection,
            String selectedSubtitleTrack) {
        if (url != null) {
            String srcUrl = src != null ? src.getUrl() : null;
            boolean isOriginalSourceNull = srcUrl == null;
            boolean isSourceEqual = url.equals(srcUrl);

            this.adType = null;
            this.imaDaiSrc = null;
            this.isImaDaiStreamLoaded = false;
            if (yoSsai != null) {
                this.adType = AdType.YO_SSAI;
            } else if (imaDai != null && !imaDai.isEmpty()) {
                this.adType = AdType.IMA_DAI;
                this.imaDaiSrc = new RNImaDaiSource(imaDai);
            } else if (imaCsai != null && imaCsai.midRollAdTagUri != null) {
                this.adType = AdType.IMA_CSAI_LIVE;
            } else if (imaCsai != null && imaCsai.preRollAdTagUri != null) {
                this.adType = AdType.IMA_CSAI;
            }

            this.src = new RNSource(
                    url,
                    mimeType,
                    id,
                    extension,
                    isLive,
                    getTextTracks(textTracks),
                    headers,
                    muxData,
                    null,
                    selectedSubtitleTrack,
                    null,
                    channelId,
                    seriesId,
                    seasonId,
                    playlistId,
                    duration,
                    channelName,
                    apsTestFlag,
                    imaCsai,
                    yoSsai,
                    limitedSeekRange);
            this.actionToken = actionToken;
            if (watermarkWidget != null) {
                watermarkWidget.setWatermark(watermark);
            }
            TrackPreferenceStorage.getInstance(getContext()).setEnabled(shouldSaveSubtitleSelection);
            initializePlayer(!isOriginalSourceNull && !isSourceEqual);
        }
    }

    public void setMetadata(RNMetadata metadata) {
        this.metadata = metadata;

        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setEpisodeTitle(metadata.getEpisodeTitle());
            exoDorisPlayerView.setDescription(metadata.getDescription());
        }
    }

    public void setThumbnailsPreviewUrl(@Nullable String thumbnailsPreviewUrl) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setThumbnailsPreviewUrl(thumbnailsPreviewUrl);
        }
    }

    public void setProgramInfo(ProgramInfo programInfo) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setTitle(programInfo.getTitle());
            exoDorisPlayerView.setProgramDateRange(
                    programInfo.getStartDate(),
                    programInfo.getEndDate(),
                    programInfo.getDateFormat());
            exoDorisPlayerView.setChannelLogo(programInfo.getChannelLogoUrl());
        }
    }

    public void setLimitedSeekRange(LimitedSeekRange limitedSeekRange) {
        if (isLive) {
            player.limitSeekRange(limitedSeekRange);
            exoDorisPlayerView.setLimitedSeekRange(limitedSeekRange);
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

        Parameters disableParameters = trackSelector.getParameters()
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

        Parameters selectionParameters = trackSelector.getParameters()
                .buildUpon()
                .setRendererDisabled(rendererIndex, false)
                .setOverrideForType(new TrackSelectionOverride(groups.get(trackIndex), 0))
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

    public void resumeTo(long positionMs) {
        if (player != null) {
            player.setResumePosition(positionMs);
        } else {
            resumePosition = positionMs;
        }
    }

    public void seekTo(long positionMs) {
        if (player != null) {
            ExoPlayer exoPlayer = player.getExoPlayer();
            eventEmitter.seek(exoPlayer.getCurrentPosition(), positionMs);
            exoPlayer.seekTo(exoPlayer.getCurrentMediaItemIndex(), positionMs);
        } else {
            resumePosition = positionMs;
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
        return ResumePositionHandler.RESUME_UNSET;
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

    public void setLive(final boolean live) {
        this.isLive = live;

        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setIsLive(live);
        }
    }

    public boolean isLive() {
        return isLive;
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
            exoDorisPlayerView.requestFocus();
        } else {
            exoDorisPlayerView.hideController();
        }
    }

    public void setRelatedVideos(List<RelatedVideo> relatedVideos, int playlistHeadIndex, boolean hasMore) {
        if (exoDorisPlayerView != null) {
            List<VideoTile> videoTiles = new ArrayList<>();
            for (int i = 0; i < relatedVideos.size(); i++) {
                String thumbnailUrl = relatedVideos.get(i).getThumbnailUrl();
                String title = relatedVideos.get(i).getTitle();
                String subtitle = relatedVideos.get(i).getSubtitle();
                long duration = relatedVideos.get(i).getDuration();
                Map<String, Object> relatedVideoMap = relatedVideos.get(i).getRelatedVideoMap();
                videoTiles.add(new VideoTile(thumbnailUrl, title, subtitle, duration, relatedVideoMap));
            }
            if (exoDorisPlayerView != null) {
                exoDorisPlayerView.setMoreVideosTiles(videoTiles);
            }
        }
    }

    public void setButtons(
            boolean showWatchlistButton,
            boolean showFavouriteButton,
            boolean showEpgButton,
            boolean showStatsButton,
            boolean showAnnotationsButton) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setShowWatchlistButton(showWatchlistButton);
            exoDorisPlayerView.setShowFavoriteButton(showFavouriteButton);
            exoDorisPlayerView.setShowEpgButton(showEpgButton);
            exoDorisPlayerView.setShowStatsButton(showStatsButton);
            exoDorisPlayerView.setShowAnnotationsButton(showAnnotationsButton);
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
    }

    public void setStateMiddleCoreControls(final String state) {
    }

    public void setStateProgressBar(final String state) {
    }

    private boolean getEnabledFromState(String stateStr) {
        ControlState state = ControlState.make(stateStr);
        switch (state) {
            case HIDDEN:
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

            if (adType == AdType.IMA_DAI && !isImaDaiStreamLoaded && player != null) {
                loadImaDaiStream();
            }
        }
    }

    private Long controlsAutoHideTimeout;
    private final Runnable hideRunnable = () -> setStateOverlay(ControlState.HIDDEN.toString());

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        boolean isPlayingAd = player != null && player.isPlayingAd();
        if (!areControlsVisible && !isPlayingAd &&
                event.getKeyCode() != KeyEvent.KEYCODE_MEDIA_PLAY &&
                event.getKeyCode() != KeyEvent.KEYCODE_MEDIA_PAUSE &&
                event.getKeyCode() != KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE &&
                event.getKeyCode() != KeyEvent.KEYCODE_BACK) {
            return true;
        }
        return (exoDorisPlayerView != null && exoDorisPlayerView.dispatchKeyEvent(event)) || super.dispatchKeyEvent(event);
    }

    public void showWatermark(){
        if (watermarkWidget != null) {
            watermarkWidget.show();
        }
    }

    public void hideWatermark() {
        if (watermarkWidget != null) {
            watermarkWidget.hide();
        }
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

    public void applyTranslations(Map<String, Object> translations) {
        this.translations = new RNTranslations(translations);
        setLabelsOnPLayerUi();
    }

    public void applyPrimaryColor(@ColorInt int primaryColor) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setPrimaryColor(primaryColor);
        }
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
                    .setAnnotationsLabel(translations.getAnnotationsLabel())
                    .setAdsCountdownAdLabel(translations.getAdsCountdownAdLabel())
                    .setAdsCountdownOfLabel(translations.getAdsCountdownOfLabel())
                    .setPlayingLiveLabel(translations.getPlayingLiveLabel())
                    .setNowPlayingLabel(translations.getNowPlayingLabel())
                    .setAudioAndSubtitlesLabel(translations.getAudioAndSubtitlesLabel())
                    .build();

            exoDorisPlayerView.setLabels(labels);
        }
    }

    private boolean isUnauthorizedAdError(Exception error) {
        return error.getMessage().contains("HTTP status code: 403");
    }

    @Override
    public void onVideoTileClicked(VideoTile videoTile) {
        RelatedVideo relatedVideo = new RelatedVideo(videoTile.getTitle(),
                videoTile.getSubtitle(),
                videoTile.getDuration(),
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
    public void onAnnotationsButtonClicked() {
        eventEmitter.annotationsButtonClick();
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

    @Override
    public void onSubtitleSelected(String language) {
        TrackPreferenceStorage storage = TrackPreferenceStorage.getInstance(getContext());
        storage.storePreferredSubtitleLanguage(language == null
                ? TrackPreferenceStorage.NONE
                : language);
        eventEmitter.subtitleTrackChanged(language);
    }

    @Override
    public void onAudioSelected(String language) {
        // Do nothing.
    }

    public void replaceAdTagParameters(Map<String, Object> replaceAdTagParametersMap) {
        if (replaceAdTagParametersMap == null || player == null) {
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
            player.replaceAdTagParameters(adTagParameters, (long) startDate, (long) endDate);
        }
    }

    private final DorisPlayerOutput dorisListener = new DorisPlayerOutput() {
        @Override
        public void onPlayerEvent(DorisPlayerEvent playerEvent) {
            switch (playerEvent.details.state){
                case PLAYING:
                    eventEmitter.playbackRateChange(1f);
                    break;
                case PAUSED:
                    eventEmitter.playbackRateChange(0f);
                    break;
                case ENDED:
                    eventEmitter.playbackRateChange(0f);
                    if (exoDorisPlayerView != null) {
                        exoDorisPlayerView.hideController();
                    }
                    break;
            }
            if (playerEvent.event == TIMELINE_ADJUSTER_CHANGED && exoDorisPlayerView != null) {
                exoDorisPlayerView.setExtraTimelineAdjuster(playerEvent.details.timelineAdjuster);
            }
        }

        @Override
        public void onAdEvent(DorisAdEvent adEvent) {
            Log.d(TAG, "onAdEvent: " + adEvent);
            switch (adEvent.event) {
                case AD_BREAK_STARTED:
                    if (areControlsAllowed) {
                        setControls(false);
                    }
                    break;
                case AD_BREAK_ENDED:
                    // PlayerView does not expose SurfaceView, we should call setVisibility() and setPlayer().
                    if (isCsaiLiveEvent(adEvent)) {
                        exoDorisPlayerView.setVisibility(View.VISIBLE);
                        secondaryPlayerView.setPlayer(null);
                        secondaryPlayerView.setVisibility(View.GONE);
                    }
                    if (areControlsAllowed) {
                        setControls(true);
                    }
                    break;
                case AD_RESUMED:
                    // PlayerView does not expose SurfaceView, we should call setVisibility() and setPlayer().
                    if (isCsaiLiveEvent(adEvent)) {
                        secondaryPlayerView.setVisibility(View.VISIBLE);
                        exoDorisPlayerView.setVisibility(View.GONE);
                    }
                    break;
                case AD_LOADING:
                    // PlayerView does not expose SurfaceView, we should call setVisibility() and setPlayer().
                    if (isCsaiLiveEvent(adEvent)) {
                        secondaryPlayerView.setPlayer(((ExoDorisImaCsaiLivePlayer) player).getLiveAdExoPlayer());
                    }
                    break;
                case AD_MARKERS_CHANGED:
                    if (adEvent.details.adType != AdType.IMA_CSAI && exoDorisPlayerView != null) {
                        AdMarkers adMarkers = adEvent.details.adMarkers;
                        exoDorisPlayerView.setExtraAdGroupMarkers(adMarkers.adGroupTimesMs, adMarkers.playedAdGroups);
                        Log.d(TAG, adEvent.details.adType + " Ad Stream ID = " + adEvent.details.streamId);
                    }
                    break;
                case REQUIRE_AD_TAG_PARAMETERS:
                    if (adEvent.details.adType == AdType.IMA_DAI) {
                        eventEmitter.requireAdParameters((double) adEvent.details.positionMs, true);
                    }
                    break;
                case ERROR:
                    // We can ignore the csai ad error and make the content continue to playback.
                    boolean ignoreAdError = adEvent.details.adType == AdType.IMA_CSAI || adEvent.details.adType == AdType.IMA_CSAI_LIVE;
                    if (adEvent.details.adType == AdType.IMA_DAI) {
                        Exception error = adEvent.details.error;
                        if (!hasReloadedCurrentSource && isUnauthorizedAdError(error)) {
                            hasReloadedCurrentSource = true;
                            ignoreAdError = true;
                            eventEmitter.reloadCurrentSource(src.getId(), metadata.getType());
                        }
                    }
                    if (!ignoreAdError) {
                        eventEmitter.error("Ad exception", adEvent.details.error);
                    }
                    break;
                default:
                    break;
            }
        }

        private boolean isCsaiLiveEvent(DorisAdEvent adEvent) {
            return adEvent.details.adType == AdType.IMA_CSAI_LIVE && exoDorisPlayerView != null && secondaryPlayerView != null;
        }
    };
}
