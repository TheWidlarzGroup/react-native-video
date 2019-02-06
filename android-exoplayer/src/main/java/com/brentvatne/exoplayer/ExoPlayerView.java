xspackage com.brentvatne.exoplayer;

import android.annotation.TargetApi;
import android.content.Context;
<<<<<<< HEAD

=======
import android.graphics.Color;
>>>>>>> f0fc240e (added gltexture view to android exoplayer)
import androidx.core.content.ContextCompat;

import android.util.AttributeSet;
import android.view.Gravity;
import android.view.Surface;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.brentvatne.react.GLTextureView;
<<<<<<< HEAD
=======
import com.brentvatne.react.VideoRenderer;
>>>>>>> f0fc240e (added gltexture view to android exoplayer)
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.video.VideoListener;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.source.hls.HlsManifest;
import com.google.android.exoplayer2.source.hls.playlist.HlsMediaPlaylist;
import com.google.android.exoplayer2.text.Cue;
import com.google.android.exoplayer2.text.TextOutput;
import com.google.common.collect.ImmutableList;
import com.google.android.exoplayer2.text.TextRenderer;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.ui.SubtitleView;

import java.util.Collections;
import java.util.Comparator;
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
<<<<<<< HEAD
    private boolean useGreenScreen = false;
    private boolean hideShutterView = false;
    private int transparentColor = Color.GREEN;
    private boolean useTextureView = false;
=======
    private int transparentColor = Color.GREEN;
    private boolean useTextureView = true;
    private boolean hideShutterView = false;
