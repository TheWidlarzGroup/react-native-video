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

import com.amazon.device.ads.aftv.AdBreakPattern;
import com.brentvatne.entity.RNApsSource;
import com.brentvatne.entity.RNImaSource;
import com.brentvatne.entity.RNSource;
import com.brentvatne.entity.RNTranslations;
import com.brentvatne.entity.RelatedVideo;
import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
import com.brentvatne.util.ImdbGenreMap;
import com.dice.shield.drm.entity.ActionToken;
import com.diceplatform.doris.ExoDoris;
import com.diceplatform.doris.ExoDorisBuilder;
import com.diceplatform.doris.entity.Source;
import com.diceplatform.doris.entity.SourceBuilder;
import com.diceplatform.doris.entity.TextTrack;
import com.diceplatform.doris.ext.ima.ExoDorisImaPlayer;
import com.diceplatform.doris.ext.ima.ExoDorisImaWrapper;
import com.diceplatform.doris.ext.ima.entity.AdInfo;
import com.diceplatform.doris.ext.ima.entity.AdTagParameters;
import com.diceplatform.doris.ext.ima.entity.AdTagParametersBuilder;
import com.diceplatform.doris.ext.ima.entity.ImaLanguage;
import com.diceplatform.doris.ext.ima.entity.ImaSource;
import com.diceplatform.doris.ext.ima.entity.ImaSourceBuilder;
import com.diceplatform.doris.ui.ExoDorisPlayerView;
import com.diceplatform.doris.ui.ExoDorisPlayerViewListener;
import com.diceplatform.doris.ui.entity.Labels;
import com.diceplatform.doris.ui.entity.LabelsBuilder;
import com.diceplatform.doris.ui.entity.VideoTile;
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
import com.google.android.exoplayer2.ControlDispatcher;
import com.google.android.exoplayer2.DefaultControlDispatcher;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.drm.DrmSession;
import com.google.android.exoplayer2.drm.UnsupportedDrmException;
import com.google.android.exoplayer2.ext.mediasession.MediaSessionConnector;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer;
import com.google.android.exoplayer2.mediacodec.MediaCodecUtil;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.MetadataOutput;
import com.google.android.exoplayer2.source.BehindLiveWindowException;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.util.Util;
import com.previewseekbar.base.PreviewView;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import static com.google.ads.interactivemedia.v3.api.AdEvent.AdEventType.AD_BREAK_ENDED;
import static com.google.ads.interactivemedia.v3.api.AdEvent.AdEventType.AD_BREAK_STARTED;

