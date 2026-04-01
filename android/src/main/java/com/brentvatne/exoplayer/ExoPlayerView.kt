package com.brentvatne.exoplayer

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.SurfaceView
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
import com.brentvatne.react.R

@UnstableApi
class ExoPlayerView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
    FrameLayout(context, attrs, defStyleAttr) {

    private var localStyle = SubtitleStyle()
    private var pendingResizeMode: Int? = null
    private var currentPlayer: ExoPlayer? = null
    private var currentViewType = ViewType.VIEW_TYPE_SURFACE
    private var currentShutterColor = Color.TRANSPARENT
    private var useController = true
    private var controllerAutoShow = true
    private var controllerHideOnTouch = true
    private var controllerShowTimeoutMs = 5000
    private var showSubtitleButton = false
    private var isPlayerFocusable = true
    private var controllerVisibilityListener: PlayerView.ControllerVisibilityListener? = null
    private var fullscreenButtonClickListener: PlayerView.FullscreenButtonClickListener? = null
    private val playerViewLayoutChangeListeners = mutableListOf<View.OnLayoutChangeListener>()
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

    private var playerView = createPlayerView(currentViewType)

    init {
        attachPlayerView(playerView)

        // Add live badge with its own layout parameters
        val liveBadgeLayoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        liveBadgeLayoutParams.setMargins(16, 16, 16, 16)
        addView(liveBadge, liveBadgeLayoutParams)
    }

    fun setPlayer(player: ExoPlayer?) {
        if (currentPlayer != null) {
            currentPlayer.removeListener(playerListener)
        }

        currentPlayer = player
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
        localStyle = style
        applySubtitleStyle(playerView, style)
    }

    fun setShutterColor(color: Int) {
        currentShutterColor = color
        playerView.setShutterBackgroundColor(color)
    }

    fun updateSurfaceView(viewType: Int) {
        if (currentViewType == viewType) {
            applySecureSurface(playerView, viewType)
            return
        }

        currentViewType = viewType
        recreatePlayerView()
    }

    val isPlaying: Boolean
        get() = currentPlayer?.isPlaying ?: false

    fun invalidateAspectRatio() {
        // PlayerView handles aspect ratio automatically through its internal AspectRatioFrameLayout
        playerView.requestLayout()

        // Reapply the current resize mode to ensure it's properly set
        pendingResizeMode?.let { resizeMode ->
            playerView.resizeMode = resizeMode
        }
    }

    fun setUseController(useController: Boolean) {
        this.useController = useController
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
        controllerShowTimeoutMs = showTimeoutMs
        playerView.controllerShowTimeoutMs = showTimeoutMs
    }

    fun setControllerAutoShow(autoShow: Boolean) {
        controllerAutoShow = autoShow
        playerView.controllerAutoShow = autoShow
    }

    fun setControllerHideOnTouch(hideOnTouch: Boolean) {
        controllerHideOnTouch = hideOnTouch
        playerView.controllerHideOnTouch = hideOnTouch
    }

    fun setFullscreenButtonClickListener(listener: PlayerView.FullscreenButtonClickListener?) {
        fullscreenButtonClickListener = listener
        playerView.setFullscreenButtonClickListener(listener)
    }

    fun setShowSubtitleButton(show: Boolean) {
        showSubtitleButton = show
        playerView.setShowSubtitleButton(show)
    }

    fun isControllerVisible(): Boolean = playerView.isControllerFullyVisible

    fun setControllerVisibilityListener(listener: PlayerView.ControllerVisibilityListener?) {
        controllerVisibilityListener = listener
        playerView.setControllerVisibilityListener(listener)
    }

    override fun addOnLayoutChangeListener(listener: View.OnLayoutChangeListener) {
        if (!playerViewLayoutChangeListeners.contains(listener)) {
            playerViewLayoutChangeListeners.add(listener)
        }
        playerView.addOnLayoutChangeListener(listener)
    }

    override fun setFocusable(focusable: Boolean) {
        isPlayerFocusable = focusable
        playerView.isFocusable = focusable
    }

    private fun createPlayerView(viewType: Int): PlayerView {
        val createdPlayerView =
            if (viewType == ViewType.VIEW_TYPE_TEXTURE) {
                LayoutInflater.from(context)
                    .inflate(R.layout.exo_texture_player_view, this, false) as PlayerView
            } else {
                PlayerView(context)
            }

        configurePlayerView(createdPlayerView, viewType)

        return createdPlayerView
    }

    private fun configurePlayerView(targetPlayerView: PlayerView, viewType: Int) {
        targetPlayerView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        targetPlayerView.setShutterBackgroundColor(currentShutterColor)
        targetPlayerView.useController = useController
        targetPlayerView.controllerAutoShow = controllerAutoShow
        targetPlayerView.controllerHideOnTouch = controllerHideOnTouch
        targetPlayerView.controllerShowTimeoutMs = controllerShowTimeoutMs
        targetPlayerView.setShowSubtitleButton(showSubtitleButton)
        targetPlayerView.setUseArtwork(false)
        targetPlayerView.setDefaultArtwork(null)
        targetPlayerView.resizeMode =
            pendingResizeMode ?: androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
        targetPlayerView.player = currentPlayer
        targetPlayerView.isFocusable = isPlayerFocusable

        controllerVisibilityListener?.let(targetPlayerView::setControllerVisibilityListener)
        fullscreenButtonClickListener?.let(targetPlayerView::setFullscreenButtonClickListener)
        playerViewLayoutChangeListeners.forEach(targetPlayerView::addOnLayoutChangeListener)

        applySecureSurface(targetPlayerView, viewType)
        applySubtitleStyle(targetPlayerView, localStyle)
    }

    private fun attachPlayerView(targetPlayerView: PlayerView) {
        val playerViewLayoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(targetPlayerView, 0, playerViewLayoutParams)
    }

    private fun recreatePlayerView() {
        val previousPlayerView = playerView
        val wasControllerVisible = previousPlayerView.isControllerFullyVisible

        previousPlayerView.player = null
        removeView(previousPlayerView)

        playerView = createPlayerView(currentViewType)
        attachPlayerView(playerView)

        if (wasControllerVisible && useController) {
            playerView.showController()
        }

        requestLayout()
        updateLiveUi()
    }

    private fun applySecureSurface(targetPlayerView: PlayerView, viewType: Int) {
        val surfaceView = targetPlayerView.videoSurfaceView as? SurfaceView ?: return
        surfaceView.setSecure(viewType == ViewType.VIEW_TYPE_SURFACE_SECURE)
    }

    private fun applySubtitleStyle(targetPlayerView: PlayerView, style: SubtitleStyle) {
        targetPlayerView.subtitleView?.let { subtitleView ->
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
