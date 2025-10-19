package com.brentvatne.exoplayer

import android.graphics.Color
import android.util.Log
import com.brentvatne.common.api.BufferingStrategy
import com.brentvatne.common.api.ControlsConfig
import com.brentvatne.common.api.ResizeMode
import com.brentvatne.common.api.Source
import com.brentvatne.common.api.SubtitleStyle
import com.brentvatne.common.api.ViewType
import com.brentvatne.common.react.EventTypes
import com.brentvatne.common.toolbox.DebugLog
import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.brentvatne.react.ReactNativeVideoManager
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class ReactExoplayerViewManager(private val config: ReactExoplayerConfig) : ViewGroupManager<ReactExoplayerView>() {

    companion object {
        private const val TAG = "ExoViewManager"
        private const val REACT_CLASS = "RCTVideo"
        private const val PROP_SRC = "src"
        private const val PROP_RESIZE_MODE = "resizeMode"
        private const val PROP_REPEAT = "repeat"
        private const val PROP_SELECTED_AUDIO_TRACK = "selectedAudioTrack"
        private const val PROP_SELECTED_AUDIO_TRACK_TYPE = "type"
        private const val PROP_SELECTED_AUDIO_TRACK_VALUE = "value"
        private const val PROP_SELECTED_TEXT_TRACK = "selectedTextTrack"
        private const val PROP_SELECTED_TEXT_TRACK_TYPE = "type"
        private const val PROP_SELECTED_TEXT_TRACK_VALUE = "value"
        private const val PROP_PAUSED = "paused"
        private const val PROP_ENTER_PICTURE_IN_PICTURE_ON_LEAVE = "enterPictureInPictureOnLeave"
        private const val PROP_MUTED = "muted"
        private const val PROP_AUDIO_OUTPUT = "audioOutput"
        private const val PROP_VOLUME = "volume"
        private const val PROP_PREVENTS_DISPLAY_SLEEP_DURING_VIDEO_PLAYBACK =
            "preventsDisplaySleepDuringVideoPlayback"
        private const val PROP_PROGRESS_UPDATE_INTERVAL = "progressUpdateInterval"
        private const val PROP_REPORT_BANDWIDTH = "reportBandwidth"
        private const val PROP_RATE = "rate"
        private const val PROP_MAXIMUM_BIT_RATE = "maxBitRate"
        private const val PROP_PLAY_IN_BACKGROUND = "playInBackground"
        private const val PROP_DISABLE_FOCUS = "disableFocus"
        private const val PROP_BUFFERING_STRATEGY = "bufferingStrategy"
        private const val PROP_DISABLE_DISCONNECT_ERROR = "disableDisconnectError"
        private const val PROP_FOCUSABLE = "focusable"
        private const val PROP_FULLSCREEN = "fullscreen"
        private const val PROP_VIEW_TYPE = "viewType"
        private const val PROP_SELECTED_VIDEO_TRACK = "selectedVideoTrack"
        private const val PROP_SELECTED_VIDEO_TRACK_TYPE = "type"
        private const val PROP_SELECTED_VIDEO_TRACK_VALUE = "value"
        private const val PROP_CONTROLS = "controls"
        private const val PROP_SUBTITLE_STYLE = "subtitleStyle"
        private const val PROP_SHUTTER_COLOR = "shutterColor"
        private const val PROP_SHOW_NOTIFICATION_CONTROLS = "showNotificationControls"
        private const val PROP_DEBUG = "debug"
        private const val PROP_CONTROLS_STYLES = "controlsStyles"
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(themedReactContext: ThemedReactContext): ReactExoplayerView {
        ReactNativeVideoManager.getInstance().registerView(this)
        return ReactExoplayerView(themedReactContext, config)
    }

    override fun onDropViewInstance(view: ReactExoplayerView) {
        view.cleanUpResources()
        view.exitPictureInPictureMode()
        ReactNativeVideoManager.getInstance().unregisterView(this)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> = EventTypes.toMap()

    override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactExoplayerView) {
        super.addEventEmitters(reactContext, view)
        view.eventEmitter.addEventEmitters(reactContext, view)
    }

    @ReactProp(name = PROP_SRC)
    fun setSrc(videoView: ReactExoplayerView, src: ReadableMap?) {
        val context = videoView.context.applicationContext
        videoView.setSrc(Source.parse(src, context))
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    fun setResizeMode(videoView: ReactExoplayerView, resizeMode: String) {
        when (resizeMode) {
            "none", "contain" -> videoView.setResizeModeModifier(ResizeMode.RESIZE_MODE_FIT)

            "cover" -> videoView.setResizeModeModifier(ResizeMode.RESIZE_MODE_CENTER_CROP)

            "stretch" -> videoView.setResizeModeModifier(ResizeMode.RESIZE_MODE_FILL)

            else -> {
                DebugLog.w(TAG, "Unsupported resize mode: $resizeMode - falling back to fit")
                videoView.setResizeModeModifier(ResizeMode.RESIZE_MODE_FIT)
            }
        }
    }

    @ReactProp(name = PROP_REPEAT, defaultBoolean = false)
    fun setRepeat(videoView: ReactExoplayerView, repeat: Boolean) {
        videoView.setRepeatModifier(repeat)
    }

    @ReactProp(name = PROP_PREVENTS_DISPLAY_SLEEP_DURING_VIDEO_PLAYBACK, defaultBoolean = false)
    fun setPreventsDisplaySleepDuringVideoPlayback(videoView: ReactExoplayerView, preventsSleep: Boolean) {
        videoView.preventsDisplaySleepDuringVideoPlayback = preventsSleep
    }

    @ReactProp(name = PROP_SELECTED_VIDEO_TRACK)
    fun setSelectedVideoTrack(videoView: ReactExoplayerView, selectedVideoTrack: ReadableMap?) {
        var typeString: String? = null
        var value: String? = null
        if (selectedVideoTrack != null) {
            typeString = ReactBridgeUtils.safeGetString(selectedVideoTrack, PROP_SELECTED_VIDEO_TRACK_TYPE)
            value = ReactBridgeUtils.safeGetString(selectedVideoTrack, PROP_SELECTED_VIDEO_TRACK_VALUE)
        }
        videoView.setSelectedVideoTrack(typeString, value)
    }

    @ReactProp(name = PROP_SELECTED_AUDIO_TRACK)
    fun setSelectedAudioTrack(videoView: ReactExoplayerView, selectedAudioTrack: ReadableMap?) {
        var typeString: String? = null
        var value: String? = null
        if (selectedAudioTrack != null) {
            typeString = ReactBridgeUtils.safeGetString(selectedAudioTrack, PROP_SELECTED_AUDIO_TRACK_TYPE)
            value = ReactBridgeUtils.safeGetString(selectedAudioTrack, PROP_SELECTED_AUDIO_TRACK_VALUE)
        }
        videoView.setSelectedAudioTrack(typeString, value)
    }

    @ReactProp(name = PROP_SELECTED_TEXT_TRACK)
    fun setSelectedTextTrack(videoView: ReactExoplayerView, selectedTextTrack: ReadableMap?) {
        var typeString: String? = null
        var value: String? = null
        if (selectedTextTrack != null) {
            typeString = ReactBridgeUtils.safeGetString(selectedTextTrack, PROP_SELECTED_TEXT_TRACK_TYPE)
            value = ReactBridgeUtils.safeGetString(selectedTextTrack, PROP_SELECTED_TEXT_TRACK_VALUE)
        }
        videoView.setSelectedTextTrack(typeString, value)
    }

    @ReactProp(name = PROP_PAUSED, defaultBoolean = false)
    fun setPaused(videoView: ReactExoplayerView, paused: Boolean) {
        videoView.setPausedModifier(paused)
    }

    @ReactProp(name = PROP_MUTED, defaultBoolean = false)
    fun setMuted(videoView: ReactExoplayerView, muted: Boolean) {
        videoView.setMutedModifier(muted)
    }

    @ReactProp(name = PROP_ENTER_PICTURE_IN_PICTURE_ON_LEAVE, defaultBoolean = false)
    fun setEnterPictureInPictureOnLeave(videoView: ReactExoplayerView, enterPictureInPictureOnLeave: Boolean) {
        videoView.setEnterPictureInPictureOnLeave(enterPictureInPictureOnLeave)
    }

    @ReactProp(name = PROP_AUDIO_OUTPUT)
    fun setAudioOutput(videoView: ReactExoplayerView, audioOutput: String) {
        videoView.setAudioOutput(AudioOutput.get(audioOutput))
    }

    @ReactProp(name = PROP_VOLUME, defaultFloat = 1.0f)
    fun setVolume(videoView: ReactExoplayerView, volume: Float) {
        videoView.setVolumeModifier(volume)
    }

    @ReactProp(name = PROP_PROGRESS_UPDATE_INTERVAL, defaultFloat = 250.0f)
    fun setProgressUpdateInterval(videoView: ReactExoplayerView, progressUpdateInterval: Float) {
        videoView.setProgressUpdateInterval(progressUpdateInterval)
    }

    @ReactProp(name = PROP_REPORT_BANDWIDTH, defaultBoolean = false)
    fun setReportBandwidth(videoView: ReactExoplayerView, reportBandwidth: Boolean) {
        videoView.setReportBandwidth(reportBandwidth)
    }

    @ReactProp(name = PROP_RATE)
    fun setRate(videoView: ReactExoplayerView, rate: Float) {
        videoView.setRateModifier(rate)
    }

    @ReactProp(name = PROP_MAXIMUM_BIT_RATE)
    fun setMaxBitRate(videoView: ReactExoplayerView, maxBitRate: Float) {
        videoView.setMaxBitRateModifier(maxBitRate.toInt())
    }

    @ReactProp(name = PROP_PLAY_IN_BACKGROUND, defaultBoolean = false)
    fun setPlayInBackground(videoView: ReactExoplayerView, playInBackground: Boolean) {
        videoView.setPlayInBackground(playInBackground)
    }

    @ReactProp(name = PROP_DISABLE_FOCUS, defaultBoolean = false)
    fun setDisableFocus(videoView: ReactExoplayerView, disableFocus: Boolean) {
        videoView.setDisableFocus(disableFocus)
    }

    @ReactProp(name = PROP_FOCUSABLE, defaultBoolean = true)
    fun setFocusable(videoView: ReactExoplayerView, focusable: Boolean) {
        videoView.setFocusable(focusable)
    }

    @ReactProp(name = PROP_BUFFERING_STRATEGY)
    fun setBufferingStrategy(videoView: ReactExoplayerView, bufferingStrategy: String) {
        val strategy = BufferingStrategy.parse(bufferingStrategy)
        videoView.setBufferingStrategy(strategy)
    }

    @ReactProp(name = PROP_DISABLE_DISCONNECT_ERROR, defaultBoolean = false)
    fun setDisableDisconnectError(videoView: ReactExoplayerView, disableDisconnectError: Boolean) {
        videoView.setDisableDisconnectError(disableDisconnectError)
    }

    @ReactProp(name = PROP_FULLSCREEN, defaultBoolean = false)
    fun setFullscreen(videoView: ReactExoplayerView, fullscreen: Boolean) {
        videoView.setFullscreen(fullscreen)
    }

    @ReactProp(name = PROP_VIEW_TYPE, defaultInt = ViewType.VIEW_TYPE_SURFACE)
    fun setViewType(videoView: ReactExoplayerView, viewType: Int) {
        videoView.setViewType(viewType)
    }

    @ReactProp(name = PROP_CONTROLS, defaultBoolean = false)
    fun setControls(videoView: ReactExoplayerView, controls: Boolean) {
        videoView.setControls(controls)
    }

    @ReactProp(name = PROP_SUBTITLE_STYLE)
    fun setSubtitleStyle(videoView: ReactExoplayerView, src: ReadableMap?) {
        videoView.setSubtitleStyle(SubtitleStyle.parse(src))
    }

    @ReactProp(name = PROP_SHUTTER_COLOR, defaultInt = Color.BLACK)
    fun setShutterColor(videoView: ReactExoplayerView, color: Int) {
        videoView.setShutterColor(color)
    }

    @ReactProp(name = PROP_SHOW_NOTIFICATION_CONTROLS)
    fun setShowNotificationControls(videoView: ReactExoplayerView, showNotificationControls: Boolean) {
        videoView.setShowNotificationControls(showNotificationControls)
    }

    @ReactProp(name = PROP_DEBUG, defaultBoolean = false)
    fun setDebug(videoView: ReactExoplayerView, debugConfig: ReadableMap?) {
        val enableDebug = ReactBridgeUtils.safeGetBool(debugConfig, "enable", false)
        val enableThreadDebug = ReactBridgeUtils.safeGetBool(debugConfig, "thread", false)
        if (enableDebug) {
            DebugLog.setConfig(Log.VERBOSE, enableThreadDebug)
        } else {
            DebugLog.setConfig(Log.WARN, enableThreadDebug)
        }
        videoView.setDebug(enableDebug)
    }

    @ReactProp(name = PROP_CONTROLS_STYLES)
    fun setControlsStyles(videoView: ReactExoplayerView, controlsStyles: ReadableMap?) {
        val controlsConfig = ControlsConfig.parse(controlsStyles)
        videoView.setControlsStyles(controlsConfig)
    }
}
