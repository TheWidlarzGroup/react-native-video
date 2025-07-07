package com.brentvatne.exoplayer

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
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

@UnstableApi
class ExoPlayerView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
    FrameLayout(context, attrs, defStyleAttr) {

    private var localStyle = SubtitleStyle()
    private var pendingResizeMode: Int? = null
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
        // Ensure proper video scaling - start with FIT mode
        resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
    }

    init {
        // Add PlayerView with explicit layout parameters
        val playerViewLayoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(playerView, playerViewLayoutParams)

        // Add live badge with its own layout parameters
        val liveBadgeLayoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        liveBadgeLayoutParams.setMargins(16, 16, 16, 16)
        addView(liveBadge, liveBadgeLayoutParams)
    }

    fun setPlayer(player: ExoPlayer?) {
        val currentPlayer = playerView.player

        if (currentPlayer != null) {
            currentPlayer.removeListener(playerListener)
        }

        playerView.player = player

        if (player != null) {
            player.addListener(playerListener)

            // Apply pending resize mode if we have one
            pendingResizeMode?.let { resizeMode ->
                playerView.resizeMode = resizeMode
            }
        }
    }

    fun getPlayerView(): PlayerView = playerView

    fun setResizeMode(@ResizeMode.Mode resizeMode: Int) {
        val targetResizeMode = when (resizeMode) {
            ResizeMode.RESIZE_MODE_FILL -> AspectRatioFrameLayout.RESIZE_MODE_FILL
            ResizeMode.RESIZE_MODE_CENTER_CROP -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            ResizeMode.RESIZE_MODE_FIT -> AspectRatioFrameLayout.RESIZE_MODE_FIT
            ResizeMode.RESIZE_MODE_FIXED_WIDTH -> AspectRatioFrameLayout.RESIZE_MODE_FIXED_WIDTH
            ResizeMode.RESIZE_MODE_FIXED_HEIGHT -> AspectRatioFrameLayout.RESIZE_MODE_FIXED_HEIGHT
            else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
        }

        // Apply the resize mode to PlayerView immediately
        playerView.resizeMode = targetResizeMode

        // Store it for reapplication if needed
        pendingResizeMode = targetResizeMode

        // Force PlayerView to recalculate its layout
        playerView.requestLayout()

        // Also request layout on the parent to ensure proper sizing
        requestLayout()
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
        // TODO: Implement proper surface type switching if needed
    }

    val isPlaying: Boolean
        get() = playerView.player?.isPlaying ?: false

    fun invalidateAspectRatio() {
        // PlayerView handles aspect ratio automatically through its internal AspectRatioFrameLayout
        playerView.requestLayout()

        // Reapply the current resize mode to ensure it's properly set
        pendingResizeMode?.let { resizeMode ->
            playerView.resizeMode = resizeMode
        }
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
            playerView.post {
                playerView.requestLayout()
                // Reapply resize mode to ensure it's properly set after timeline changes
                pendingResizeMode?.let { resizeMode ->
                    playerView.resizeMode = resizeMode
                }
            }
            updateLiveUi()
        }

        override fun onEvents(player: Player, events: Player.Events) {
            if (events.contains(Player.EVENT_MEDIA_ITEM_TRANSITION) ||
                events.contains(Player.EVENT_IS_PLAYING_CHANGED)
            ) {
                updateLiveUi()
            }

            // Handle video size changes which affect aspect ratio
            if (events.contains(Player.EVENT_VIDEO_SIZE_CHANGED)) {
                pendingResizeMode?.let { resizeMode ->
                    playerView.resizeMode = resizeMode
                }
                playerView.requestLayout()
                requestLayout()
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

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)

        if (changed) {
            pendingResizeMode?.let { resizeMode ->
                playerView.resizeMode = resizeMode
            }
        }
    }
}