>>>>>>> f0fc240e (added gltexture view to android exoplayer)
    private boolean useCustomTextureView = false;

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

    private void clearVideoView() {
        if (surfaceView instanceof TextureView) {
            ThreadUtil.executeOnApplicationThread(player, () -> player.clearVideoTextureView((TextureView) surfaceView));
        } else if (surfaceView instanceof SurfaceView) {
            ThreadUtil.executeOnApplicationThread(player, () -> player.clearVideoSurfaceView((SurfaceView) surfaceView));
        }
    }

    private void setVideoView() {
        if (surfaceView instanceof TextureView) {
            ThreadUtil.executeOnApplicationThread(player, () -> player.setVideoTextureView((TextureView) surfaceView));
        } else if (surfaceView instanceof SurfaceView) {
            ThreadUtil.executeOnApplicationThread(player, () -> player.setVideoSurfaceView((SurfaceView) surfaceView));
        }
    }

    private void updateSurfaceView() {
        View view;
<<<<<<< HEAD
        if (useGreenScreen) {
=======
        if (useCustomTextureView) {
>>>>>>> f0fc240e (added gltexture view to android exoplayer)
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
<<<<<<< HEAD
            glTextureView.setOpaque(false);
=======
            glTextureView.setAlphaColorForRenderer(transparentColor);
>>>>>>> f0fc240e (added gltexture view to android exoplayer)
            glTextureView.setOnSurfaceCreatedCallBack(new OnSurfaceCreatedCallBack() {
                @Override
                public void onSurfaceCreated() {
                    if (ExoPlayerView.this.player != null) {
                        setVideoView();
<<<<<<< HEAD
                        player.addVideoListener(componentListener);
                        player.addListener(componentListener);
                        player.addTextOutput(componentListener);
=======
                        player.setVideoListener(componentListener);
                        player.addListener(componentListener);
                        player.setTextOutput(componentListener);
>>>>>>> f0fc240e (added gltexture view to android exoplayer)
                    }
                }
            });
        } else {
            if (this.player != null) {
                setVideoView();
            }
        }
    }

    private void updateShutterViewVisibility() {
        shutterView.setVisibility(this.hideShutterView ? View.INVISIBLE : View.VISIBLE);
    }

    public interface OnSurfaceCreatedCallBack {
        void onSurfaceCreated();
    }

    /**
     * Set the {@link SimpleExoPlayer} to use. The {@link SimpleExoPlayer#addTextOutput} and
     * {@link SimpleExoPlayer#addVideoListener} method of the player will be called and previous
     * assignments are overridden.
     *
     * @param player The {@link SimpleExoPlayer} to use.
     */
    public void setPlayer(SimpleExoPlayer player) {
        if (this.player == player) {
            return;
        }
        if (this.player != null) {
            this.player.removeTextOutput(componentListener);
            this.player.removeVideoListener(componentListener);
            this.player.removeListener(componentListener);
            clearVideoView();
        }
        this.player = player;
        shutterView.setVisibility(VISIBLE);
        if (player != null && !useCustomTextureView) {
            setVideoView();
            player.addVideoListener(componentListener);
            player.addListener(componentListener);
            player.addTextOutput(componentListener);
        }
    }

    /**
     * Sets the resize mode which can be of value {@link ResizeMode.Mode}
     *
     * @param resizeMode The resize mode.
     */
    public void setResizeMode(@ResizeMode.Mode int resizeMode) {
        if (layout.getResizeMode() != resizeMode) {
            layout.setResizeMode(resizeMode);
            post(measureAndLayout);
        }

    }

    /**
     * Get the view onto which video is rendered. This is either a {@link SurfaceView} (default)
     * or a {@link TextureView} if the {@code use_texture_view} view attribute has been set to true.
     *
     * @return either a {@link SurfaceView} or a {@link TextureView}.
     */
    public View getVideoSurfaceView() {
        return surfaceView;
    }

    public void setUseTextureView(boolean useTextureView) {
        if (useTextureView != this.useTextureView) {
            this.useTextureView = useTextureView;
            updateSurfaceView();
        }
    }

    public void setHideShutterView(boolean hideShutterView) {
        this.hideShutterView = hideShutterView;
        updateShutterViewVisibility();
    }

    public void setUseCustomTextureView(int color) {
        this.useCustomTextureView = true;
        this.transparentColor = color;
        updateSurfaceView();
    }

    public void setUseCustomTextureView(int color) {
        this.useCustomTextureView = true;
        this.transparentColor = color;
        updateSurfaceView();
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
        TrackSelectionArray selections = ThreadUtil.callOnApplicationThread(player, () -> player.getCurrentTrackSelections());
        if (selections == null) {
            return;
        }
        for (int i = 0; i < selections.length; i++) {
            if (player.getRendererType(i) == C.TRACK_TYPE_VIDEO && selections.get(i) != null) {
                // Video enabled so artwork must be hidden. If the shutter is closed, it will be opened in
                // onRenderedFirstFrame().
                return;
            }
        }
        // Video disabled so the shutter must be closed.
        shutterView.setVisibility(VISIBLE);
    }

    public int compareL(long x, long y) {
        return (x < y) ? -1 : ((x == y) ? 0 : 1);
    }

    public void sendFileChangeEventForTime(long time) {
        Object manifest = player.getCurrentManifest();
        if (manifest instanceof HlsManifest) {
            HlsMediaPlaylist.Segment segment = new HlsMediaPlaylist.Segment("", null,"", 0, 0, time*1000,null, "", "", 0, 0, false, ImmutableList.of());

            int index = Collections.binarySearch(((HlsManifest) manifest).mediaPlaylist.segments, segment, new Comparator<HlsMediaPlaylist.Segment>() {
                @Override
                public int compare(HlsMediaPlaylist.Segment o1, HlsMediaPlaylist.Segment o2) {
                    return compareL(o1.relativeStartTimeUs, o2.relativeStartTimeUs);
                }
            });

            if (index < 0) {
                index = -1 * index - 2;
            }

            if (index >= 0 && index < ((HlsManifest) manifest).mediaPlaylist.segments.size()) {
                try {
                    String url = ((HlsManifest) manifest).mediaPlaylist.segments.get(index).url;
                    String file = "";
                    if (url.contains("ts")) {
                        String[] urlSplit = ((HlsManifest) manifest).mediaPlaylist.segments.get(index).url.split("-");
                        long val = Long.parseLong(urlSplit[urlSplit.length - 1].replace(".ts", ""));
                        file = val + "";
                    } else if (url.contains("m4s")) {
                        file = url.replace(".m4s", "");
                    } else {
                        file = url;
                    }
                    if (fileChangeListener != null) {
                        try {
<<<<<<< HEAD
                            fileChangeListener.onFileChange(file, ((HlsManifest) manifest).mediaPlaylist.segments.get(index).relativeStartTimeUs, ((HlsManifest) manifest).mediaPlaylist.durationUs);
=======
                            fileChangeListener.onFileChange(val + "", ((HlsManifest) manifest).mediaPlaylist.segments.get(index).relativeStartTimeUs, ((HlsManifest) manifest).mediaPlaylist.durationUs);
>>>>>>> 02457061 (Send relative segment time instead of current time)
                        } catch (Exception ignore) {
//                            ignore.printStackTrace();
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public void sendFileChangeEventForTime() {
        if (player == null) {
            return;
        }
        Long currentPosition = ThreadUtil.callOnApplicationThread(player, () -> player.getCurrentPosition());
        if (currentPosition != null) {
            sendFileChangeEventForTime(currentPosition);
        }
    }

    public interface FileChangeListener {
        public void onFileChange(String file, long time, long duration);
    }

    public void invalidateAspectRatio() {
        // Resetting aspect ratio will force layout refresh on next video size changed
        layout.invalidateAspectRatio();
    }

    private final class ComponentListener implements VideoListener,
            TextOutput, ExoPlayer.EventListener {

        // TextRenderer.Output implementation

        @Override
        public void onCues(List<Cue> cues) {
            subtitleLayout.onCues(cues);
        }

        // SimpleExoPlayer.VideoListener implementation

        @Override
        public void onVideoSizeChanged(int width, int height, int unappliedRotationDegrees, float pixelWidthHeightRatio) {
            boolean isInitialRatio = layout.getAspectRatio() == 0;
            layout.setAspectRatio(height == 0 ? 1 : (width * pixelWidthHeightRatio) / height);

            // React native workaround for measuring and layout on initial load.
            if (isInitialRatio) {
                post(measureAndLayout);
            }
        }

        @Override
        public void onRenderedFirstFrame() {
            shutterView.setVisibility(INVISIBLE);
        }

        // ExoPlayer.EventListener implementation

        @Override
        public void onLoadingChanged(boolean isLoading) {
            sendFileChangeEventForTime();
            // Do nothing.
        }

        @Override
        public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
            sendFileChangeEventForTime();
            // Do nothing.
        }

        @Override
        public void onPlayerError(ExoPlaybackException e) {
            // Do nothing.
        }

        @Override
        public void onPositionDiscontinuity(int reason) {
            sendFileChangeEventForTime();
            // Do nothing.
        }


        @Override
        public void onTimelineChanged(Timeline timeline, Object manifest, int reason) {
            if (manifest instanceof HlsManifest && (reason == Player.TIMELINE_CHANGE_REASON_SOURCE_UPDATE)) {
                sendFileChangeEventForTime();
            }
            // Do nothing.
        }

        @Override
        public void onTracksChanged(TrackGroupArray trackGroups, TrackSelectionArray trackSelections) {
            updateForCurrentTrackSelections();
        }

        @Override
        public void onPlaybackParametersChanged(PlaybackParameters params) {
            sendFileChangeEventForTime();
            // Do nothing
        }

        @Override
        public void onSeekProcessed() {
            sendFileChangeEventForTime();
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
    }

}
