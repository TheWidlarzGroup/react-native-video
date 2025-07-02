package com.brentvatne.exoplayer

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import android.view.View.MeasureSpec
import android.widget.FrameLayout
import android.widget.TextView
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.DefaultTimeBar
import androidx.media3.ui.PlayerView
import com.brentvatne.common.api.ResizeMode
import com.brentvatne.common.api.SubtitleStyle
import com.brentvatne.common.api.ViewType

@UnstableApi
class ExoPlayerView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
    FrameLayout(context, attrs, defStyleAttr) {

    private var localStyle = SubtitleStyle()
    private var surfaceView: View? = null
    private val liveBadge: TextView = TextView(context).apply {
        text = "LIVE"
        setTextColor(Color.WHITE)
        textSize = 12f
        val drawable = GradientDrawable()
        drawable.setColor(Color.RED)
        drawable.cornerRadius = 6f
        background = drawable
        setPadding(12, 4, 12, 4)
        visibility = View.GONE
    }

    private val playerView = PlayerView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        setShutterBackgroundColor(Color.TRANSPARENT)
        useController = true
        controllerAutoShow = true
        controllerHideOnTouch = true
        controllerShowTimeoutMs = 5000
        // Don't show subtitle button by default - will be enabled when tracks are available
        setShowSubtitleButton(false)
        // Enable proper surface view handling to prevent rendering issues
        setUseArtwork(false)
        setDefaultArtwork(null)
        // Ensure proper video scaling
        resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
    }

    init {
        addView(playerView)
        val lp = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        lp.setMargins(16, 16, 16, 16)
        addView(liveBadge, lp)
    }

    fun setPlayer(player: ExoPlayer?) {
        val currentPlayer = playerView.player

        if (currentPlayer != null) {
            currentPlayer.removeListener(playerListener)
            // Clear any existing surface from the player
            when (surfaceView) {
                is SurfaceView -> currentPlayer.clearVideoSurfaceView(surfaceView as SurfaceView)
                is TextureView -> currentPlayer.clearVideoTextureView(surfaceView as TextureView)
            }
        }

        playerView.player = player

        if (player != null) {
            player.addListener(playerListener)
            // Set the surface view for the new player
            when (surfaceView) {
                is SurfaceView -> player.setVideoSurfaceView(surfaceView as SurfaceView)
                is TextureView -> player.setVideoTextureView(surfaceView as TextureView)
            }
        }
    }

    fun getPlayerView(): PlayerView = playerView

    fun setResizeMode(@ResizeMode.Mode resizeMode: Int) {
        playerView.resizeMode = when (resizeMode) {
            ResizeMode.RESIZE_MODE_FILL -> AspectRatioFrameLayout.RESIZE_MODE_FILL
            ResizeMode.RESIZE_MODE_CENTER_CROP -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            ResizeMode.RESIZE_MODE_FIT -> AspectRatioFrameLayout.RESIZE_MODE_FIT
            ResizeMode.RESIZE_MODE_FIXED_WIDTH -> AspectRatioFrameLayout.RESIZE_MODE_FIXED_WIDTH
            ResizeMode.RESIZE_MODE_FIXED_HEIGHT -> AspectRatioFrameLayout.RESIZE_MODE_FIXED_HEIGHT
            else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
        }
    }

    fun setSubtitleStyle(style: SubtitleStyle) {
        playerView.subtitleView?.let { subtitleView ->
            // Reset to defaults
            subtitleView.setUserDefaultStyle()
            subtitleView.setUserDefaultTextSize()

            // Apply custom styling
            if (style.fontSize > 0) {
                subtitleView.setFixedTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, style.fontSize.toFloat())
            }

            subtitleView.setPadding(
                style.paddingLeft,
                style.paddingTop,
                style.paddingRight,
                style.paddingBottom
            )

            if (style.opacity != 0.0f) {
                subtitleView.alpha = style.opacity
                subtitleView.visibility = android.view.View.VISIBLE
            } else {
                subtitleView.visibility = android.view.View.GONE
            }
        }
        localStyle = style
    }

    fun setShutterColor(color: Int) {
        playerView.setShutterBackgroundColor(color)
    }

    fun updateSurfaceView(viewType: Int) {
        val currentSurfaceView = surfaceView
        val newSurfaceView: View = when (viewType) {
            ViewType.VIEW_TYPE_TEXTURE -> TextureView(context)

            ViewType.VIEW_TYPE_SURFACE_SECURE -> SurfaceView(context).apply {
                // Requires API 17+
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                    (this as SurfaceView).setSecure(true)
                }
            }

            else -> SurfaceView(context)
        }

        if (currentSurfaceView === newSurfaceView) {
            return
        }

        // Remove the old surface view
        if (currentSurfaceView != null) {
            removeView(currentSurfaceView)
        }

        // Add the new surface view
        surfaceView = newSurfaceView
        val layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(newSurfaceView, 0, layoutParams)

        // Attach player to the new surface
        playerView.player?.let {
            when (newSurfaceView) {
                is SurfaceView -> it.setVideoSurfaceView(newSurfaceView)
                is TextureView -> it.setVideoTextureView(newSurfaceView)
            }
        }
    }

    val isPlaying: Boolean
        get() = playerView.player?.isPlaying ?: false

    fun invalidateAspectRatio() {
        // PlayerView handles aspect ratio automatically
        requestLayout()
    }

    fun setUseController(useController: Boolean) {
        playerView.useController = useController
        if (useController) {
            // Ensure proper touch handling when controls are enabled
            playerView.controllerAutoShow = true
            playerView.controllerHideOnTouch = true
            // Show controls immediately when enabled
            playerView.showController()
        }
    }

    fun showController() {
        playerView.showController()
    }

    fun hideController() {
        playerView.hideController()
    }

    fun setControllerShowTimeoutMs(showTimeoutMs: Int) {
        playerView.controllerShowTimeoutMs = showTimeoutMs
    }

    fun setControllerAutoShow(autoShow: Boolean) {
        playerView.controllerAutoShow = autoShow
    }

    fun setControllerHideOnTouch(hideOnTouch: Boolean) {
        playerView.controllerHideOnTouch = hideOnTouch
    }

    fun setFullscreenButtonClickListener(listener: PlayerView.FullscreenButtonClickListener?) {
        playerView.setFullscreenButtonClickListener(listener)
    }

    fun setShowSubtitleButton(show: Boolean) {
        playerView.setShowSubtitleButton(show)
    }

    fun isControllerVisible(): Boolean = playerView.isControllerFullyVisible

    fun setControllerVisibilityListener(listener: PlayerView.ControllerVisibilityListener?) {
        playerView.setControllerVisibilityListener(listener)
    }

    override fun addOnLayoutChangeListener(listener: View.OnLayoutChangeListener) {
        playerView.addOnLayoutChangeListener(listener)
    }

    override fun setFocusable(focusable: Boolean) {
        playerView.isFocusable = focusable
    }

    private fun updateLiveUi() {
        val player = playerView.player ?: return
        val isLive = player.isCurrentMediaItemLive
        val seekable = player.isCurrentMediaItemSeekable

        // Show/hide badge
        liveBadge.visibility = if (isLive) View.VISIBLE else View.GONE

        // Disable/enable scrubbing based on seekable
        val timeBar = playerView.findViewById<DefaultTimeBar?>(androidx.media3.ui.R.id.exo_progress)
        timeBar?.isEnabled = !isLive || seekable
    }

    private val playerListener = object : Player.Listener {
        override fun onTimelineChanged(timeline: Timeline, reason: Int) {
            playerView.post { playerView.requestLayout() }
            updateLiveUi()
        }

        override fun onEvents(player: Player, events: Player.Events) {
            if (events.contains(Player.EVENT_MEDIA_ITEM_TRANSITION) ||
                events.contains(Player.EVENT_IS_PLAYING_CHANGED)
            ) {
                updateLiveUi()
            }
        }
    }

    companion object {
        private const val TAG = "ExoPlayerView"
    }

    /**
     * React Native (Yoga) can sometimes defer layout passes that are required by
     * PlayerView for its child views (controller overlay, surface view, subtitle view, …).
     * This helper forces a second measure / layout after RN finishes, ensuring the
     * internal views receive the final size. The same approach is used in the v7
     * implementation (see VideoView.kt) and in React Native core (Toolbar example [link]).
     */
    private val layoutRunnable = Runnable {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        )
        layout(left, top, right, bottom)
    }

    override fun requestLayout() {
        super.requestLayout()
        // Post a second layout pass so the ExoPlayer internal views get correct bounds.
        post(layoutRunnable)
    }
}
