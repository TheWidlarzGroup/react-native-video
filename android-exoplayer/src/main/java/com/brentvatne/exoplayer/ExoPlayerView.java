package com.brentvatne.exoplayer;

import android.annotation.TargetApi;
import android.content.Context;
import androidx.core.content.ContextCompat;
import android.util.AttributeSet;
import android.util.Log;
import android.view.Gravity;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.brentvatne.react.GLTextureView;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.Tracks;
import com.google.android.exoplayer2.source.hls.HlsManifest;
import com.google.android.exoplayer2.source.hls.playlist.HlsMediaPlaylist;
import com.google.android.exoplayer2.text.CueGroup;
import com.google.android.exoplayer2.text.TextOutput;
import com.google.android.exoplayer2.ui.SubtitleView;
import com.google.android.exoplayer2.video.VideoSize;

import java.util.List;

@TargetApi(16)
public final class ExoPlayerView extends FrameLayout {

    private View surfaceView;
    private final View shutterView;
    private final SubtitleView subtitleLayout;
    private final AspectRatioFrameLayout layout;
    private final ComponentListener componentListener;
    private SimpleExoPlayer player;
    private Context context;
    private ViewGroup.LayoutParams layoutParams;
    private FileChangeListener fileChangeListener;
    private boolean useTextureView = false;
    private boolean useGreenScreen = false;

    public ExoPlayerView(Context context) {
        this(context, null);
    }

    public void setFileChangeListener(FileChangeListener listener) {
        fileChangeListener = listener;
    }

