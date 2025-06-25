package com.brentvatne.exoplayer

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.view.View
import android.widget.FrameLayout
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.media3.ui.AspectRatioFrameLayout
import com.brentvatne.common.api.ResizeMode
import com.brentvatne.common.api.SubtitleStyle
import com.brentvatne.common.api.ViewType
import android.view.View.MeasureSpec

@UnstableApi
class ExoPlayerView @JvmOverloads constructor(
    context: Context, 
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private var localStyle = SubtitleStyle()

    val playerView = PlayerView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        setShutterBackgroundColor(Color.TRANSPARENT)
        useController = true
        controllerAutoShow = true
        controllerHideOnTouch = true
        controllerShowTimeoutMs = 5000
        // Show CC / subtitle button so users can toggle text tracks
        setShowSubtitleButton(true)
    }

    init {
        addView(playerView)
    }

    /**
     * Set the ExoPlayer instance
     */
    fun setPlayer(player: ExoPlayer?) {
        playerView.player = player
    }

    /**
     * Sets the resize mode
     */
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

    /**
     * Set subtitle style
     */
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

    /**
     * Set shutter color (background color when video is not playing)
     */
    fun setShutterColor(color: Int) {
        playerView.setShutterBackgroundColor(color)
    }

    /**
     * Update surface view type
     */
    fun updateSurfaceView(@ViewType.ViewType viewType: Int) {
        // PlayerView handles surface view internally
        // This method is kept for compatibility but does nothing
        // as PlayerView manages the surface automatically
    }

    /**
     * Set hide shutter view
     */
    fun setHideShutterView(hideShutterView: Boolean) {
        // PlayerView manages shutter view internally
        // This method is kept for compatibility
    }

    /**
     * Show ads overlay
     */
    fun showAds() {
        // PlayerView has built-in ad overlay support
        // This will be handled by the PlayerView automatically
    }

    /**
     * Hide ads overlay
     */
    fun hideAds() {
        // PlayerView has built-in ad overlay support
        // This will be handled by the PlayerView automatically
    }

    /**
     * Check if player is currently playing
     */
    val isPlaying: Boolean
        get() = playerView.player?.isPlaying ?: false

    /**
     * Invalidate aspect ratio (force refresh)
     */
    fun invalidateAspectRatio() {
        // PlayerView handles aspect ratio automatically
        requestLayout()
    }

    /**
     * Set controller visibility and configuration
     */
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

    /**
     * Additional PlayerView method wrappers for compatibility
     */
    fun isControllerVisible(): Boolean {
        return playerView.isControllerFullyVisible
    }

    fun setControllerVisibilityListener(listener: PlayerView.ControllerVisibilityListener?) {
        playerView.setControllerVisibilityListener(listener)
    }

    fun setRewindIncrementMs(rewindMs: Int) {
        // PlayerView in Media3 uses different method names
        // This is kept for compatibility but may not have direct equivalent
    }

    fun setFastForwardIncrementMs(fastForwardMs: Int) {
        // PlayerView in Media3 uses different method names  
        // This is kept for compatibility but may not have direct equivalent
    }

    fun updateShutterViewVisibility() {
        // PlayerView manages shutter view automatically
        // This method is kept for compatibility
    }

    override fun addOnLayoutChangeListener(listener: View.OnLayoutChangeListener) {
        playerView.addOnLayoutChangeListener(listener)
    }

    override fun setFocusable(focusable: Boolean) {
        playerView.isFocusable = focusable
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