@SuppressLint("ViewConstructor")
class ReactTVExoplayerView extends FrameLayout
        implements LifecycleEventListener,
                   Player.EventListener,
                   BecomingNoisyListener,
                   AudioManager.OnAudioFocusChangeListener,
                   MetadataOutput,
                   AdEvent.AdEventListener,
                   AdErrorEvent.AdErrorListener,
                   ExoDorisPlayerViewListener {

    private static final String TAG = "ReactTvExoplayerView";
    private static final String AMAZON_FEATURE_FIRE_TV = "amazon.hardware.fire_tv";
    private static final String APS_APP_ID = "1a0f83d069f04b8abc59bdf5176e6103";
    private static final String[] APS_SLOT_IDS = new String[] {
            "867288e5-d8c8-4a51-a18f-750b5223b635",
            "b55cea15-1531-423b-88cf-27b0172d433c",
            "eac458da-981b-4ecb-b7c4-e61a44ab16b0",
            "72ab51cc-c3f5-479a-b430-6e50e32e7193"
    };
    private static  final String APS_VOD_CHANNEL_NAME = "PrendeTV";

    private static final CookieManager DEFAULT_COOKIE_MANAGER;
    private static final int SHOW_JS_PROGRESS = 1;
    private static final int SHOW_NATIVE_PROGRESS = 2;

    private static final String KEY_IU = "iu";
    private static final String KEY_CUST_PARAMS = "cust_params";
    private static final String KEY_OUTPUT = "output";
    private static final String KEY_VPA = "vpa";
    private static final String KEY_MSID = "msid";
    private static final String KEY_AN = "an";
    private static final String KEY_DESCRIPTION_URL = "description_url";
    private static final String KEY_URL = "url";
    private static final String KEY_FIRST_CATEGORY = "first_category=";
    private static final String KEY_RATING = "rating=";

    static {
        DEFAULT_COOKIE_MANAGER = new CookieManager();
        DEFAULT_COOKIE_MANAGER.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
    }

    private final VideoEventEmitter eventEmitter;

    private ExoDorisPlayerView exoDorisPlayerView;
    private ExoDoris player;
    private ExoDorisImaPlayer exoDorisImaPlayer;
    private ExoDorisImaWrapper exoDorisImaWrapper;
    private DefaultTrackSelector trackSelector;
    private ControlDispatcher controlDispatcher;
    private Source source;
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
    private boolean isImaStream = false;
    private boolean isImaStreamLoaded = false;
    private boolean isAmazonFireTv = false;
    private int viewWidth;
    private int viewHeight;

    // Props from React
    private RNSource src;
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
    private float mProgressUpdateInterval = 250.0f;
    private boolean useTextureView = false;
    private boolean canSeekToLiveEdge = false;
    private Map<String, String> requestHeaders;
    private int accentColor;
    // \ End props

    // IMA
    private RNImaSource imaSrc;
    private AdTagParameters adTagParameters;

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
    private final Handler progressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            if (msg.what == SHOW_JS_PROGRESS) {
                if (player != null && player.getPlaybackState() == Player.STATE_READY && player.getPlayWhenReady()) {
                    long pos = player.getCurrentPosition();
                    long bufferedDuration = player.getBufferedPercentage() * player.getDuration() / 100;
                    boolean isAboutToEnd;
                    if (player.getDuration() - pos <= 10) {
                        isAboutToEnd = true;
                    } else {
                        isAboutToEnd = false;
                    }

                    eventEmitter.progressChanged(pos, bufferedDuration, player.getDuration());
                    eventEmitter.videoAboutToEnd(isAboutToEnd);

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
            }
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
        controlDispatcher = new DefaultControlDispatcher();
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
        if (isInBackground) {
            Log.d(TAG, "onHostResume() isPaused: " + isPaused + " live: " + isLive);
            isInBackground = false; // reset to false first
            if (isLive) {
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
        if (player == null) {
            if (isImaStream) {
                exoDorisImaPlayer = new ExoDorisImaPlayer(getContext(), exoDorisPlayerView);
                exoDorisImaWrapper = new ExoDorisImaWrapper(
                        getContext(),
                        exoDorisImaPlayer,
                        exoDorisPlayerView.getAdViewGroup(),
                        ImaLanguage.SPANISH_UNITED_STATES);
                player = exoDorisImaPlayer.getExoDoris();
                trackSelector = exoDorisImaPlayer.getTrackSelector();
            } else {
                player = new ExoDorisBuilder(getContext()).build();
                trackSelector = player.getTrackSelector();
            }

            player.addListener(this);
            player.addMetadataOutput(this);
            exoDorisPlayerView.setPlayer(player);
            audioBecomingNoisyReceiver.setListener(this);
            setPlayWhenReady(!isPaused);
            playerNeedsSource = true;

            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            player.setPlaybackParameters(params);
            Log.d(TAG, "initialisePlayer() new instance: " + force);

            activateMediaSession();
        }
        if (playerNeedsSource && src.getUri() != null) {
            boolean haveResumePosition = resumeWindow != C.INDEX_UNSET;
            boolean shouldSeekOnInit = shouldSeekTo > C.TIME_UNSET;
            if (haveResumePosition && !force) {
                controlDispatcher.dispatchSeekTo(player, resumeWindow, resumePosition);
            }

            if (shouldSeekOnInit) {
                this.seekTo(shouldSeekTo);
            }

            showOverlay();

            playerInitTime = new Date().getTime();

            source = new SourceBuilder(src.getUri(), src.getId())
                    .setTitle(src.getTitle())
                    .setIsLive(isLive)
                    .setMuxData(src.getMuxData(), exoDorisPlayerView.getVideoSurfaceView())
                    .setTextTracks(src.getTextTracks())
                    .setMaxVideoSize(viewWidth, viewHeight)
                    .build();

            if (isImaStream && getWidth() != 0 && getHeight() != 0) {
                loadImaStream();
            } else if (actionToken != null) {
                try {
                    player.load(source, !haveResumePosition, force, actionToken);
                } catch (UnsupportedDrmException e) {
                    handleDrmError(e);
                }
            } else {
                player.load(source, !haveResumePosition, force);
            }

            playerNeedsSource = false;
            eventEmitter.loadStart();
            loadVideoStarted = true;
        }
    }

    private void loadImaStream() {
        isImaStreamLoaded = true;

        String iu = (String) imaSrc.getAdTagParameters().get(KEY_IU);
        String custParams = (String) imaSrc.getAdTagParameters().get(KEY_CUST_PARAMS);
        String output = (String) imaSrc.getAdTagParameters().get(KEY_OUTPUT);
        String vpa = (String) imaSrc.getAdTagParameters().get(KEY_VPA);
        String an = (String) imaSrc.getAdTagParameters().get(KEY_AN);
        String descriptionUrl = (String) imaSrc.getAdTagParameters().get(KEY_DESCRIPTION_URL);
        String url = (String) imaSrc.getAdTagParameters().get(KEY_URL);

        String msid = getContext().getPackageName();
        String isLat = "0"; // Todo: Remove this hard-coded value once we ask the user if they want to enable/disable limited ad tracking
        custParams += "&pw=" + getWidth() + "&ph=" + getHeight();

        adTagParameters = new AdTagParametersBuilder()
                .setIu(iu)
                .setCustParams(custParams)
                .setOutput(output)
                .setVpa(vpa)
                .setMsid(msid)
                .setAn(an)
                .setIsLat(isLat)
                .setDescriptionUrl(descriptionUrl)
                .setUrl(url)
                .build();

        if (true) {
            createApsBidRequest();
        }

        ImaSource imaSource = new ImaSourceBuilder(source)
                .setAssetKey(imaSrc.getAssetKey())
                .setContentSourceId(imaSrc.getContentSourceId())
                .setVideoId(imaSrc.getVideoId())
                .setAuthToken(imaSrc.getAuthToken())
                .setAdTagParameters(adTagParameters)
                .build();

        exoDorisImaPlayer.enableControls(true);
        exoDorisImaPlayer.setCanSeek(true);

        exoDorisImaWrapper.requestAndPlayAds(imaSource);
    }

    private void createApsBidRequest() {
        RNApsSource apsSource = createApsSource();
        AdBreakPattern adBreakPattern = AdBreakPattern.builder().withId(APS_APP_ID).build();
    }

    private RNApsSource createApsSource() {
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
        String rating = ratingSubString.substring(0, ratingEndPos);

        String id = src.isLive() ? src.getChannelId() : src.getSeriesId();
        String channelName = src.isLive() ? src.getChannelName() : APS_VOD_CHANNEL_NAME;
        String length = src.isLive() ? null : Integer.toString(src.getDuration());

        return new RNApsSource(id, rating, imdbGenres, channelName, length);
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
        mediaSessionConnector.setPlayer(player);
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

    private void releasePlayer() {
        Log.d(TAG, "releasePlayer()");
        deactivateMediaSession();
        releaseMediaSession();
        adTagParameters = null;
        isImaStreamLoaded = false;

        if (player != null) {
            updateResumePosition();
            player.removeListener(this);
            player.removeMetadataOutput(this);
            player.release();
            player = null;
            trackSelector = null;
            shouldSeekTo = C.TIME_UNSET;
        }

        if (exoDorisImaWrapper != null) {
            exoDorisImaWrapper.release();
            exoDorisImaWrapper = null;
            exoDorisImaPlayer = null;
        }

        progressHandler.removeMessages(SHOW_JS_PROGRESS);
        progressHandler.removeMessages(SHOW_NATIVE_PROGRESS);
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

        if (playWhenReady) {
            boolean hasAudioFocus = requestAudioFocus();
            if (hasAudioFocus) {
                player.play();
            }
        } else {
            player.pause();
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

                exoDorisPlayerView.setFocusable(true);
                exoDorisPlayerView.setFocusableInTouchMode(true);
                exoDorisPlayerView.requestFocus();

                if (isImaStream) {
                    AdInfo adInfo = exoDorisImaWrapper.getAdInfo();
                    exoDorisPlayerView.setExtraAdGroupMarkers(adInfo.getAdGroupTimesMs(),
                                                              adInfo.getPlayedAdGroups());

                    exoDorisImaWrapper.addAdEventListener(this);
                    exoDorisImaWrapper.addAdErrorListener(this);

                    Log.d(TAG, "IMA Stream ID = " + exoDorisImaWrapper.getStreamId());
                }

                // seek to edge of live window for live events
                seekToDefaultPosition();
                eventEmitter.ready();
                onBuffering(false);
                startProgressHandler();
                videoLoaded();
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
        Log.d(TAG, "seekToDefaultPosition() live: " + isLive + " canSeekToLiveEdge: " + canSeekToLiveEdge);
        if (player != null && canSeekToLiveEdge && isLive) {
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

    private void startProgressHandler() {
        progressHandler.sendEmptyMessage(SHOW_JS_PROGRESS);
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
        if (reason == Player.TIMELINE_CHANGE_REASON_PREPARED && isLive) {
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

    public void setSrc(
            Uri uri,
            String id,
            String extension,
            String title,
            String description,
            String type,
            ReadableArray textTracks,
            ActionToken actionToken,
            Map<String, String> headers,
            Map<String, Object> muxData,
            String thumbnailUrl,
            String channelLogoUrl,
            Map<String, Object> ima,
            String channelId,
            String seriesId,
            String seasonId,
            String playlistId,
            int duration,
            String channelName) {
        if (uri != null) {
            Uri srcUri = src != null ? src.getUri() : null;
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            if (ima != null && !ima.isEmpty()) {
                this.isImaStream = true;
                this.imaSrc = new RNImaSource(ima);
            } else {
                this.isImaStream = false;
            }

            this.src = new RNSource(
                    uri,
                    id,
                    extension,
                    title,
                    description,
                    type,
                    isLive,
                    getTextTracks(textTracks),
                    headers,
                    muxData,
                    thumbnailUrl,
                    channelLogoUrl,
                    null,
                    null,
                    channelId,
                    seriesId,
                    seasonId,
                    playlistId,
                    duration,
                    channelName);
            this.actionToken = actionToken;

            exoDorisPlayerView.setTitle(title);
            exoDorisPlayerView.setDescription(description);
            exoDorisPlayerView.setChannelLogo(channelLogoUrl);

            initializePlayer(!isOriginalSourceNull && !isSourceEqual);
        }
    }

    public void setProgressUpdateInterval(final float progressUpdateInterval) {
        mProgressUpdateInterval = progressUpdateInterval;
    }

    public void setRawSrc(@NonNull final Uri uri, @Nullable final String extension) {
        if (uri != null) {
            boolean isOriginalSourceNull = src.getUri() == null;
            boolean isSourceEqual = uri.equals(src.getUri());

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
            controlDispatcher.dispatchSeekTo(player, player.getCurrentWindowIndex(), positionMs);
        }
    }

    public void seekTo(String timestamp) {
        Locale currentLocale = getCurrentLocale();
        String dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'";
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(dateFormat, currentLocale);
        simpleDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

        try {
            Date seekPosition = simpleDateFormat.parse(timestamp);
            long dateTimeSeekPositionMs = seekPosition.getTime();

            Timeline timeline = player.getCurrentTimeline();

            if (!timeline.isEmpty()) {
                long windowStartTimeMs = timeline.getWindow(player.getCurrentWindowIndex(), new Timeline.Window()).windowStartTimeMs;
                if (windowStartTimeMs != C.TIME_UNSET) {
                    long seekPositionInWindowMs = dateTimeSeekPositionMs - windowStartTimeMs;
                    long duration = player.getDuration();

                    if (seekPositionInWindowMs > 0 && seekPositionInWindowMs <= duration) {
                        seekTo(seekPositionInWindowMs);
                    } else {
                        Log.e(TAG, "The provided timestamp, " + timestamp + ", is either " +
                                "before the start of the stream or the difference between the " +
                                "current time and the provided timestamp is greater than the " +
                                "duration of the content.");
                    }
                } else {
                    Log.e(TAG, "HLS playlist doesn't have an EXT-X-PROGRAM-DATE-TIME tag.");
                }
            }
        } catch (ParseException e) {
            Log.e(TAG, "Unable to parse provided timestamp, " + timestamp +
                    ". Timestamp should be of the format \"2020-01-01T00:00:00.000000Z\".");
        }
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

    public void setControls(final boolean visible) {
        areControlsVisible = visible;
        if (visible) {
            if (!exoDorisPlayerView.getUseController()) {
                exoDorisPlayerView.setUseController(true);
            }
            exoDorisPlayerView.showController();
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

    public void setButtons(boolean showFavouriteButton, boolean showWatchlistButton) {
        if (exoDorisPlayerView != null) {
            exoDorisPlayerView.setShowFavoriteButton(showFavouriteButton);
            exoDorisPlayerView.setShowWatchListButton(showWatchlistButton);
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

            if (isImaStream && !isImaStreamLoaded) {
                loadImaStream();
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

        return exoDorisPlayerView.dispatchKeyEvent(event) || super.dispatchKeyEvent(event);
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
                    .setAudioAndSubtitlesLabel(translations.getAudioAndSubtitlesLabel())
                    .setLiveLabel(translations.getLiveLabel())
                    .setFavoriteLabel(translations.getFavoriteLabel())
                    .setMoreVideosLabel(translations.getMoreVideosLabel())
                    .setWatchListLabel(translations.getWatchListLabel())
                    .build();

            exoDorisPlayerView.setLabels(labels);
        }
    }

    @Override
    public void onAdEvent(AdEvent adEvent) {
        if (adEvent.getType() == AD_BREAK_STARTED) {
            setControls(false);
            return;
        }

        if (adEvent.getType() == AD_BREAK_ENDED) {
            setControls(true);
        }
    }

    @Override
    public void onAdError(AdErrorEvent adErrorEvent) {
        AdError error = adErrorEvent.getError();
        eventEmitter.error(error.getMessage(), error);

        // Reset imaSrc and isImaStream to allow a new source to be loaded
        imaSrc = null;
        this.isImaStream = false;
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
    public void onWatchListButtonClicked() {
        // Todo: Once the watchlist button has been implemented, fire an event here when user clicks it
    }
}