    public ExoPlayerView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public ExoPlayerView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);

        this.context = context;

        layoutParams = new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT);

        componentListener = new ComponentListener();

        FrameLayout.LayoutParams aspectRatioParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT);
        aspectRatioParams.gravity = Gravity.CENTER;
        layout = new AspectRatioFrameLayout(context);
        layout.setLayoutParams(aspectRatioParams);

        shutterView = new View(getContext());
        shutterView.setLayoutParams(layoutParams);
        shutterView.setBackgroundColor(ContextCompat.getColor(context, android.R.color.black));

        subtitleLayout = new SubtitleView(context);
        subtitleLayout.setLayoutParams(layoutParams);
        subtitleLayout.setUserDefaultStyle();
        subtitleLayout.setUserDefaultTextSize();

        updateSurfaceView();

        layout.addView(shutterView, 1, layoutParams);
        layout.addView(subtitleLayout, 2, layoutParams);

        addViewInLayout(layout, 0, aspectRatioParams);
    }

    private void setVideoView() {
        if (surfaceView instanceof TextureView) {
            player.setVideoTextureView((TextureView) surfaceView);
        } else if (surfaceView instanceof SurfaceView) {
            player.setVideoSurfaceView((SurfaceView) surfaceView);
        }
    }

    private void updateSurfaceView() {
        View view;
        if (useGreenScreen) {
            view = new GLTextureView(context);
        } else {
            view = useTextureView ? new TextureView(context) : new SurfaceView(context);
        }
        view.setLayoutParams(layoutParams);

        surfaceView = view;
        if (layout.getChildAt(0) != null) {
            layout.removeViewAt(0);
        }
        layout.addView(surfaceView, 0, layoutParams);
        if (view instanceof GLTextureView) {
            GLTextureView glTextureView = (GLTextureView) view;
            glTextureView.setOpaque(false);
            glTextureView.setOnSurfaceCreatedCallBack(new OnSurfaceCreatedCallBack() {
                @Override
                public void onSurfaceCreated() {
                    if (ExoPlayerView.this.player != null) {
                        setVideoView();
                        player.addListener(componentListener);
                        player.addTextOutput(componentListener);
                    }
                }
            });
        } else {
            if (this.player != null) {
                setVideoView();
            }
        }
    }

    public interface OnSurfaceCreatedCallBack {
        void onSurfaceCreated();
    }

    public void setPlayer(SimpleExoPlayer player) {
        if (this.player == player) {
            return;
        }
        if (this.player != null) {
            this.player.removeTextOutput(componentListener);
            this.player.removeListener(componentListener);
            this.player.clearVideoSurface();
        }
        this.player = player;
        shutterView.setVisibility(VISIBLE);
        if (player != null && !useGreenScreen) {
            setVideoView();
            player.addListener(componentListener);
            player.addTextOutput(componentListener);
        }
    }

    public void setResizeMode(@ResizeMode.Mode int resizeMode) {
        if (layout.getResizeMode() != resizeMode) {
            layout.setResizeMode(resizeMode);
            post(measureAndLayout);
        }

    }

    public View getVideoSurfaceView() {
        return surfaceView;
    }

    public void setUseTextureView(boolean useTextureView) {
        this.useTextureView = useTextureView;
        updateSurfaceView();
    }

    public void setUseGreenScreen(boolean useGreenScreen) {
        this.useGreenScreen = useGreenScreen;
        if (useGreenScreen) {
            updateSurfaceView();
        }
    }

    private final Runnable measureAndLayout = new Runnable() {
        @Override
        public void run() {
            measure(
                    MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
            layout(getLeft(), getTop(), getRight(), getBottom());
        }
    };

    private void updateForCurrentTrackSelections() {
        if (player == null) {
            return;
        }
        if (player.getCurrentTracks().isTypeSelected(C.TRACK_TYPE_VIDEO)) {
            return;
        }
        shutterView.setVisibility(VISIBLE);
    }

    public void sendFileChangeEventForTime(long timeMs) {
        if (player == null) {
            return;
        }
        Object manifest = player.getCurrentManifest();
        if (!(manifest instanceof HlsManifest)) {
            return;
        }
        HlsManifest hlsManifest = (HlsManifest) manifest;
        List<HlsMediaPlaylist.Segment> segments = hlsManifest.mediaPlaylist.segments;
        if (segments == null || segments.isEmpty()) {
            return;
        }
        long timeUs = timeMs * 1000L;
        int index = -1;
        for (int i = 0; i < segments.size(); i++) {
            HlsMediaPlaylist.Segment seg = segments.get(i);
            long startUs = seg.relativeStartTimeUs;
            long endUs = (i + 1 < segments.size())
                    ? segments.get(i + 1).relativeStartTimeUs
                    : hlsManifest.mediaPlaylist.durationUs;
            if (timeUs >= startUs && (endUs == C.TIME_UNSET || timeUs < endUs)) {
                index = i;
                break;
            }
        }
        if (index < 0) {
            return;
        }
        try {
            String[] urlSplit = segments.get(index).url.split("-");
            long val = Long.parseLong(urlSplit[urlSplit.length - 1].replace(".ts", ""));
            if (fileChangeListener != null) {
                try {
                    fileChangeListener.onFileChange(val + "", segments.get(index).relativeStartTimeUs, hlsManifest.mediaPlaylist.durationUs);
                } catch (Exception ignore) {
                }
            }
        } catch (Exception e) {
            Log.w("ExoPlayerView", "sendFileChangeEventForTime", e);
        }
    }

    public void sendFileChangeEventForTime() {
        sendFileChangeEventForTime(player != null ? player.getCurrentPosition() : 0L);
    }

    public interface FileChangeListener {
        void onFileChange(String file, long time, long duration);
    }

    private final class ComponentListener implements TextOutput, Player.Listener {

        @Override
        public void onCues(CueGroup cueGroup) {
            subtitleLayout.setCues(cueGroup.cues);
        }

        @Override
        public void onVideoSizeChanged(VideoSize videoSize) {
            boolean isInitialRatio = layout.getAspectRatio() == 0;
            float pixelWidthHeightRatio = videoSize.pixelWidthHeightRatio;
            layout.setAspectRatio(videoSize.height == 0 ? 1 : (videoSize.width * pixelWidthHeightRatio) / videoSize.height);

            if (isInitialRatio) {
                post(measureAndLayout);
            }
        }

        @Override
        public void onRenderedFirstFrame() {
            shutterView.setVisibility(INVISIBLE);
        }

        @Override
        public void onIsLoadingChanged(boolean isLoading) {
            sendFileChangeEventForTime();
        }

        @Override
        public void onPlaybackStateChanged(int playbackState) {
            sendFileChangeEventForTime();
        }

        @Override
        public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
            sendFileChangeEventForTime();
        }

        @Override
        public void onPlayerError(PlaybackException error) {
            // Do nothing.
        }

        @Override
        public void onPositionDiscontinuity(Player.PositionInfo oldPosition, Player.PositionInfo newPosition, int reason) {
            sendFileChangeEventForTime();
        }

        @Override
        public void onTimelineChanged(Timeline timeline, int reason) {
            if (player != null && player.getCurrentManifest() instanceof HlsManifest
                    && reason == Player.TIMELINE_CHANGE_REASON_SOURCE_UPDATE) {
                sendFileChangeEventForTime();
            }
        }

        @Override
        public void onTracksChanged(Tracks tracks) {
            updateForCurrentTrackSelections();
        }

        @Override
        public void onPlaybackParametersChanged(PlaybackParameters params) {
            sendFileChangeEventForTime();
        }

        @Override
        public void onSeekProcessed() {
            sendFileChangeEventForTime();
        }

        @Override
        public void onShuffleModeEnabledChanged(boolean shuffleModeEnabled) {
            // Do nothing.
        }

        @Override
        public void onRepeatModeChanged(int repeatMode) {
            // Do nothing.
        }
    }

}
