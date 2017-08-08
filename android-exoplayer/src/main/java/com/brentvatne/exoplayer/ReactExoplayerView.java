package com.brentvatne.exoplayer;

import android.annotation.SuppressLint;
import android.content.Context;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Message;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Button;
import android.widget.CheckedTextView;
import android.widget.FrameLayout;

import com.brentvatne.react.R;
import com.brentvatne.receiver.AudioBecomingNoisyReceiver;
import com.brentvatne.receiver.BecomingNoisyListener;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.RendererCapabilities;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer;
import com.google.android.exoplayer2.mediacodec.MediaCodecUtil;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.MetadataRenderer;
import com.google.android.exoplayer2.source.BehindLiveWindowException;
import com.google.android.exoplayer2.source.ExtractorMediaSource;
import com.google.android.exoplayer2.source.LoopingMediaSource;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.TrackGroup;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.source.dash.DashMediaSource;
import com.google.android.exoplayer2.source.dash.DefaultDashChunkSource;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.DefaultSsChunkSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.FixedTrackSelection;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.util.Util;

import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.lang.Math;
import java.util.Arrays;

@SuppressLint("ViewConstructor")
class ReactExoplayerView extends FrameLayout implements
        LifecycleEventListener,
        ExoPlayer.EventListener,
        BecomingNoisyListener,
        AudioManager.OnAudioFocusChangeListener,
        MetadataRenderer.Output {

    private static final String TAG = "ReactExoplayerView";

    private static final DefaultBandwidthMeter BANDWIDTH_METER = new DefaultBandwidthMeter();
    private static final CookieManager DEFAULT_COOKIE_MANAGER;
    private static final int SHOW_PROGRESS = 1;

    static {
        DEFAULT_COOKIE_MANAGER = new CookieManager();
        DEFAULT_COOKIE_MANAGER.setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER);
    }

    private final VideoEventEmitter eventEmitter;

    private Handler mainHandler;
    private ExoPlayerView exoPlayerView;

    private DataSource.Factory mediaDataSourceFactory;
    private SimpleExoPlayer player;
    private MappingTrackSelector trackSelector;
    TrackSelectionArray trackSelections;
    private boolean playerNeedsSource;
    private TrackSelection.Factory videoTrackSelectionFactory;
    private static final TrackSelection.Factory FIXED_FACTORY = new FixedTrackSelection.Factory();

    private MappingTrackSelector.SelectionOverride override;

    private TrackGroupArray lastSeenTrackGroupArray;

    private int resumeWindow;
    private long resumePosition;
    private boolean loadVideoStarted;
    private boolean isPaused = false;
    private boolean isBuffering;
    private float rate = 1f;

    // Props from React
    private Uri srcUri;
    private String extension;
    private boolean repeat;
    private boolean disableFocus;
    private float mProgressUpdateInterval = 250.0f;
    private boolean playInBackground = false;
    // \ End props

    // React
    private final ThemedReactContext themedReactContext;
    private final AudioManager audioManager;
    private final AudioBecomingNoisyReceiver audioBecomingNoisyReceiver;

    private final Handler progressHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case SHOW_PROGRESS:
                    if (player != null
                            && player.getPlaybackState() == ExoPlayer.STATE_READY
                            && player.getPlayWhenReady()
                            ) {
                        long pos = player.getCurrentPosition();
                        eventEmitter.progressChanged(pos, player.getDuration(),player.getBufferedPercentage()) ;
                        msg = obtainMessage(SHOW_PROGRESS);
                        sendMessageDelayed(msg, Math.round(mProgressUpdateInterval));
                    }
                    break;
            }
        }
    };

    public ReactExoplayerView(ThemedReactContext context) {
        super(context);
        createViews();
        this.eventEmitter = new VideoEventEmitter(context,this);
        this.themedReactContext = context;
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
        mainHandler = new Handler();
        if (CookieHandler.getDefault() != DEFAULT_COOKIE_MANAGER) {
            CookieHandler.setDefault(DEFAULT_COOKIE_MANAGER);
        }

        LayoutParams layoutParams = new LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT);
        exoPlayerView = new ExoPlayerView(getContext());
        exoPlayerView.setLayoutParams(layoutParams);

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

    // LifecycleEventListener implementation

    @Override
    public void onHostResume() {
        if (playInBackground) {
            return;
        }
        setPlayWhenReady(!isPaused);
    }

    @Override
    public void onHostPause() {
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
        if (player == null) {
            this.videoTrackSelectionFactory = new AdaptiveTrackSelection.Factory(BANDWIDTH_METER);
            trackSelector = new DefaultTrackSelector(videoTrackSelectionFactory);
            player = ExoPlayerFactory.newSimpleInstance(getContext(), trackSelector);
            player.addListener(this);
            player.setMetadataOutput(this);
            exoPlayerView.setPlayer(player);
            audioBecomingNoisyReceiver.setListener(this);
            setPlayWhenReady(!isPaused);
            playerNeedsSource = true;

            lastSeenTrackGroupArray = null;

            PlaybackParameters params = new PlaybackParameters(rate, 1f);
            player.setPlaybackParameters(params);
        }
        if (playerNeedsSource && srcUri != null) {
            MediaSource mediaSource = buildMediaSource(srcUri, extension);
            mediaSource = repeat ? new LoopingMediaSource(mediaSource) : mediaSource;
            boolean haveResumePosition = resumeWindow != C.INDEX_UNSET;
            if (haveResumePosition) {
                player.seekTo(resumeWindow, resumePosition);
            }
            player.prepare(mediaSource, !haveResumePosition, false);
            playerNeedsSource = false;

            eventEmitter.loadStart();
            loadVideoStarted = true;
        }
    }

    private MediaSource buildMediaSource(Uri uri, String overrideExtension) {
        int type = Util.inferContentType(!TextUtils.isEmpty(overrideExtension) ? "." + overrideExtension
                : uri.getLastPathSegment());
        switch (type) {
            case C.TYPE_SS:
                return new SsMediaSource(uri, buildDataSourceFactory(false),
                        new DefaultSsChunkSource.Factory(mediaDataSourceFactory), mainHandler, null);
            case C.TYPE_DASH:
                return new DashMediaSource(uri, buildDataSourceFactory(false),
                        new DefaultDashChunkSource.Factory(mediaDataSourceFactory), mainHandler, null);
            case C.TYPE_HLS:
                return new HlsMediaSource(uri, mediaDataSourceFactory, mainHandler, null);
            case C.TYPE_OTHER:
                return new ExtractorMediaSource(uri, mediaDataSourceFactory, new DefaultExtractorsFactory(),
                        mainHandler, null);
            default: {
                throw new IllegalStateException("Unsupported type: " + type);
            }
        }
    }

    private void releasePlayer() {
        if (player != null) {
            isPaused = player.getPlayWhenReady();
            updateResumePosition();
            player.release();
            player.setMetadataOutput(null);
            player = null;
            trackSelector = null;
        }
        progressHandler.removeMessages(SHOW_PROGRESS);
        themedReactContext.removeLifecycleEventListener(this);
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

    /**
     * Returns a new DataSource factory.
     *
     * @param useBandwidthMeter Whether to set {@link #BANDWIDTH_METER} as a listener to the new
     *                          DataSource factory.
     * @return A new DataSource factory.
     */
    private DataSource.Factory buildDataSourceFactory(boolean useBandwidthMeter) {
        return DataSourceUtil.getDefaultDataSourceFactory(getContext(), useBandwidthMeter ? BANDWIDTH_METER : null);
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
        // Do nothing.
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
                videoLoaded();
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

    private void startProgressHandler() {
        progressHandler.sendEmptyMessage(SHOW_PROGRESS);
    }

    private void videoLoaded() {
        if (loadVideoStarted) {
            loadVideoStarted = false;
            Format videoFormat = player.getVideoFormat();
            int width = videoFormat != null ? videoFormat.width : 0;
            int height = videoFormat != null ? videoFormat.height : 0;

            eventEmitter.load(player.getDuration(), player.getCurrentPosition(), width, height);
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
    public void onPositionDiscontinuity() {
        if (playerNeedsSource) {
            // This will only occur if the user has performed a seek whilst in the error state. Update the
            // resume position so that if the user then retries, playback will resume from the position to
            // which they seeked.
            updateResumePosition();
        }
    }

    @Override
    public void onTimelineChanged(Timeline timeline, Object manifest) {
        // Do nothing.
    }

    @Override
    public void onTracksChanged(TrackGroupArray trackGroups, TrackSelectionArray trackSelections) {
        this.trackSelections = trackSelections;

        if (trackGroups != lastSeenTrackGroupArray) {
            MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();
            if (mappedTrackInfo != null) {
                if (mappedTrackInfo.getTrackTypeRendererSupport(C.TRACK_TYPE_VIDEO)
                        == MappingTrackSelector.MappedTrackInfo.RENDERER_SUPPORT_UNSUPPORTED_TRACKS) {
                }
                if (mappedTrackInfo.getTrackTypeRendererSupport(C.TRACK_TYPE_AUDIO)
                        == MappingTrackSelector.MappedTrackInfo.RENDERER_SUPPORT_UNSUPPORTED_TRACKS) {
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
    public void onPlayerError(ExoPlaybackException e) {
        e.printStackTrace();
        String errorString = null;
        if (e.type == ExoPlaybackException.TYPE_RENDERER) {
            Exception cause = e.getRendererException();
            if (cause instanceof MediaCodecRenderer.DecoderInitializationException) {
                // Special case for decoder initialization failures.
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
        }
//        if (errorString != null) {
            eventEmitter.error(errorString, e);
//        }
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

    @Override
    public void onMetadata(Metadata metadata) {
        eventEmitter.timedMetadata(metadata);
    }

    @Override
    public void onRepeatModeChanged(@Player.RepeatMode int repeatMode) {

    }
    // ReactExoplayerViewManager public api

    public void setSrc(final Uri uri, final String extension) {
        if (uri != null) {
            boolean isOriginalSourceNull = srcUri == null;
            boolean isSourceEqual = uri.equals(srcUri);

            this.srcUri = uri;
            this.extension = extension;
            this.mediaDataSourceFactory = DataSourceUtil.getDefaultDataSourceFactory(getContext(), BANDWIDTH_METER);
//            if (!isOriginalSourceNull && !isSourceEqual) {
            if (!isSourceEqual) {
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
            this.mediaDataSourceFactory = DataSourceUtil.getRawDataSourceFactory(getContext());

            if (!isOriginalSourceNull && !isSourceEqual) {
                reloadSource();
            }
        }
    }

    private void reloadSource() {
        playerNeedsSource = true;
        initializePlayer();
    }

    public void setSelectedTrack(int trackType,int trackIndex){
        MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();

        int trackGroupsIndex=0;
        for (int i = 0; i < mappedTrackInfo.length; i++) {
            TrackGroupArray trackGroups = mappedTrackInfo.getTrackGroups(i);
            if (trackGroups.length != 0) {
                if (player.getRendererType(i) == trackType){
                    trackGroupsIndex = i;
                    break;

                }
            }
        }

        TrackGroupArray trackGroups = mappedTrackInfo.getTrackGroups(trackGroupsIndex);

        if (trackIndex > 0) {

            int groupIndex = 0;

//            boolean[] trackGroupsAdaptive = new boolean[trackGroups.length];
//            for (int i = 0; i < trackGroups.length; i++) {
//                trackGroupsAdaptive[i] = this.videoTrackSelectionFactory != null
//                        && mappedTrackInfo.getAdaptiveSupport(trackGroupsIndex, i, false)
//                        != RendererCapabilities.ADAPTIVE_NOT_SUPPORTED
//                        && trackGroups.get(i).length > 1;
//            }

            override = new MappingTrackSelector.SelectionOverride(FIXED_FACTORY, groupIndex, trackIndex-1);

            this.trackSelector.setSelectionOverride(trackGroupsIndex, trackGroups, override);
        } else {
            override = null;
            this.trackSelector.clearSelectionOverrides(trackGroupsIndex);
        }

    }

    private void setOverride(int group, int[] tracks) {
        TrackSelection.Factory factory = tracks.length == 1 ? FIXED_FACTORY
                :  this.videoTrackSelectionFactory;
        override = new MappingTrackSelector.SelectionOverride(factory, group, tracks);
    }

    public void setResizeModeModifier(@ResizeMode.Mode int resizeMode) {
        exoPlayerView.setResizeMode(resizeMode);
    }

    public void setRepeatModifier(boolean repeat) {
        this.repeat = repeat;
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

    public int getSelectedTrack(final int trackType){
        MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();

        int trackIndex=0;
        for (int i = 0; i < mappedTrackInfo.length; i++) {
            TrackGroupArray trackGroups = mappedTrackInfo.getTrackGroups(i);
            if (trackGroups.length != 0) {
                if (player.getRendererType(i) == trackType){
                    trackIndex = i;
                    break;

                }
            }
        }
        if(player.getCurrentTrackSelections().get(trackIndex) == null){
            return 0;
        }


        int selectedIndexInTrackGroup =player.getCurrentTrackSelections().get(trackIndex).getSelectedIndexInTrackGroup();
        // custom for auto mode
        if (override!=null){
            if (getTrackNameArray(trackType).length>1){
                selectedIndexInTrackGroup = selectedIndexInTrackGroup + 1;
            }else{
                selectedIndexInTrackGroup = 0;
            }

        }else{
            selectedIndexInTrackGroup = 0;
        }


        return selectedIndexInTrackGroup;
    }

    public String[] getTrackNameArray(final int trackType){

        MappingTrackSelector.MappedTrackInfo mappedTrackInfo = trackSelector.getCurrentMappedTrackInfo();

        int trackIndex=0;
        for (int i = 0; i < mappedTrackInfo.length; i++) {
            TrackGroupArray trackGroups = mappedTrackInfo.getTrackGroups(i);
            if (trackGroups.length != 0) {
                if (player.getRendererType(i) == trackType){
                    trackIndex = i;
                    break;

                }
            }
        }
        TrackGroupArray trackGroups = mappedTrackInfo.getTrackGroups(trackIndex);
        String[] trackNameArray = null;
        for (int groupIndex = 0; groupIndex < trackGroups.length; groupIndex++) {
            TrackGroup group = trackGroups.get(groupIndex);
            trackNameArray = new String[group.length];
            for (int i = 0; i < group.length; i++) {
                trackNameArray[i] = DemoUtil.buildTrackName(group.getFormat(i));
            }
        }


        return trackNameArray;
    }
}
