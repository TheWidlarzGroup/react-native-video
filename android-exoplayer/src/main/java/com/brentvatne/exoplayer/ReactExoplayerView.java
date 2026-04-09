package com.brentvatne.exoplayer;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.accessibility.CaptioningManager;
import android.widget.FrameLayout;

import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
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
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.Tracks;
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
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
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultAllocator;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.util.Util;

import java.lang.Math;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;

@SuppressLint("ViewConstructor")
class ReactExoplayerView extends FrameLayout implements
        LifecycleEventListener,
        Player.Listener,
        BecomingNoisyListener,
        AudioManager.OnAudioFocusChangeListener {

    private static final String TAG = "ReactExoplayerView";

    private static final CookieManager DEFAULT_COOKIE_MANAGER;
    private static final int SHOW_PROGRESS = 1;

    static {
        DEFAULT_COOKIE_MANAGER = new CookieManager();
        DEFAULT_COOKIE_MANAGER.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
    }

    private final VideoEventEmitter eventEmitter;
    private final DefaultBandwidthMeter bandwidthMeter;

    private Handler mainHandler;
    private ExoPlayerView exoPlayerView;

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

    private Uri srcUri;
    private String extension;
    private boolean repeat;
    private String audioTrackType;
    private Dynamic audioTrackValue;
    private ReadableArray audioTracks;
    private int maxBitRate = 0;
    private String textTrackType;
    private Dynamic textTrackValue;
    private ReadableArray textTracks;
    private boolean disableFocus;
    private float mProgressUpdateInterval = 250.0f;
    private boolean playInBackground = false;
    private boolean useTextureView = false;
    private Map<String, String> requestHeaders;

    private final ThemedReactContext themedReactContext;
    private final AudioManager audioManager;
    private final AudioBecomingNoisyReceiver audioBecomingNoisyReceiver;
    private boolean useGreenScreen;

    @SuppressLint("HandlerLeak")
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
                        long duration = player.getDuration();
                        long bufferedDuration = duration > 0
                                ? player.getBufferedPercentage() * duration / 100
                                : 0;
                        eventEmitter.progressChanged(pos, bufferedDuration, duration);
                        msg = obtainMessage(SHOW_PROGRESS);
                        sendMessageDelayed(msg, Math.round(mProgressUpdateInterval));
                    }
                    break;
            }
        }
    };

    public ReactExoplayerView(ThemedReactContext context) {
        super(context);
        this.themedReactContext = context;
        this.bandwidthMeter = new DefaultBandwidthMeter.Builder(context.getApplicationContext()).build();
        createViews();
        this.eventEmitter = new VideoEventEmitter(context);
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        themedReactContext.addLifecycleEventListener(this);
        audioBecomingNoisyReceiver = new AudioBecomingNoisyReceiver(themedReactContext);

        initializePlayer();
    }


    @Override
    public void setId(int id) {
        super.setId(id);
        eventEmitter.setViewId(id);
    }

    private void createViews() {
        clearResumePosition();
        mediaDataSourceFactory = buildDataSourceFactory(true);
        mainHandler = new Handler(Looper.getMainLooper());
        if (CookieHandler.getDefault() != DEFAULT_COOKIE_MANAGER) {
            CookieHandler.setDefault(DEFAULT_COOKIE_MANAGER);
        }

        LayoutParams layoutParams = new LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT);
        exoPlayerView = new ExoPlayerView(getContext());
        exoPlayerView.setLayoutParams(layoutParams);
        exoPlayerView.setFileChangeListener(new ExoPlayerView.FileChangeListener() {
            @Override
            public void onFileChange(String file, long time, long duration) {
                eventEmitter.manifestFileChange(file, time, duration);
            }
        });

        addView(exoPlayerView, 0, layoutParams);
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

    private void initializePlayer() {
        if (player == null) {
            trackSelector = new DefaultTrackSelector(getContext(), new AdaptiveTrackSelection.Factory());
            trackSelector.setParameters(trackSelector.buildUponParameters()
                    .setMaxVideoBitrate(maxBitRate == 0 ? Integer.MAX_VALUE : maxBitRate));

            DefaultAllocator allocator = new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
            DefaultLoadControl defaultLoadControl = new DefaultLoadControl.Builder()
                    .setAllocator(allocator)
                    .setBufferDurationsMs(minBufferMs, maxBufferMs, bufferForPlaybackMs, bufferForPlaybackAfterRebufferMs)
                    .setPrioritizeTimeOverSizeThresholds(true)
                    .build();
            player = new SimpleExoPlayer.Builder(getContext())
                    .setTrackSelector(trackSelector)
                    .setLoadControl(defaultLoadControl)
                    .build();
            player.addListener(this);
            exoPlayerView.setPlayer(player);
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
            player.setMediaSource(mediaSource, !haveResumePosition);
            if (haveResumePosition) {
                player.seekTo(resumeWindow, resumePosition);
            }
            player.prepare();
            playerNeedsSource = false;

            eventEmitter.loadStart();
            loadVideoStarted = true;
        }
    }

    private MediaSource buildMediaSource(Uri uri, String overrideExtension) {
        @C.ContentType int type;
        if (!TextUtils.isEmpty(overrideExtension)) {
            String ext = overrideExtension.startsWith(".")
                    ? overrideExtension.substring(1)
                    : overrideExtension;
            type = Util.inferContentTypeForExtension(ext);
        } else {
            type = Util.inferContentTypeForUri(uri);
        }
        MediaItem mediaItem = MediaItem.fromUri(uri);
        switch (type) {
            case C.TYPE_SS:
                return new SsMediaSource.Factory(
                        new com.google.android.exoplayer2.upstream.DefaultDataSource.Factory(
                                themedReactContext, buildDataSourceFactory(false)))
                        .createMediaSource(mediaItem);
            case C.TYPE_DASH:
                return new DashMediaSource.Factory(mediaDataSourceFactory)
                        .createMediaSource(mediaItem);
            case C.TYPE_HLS:
                return new HlsMediaSource.Factory(mediaDataSourceFactory)
                        .createMediaSource(mediaItem);
            case C.TYPE_OTHER:
                return new ProgressiveMediaSource.Factory(mediaDataSourceFactory)
                        .setExtractorsFactory(new DefaultExtractorsFactory())
                        .createMediaSource(mediaItem);
            default: {
                throw new IllegalStateException("Unsupported type: " + type);
            }
        }
    }

    public void setMaxBitRateModifier(int newMaxBitRate) {
        maxBitRate = newMaxBitRate;
        if (player != null) {
            trackSelector.setParameters(trackSelector.buildUponParameters()
                    .setMaxVideoBitrate(maxBitRate == 0 ? Integer.MAX_VALUE : maxBitRate));
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
        MediaItem.SubtitleConfiguration subtitle = new MediaItem.SubtitleConfiguration.Builder(uri)
                .setMimeType(mimeType)
                .setLanguage(language)
                .setLabel(title)
                .build();
        return new SingleSampleMediaSource.Factory(mediaDataSourceFactory)
                .createMediaSource(subtitle, C.TIME_UNSET);
    }

    private void releasePlayer() {
        if (player != null) {
            updateResumePosition();
            player.removeListener(this);
            player.release();
            player = null;
            trackSelector = null;
        }
        progressHandler.removeMessages(SHOW_PROGRESS);
        audioBecomingNoisyReceiver.removeListener();
    }

    private boolean requestAudioFocus() {
        if (disableFocus) {
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
        resumePosition = player.isCurrentWindowSeekable() ? Math.max(0, player.getCurrentPosition())
                : C.TIME_UNSET;
    }

    private void clearResumePosition() {
        resumeWindow = C.INDEX_UNSET;
        resumePosition = C.TIME_UNSET;
    }

    private DataSource.Factory buildDataSourceFactory(boolean useBandwidthMeter) {
        return DataSourceUtil.getDefaultDataSourceFactory(this.themedReactContext,
                useBandwidthMeter ? bandwidthMeter : null, requestHeaders);
    }

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
                player.setVolume(0.8f);
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                player.setVolume(1);
            }
        }
    }

    @Override
    public void onAudioBecomingNoisy() {
        eventEmitter.audioBecomingNoisy();
    }

    @Override
    public void onIsLoadingChanged(boolean isLoading) {
        // No-op (legacy onLoadingChanged was empty).
    }

    @Override
    public void onPlaybackStateChanged(int playbackState) {
        String text = "onStateChanged: playWhenReady="
                + (player != null && player.getPlayWhenReady()) + ", playbackState=";
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
                eventEmitter.ready();
                onBuffering(false);
                startProgressHandler();
                videoLoaded();
                break;
            case Player.STATE_ENDED:
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

    private void startProgressHandler() {
        progressHandler.sendEmptyMessage(SHOW_PROGRESS);
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
    public void onPositionDiscontinuity(Player.PositionInfo oldPosition, Player.PositionInfo newPosition, int reason) {
        if (playerNeedsSource) {
            updateResumePosition();
        }
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
    public void onTracksChanged(Tracks tracks) {
        // Do Nothing.
    }

    @Override
    public void onPlaybackParametersChanged(PlaybackParameters params) {
        eventEmitter.playbackRateChange(params.speed);
    }

    @Override
    public void onPlayerError(PlaybackException error) {
        if (!(error instanceof ExoPlaybackException)) {
            eventEmitter.error(getResources().getString(R.string.unrecognized_media_format), error);
            playerNeedsSource = true;
            return;
        }
        ExoPlaybackException e = (ExoPlaybackException) error;
        String errorString = null;
        Exception ex = e;
        if (e.type == ExoPlaybackException.TYPE_RENDERER) {
            Exception cause = e.getRendererException();
            if (cause instanceof MediaCodecRenderer.DecoderInitializationException) {
                MediaCodecRenderer.DecoderInitializationException decoderInitializationException =
                        (MediaCodecRenderer.DecoderInitializationException) cause;
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
            }
        } else if (e.type == ExoPlaybackException.TYPE_SOURCE) {
            Throwable sourceEx = e.getSourceException();
            ex = sourceEx instanceof Exception ? (Exception) sourceEx : new Exception(sourceEx);
            errorString = getResources().getString(R.string.unrecognized_media_format);
        }
        if (errorString != null) {
            eventEmitter.error(errorString, ex);
        }
        playerNeedsSource = true;
        if (isBehindLiveWindow(e)) {
            clearResumePosition();
            initializePlayer();
        } else {
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

    public void setSrc(final Uri uri, final String extension, Map<String, String> headers) {
        if (uri != null) {
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.requestHeaders = headers;
            this.mediaDataSourceFactory = DataSourceUtil.getDefaultDataSourceFactory(
                    this.themedReactContext, bandwidthMeter, this.requestHeaders);

            if (!isOriginalSourceNull && !isSourceEqual) {
                reloadSource();
            }
        }
    }

    public void setProgressUpdateInterval(final float progressUpdateInterval) {
        mProgressUpdateInterval = progressUpdateInterval;
    }

    public void setRawSrc(final Uri uri, final String extension) {
        if (uri != null) {
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.mediaDataSourceFactory = DataSourceUtil.getRawDataSourceFactory(this.themedReactContext);

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
        } else {
            if (rendererIndex == C.TRACK_TYPE_TEXT && Util.SDK_INT > 18 && groups.length > 0) {
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
        if (groups.length == 0) {
            return C.INDEX_UNSET;
        }

        int trackIndex = 0;
        String locale2 = Locale.getDefault().getLanguage();
        String locale3 = Locale.getDefault().getISO3Language();
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
        rate = newRate;

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
            return;
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
            if (Util.SDK_INT >= 19) {
                uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN;
            } else {
                uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN;
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

    public void setUseGreenScreen(boolean useGreenScreen) {
        this.useGreenScreen = useGreenScreen;
        if (exoPlayerView != null) {
            exoPlayerView.setUseGreenScreen(useGreenScreen);
            setBackgroundColor(Color.TRANSPARENT);
            exoPlayerView.setBackgroundColor(Color.TRANSPARENT);

        }
    }
}
