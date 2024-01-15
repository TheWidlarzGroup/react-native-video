package com.brentvatne.exoplayer;

import android.net.Uri
import android.text.TextUtils
import androidx.media3.common.util.Util
import androidx.media3.datasource.RawResourceDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetInt
import com.brentvatne.common.toolbox.ReactBridgeUtils.safeGetString
import com.brentvatne.exoplayer.events.*
import com.brentvatne.common.api.ResizeMode
import com.brentvatne.common.api.SubtitleStyle
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RNCVideoManagerDelegate
import com.facebook.react.viewmanagers.RNCVideoManagerInterface
import java.util.*
import javax.annotation.Nullable


@ReactModule(name = "RNCVideo")
internal class ReactExoplayerViewManager() : ViewGroupManager<ReactExoplayerView>(), RNCVideoManagerInterface<ReactExoplayerView> {
    private var config: ReactExoplayerConfig? = null

    private val mDelegate: ViewManagerDelegate<ReactExoplayerView> = RNCVideoManagerDelegate(this)

    private val REACT_CLASS = "RNCVideo"

    private val PROP_SRC_URI = "uri"
    private val PROP_START_POSITION = "startPosition"
    private val PROP_SRC_CROP_START = "cropStart"
    private val PROP_SRC_CROP_END = "cropEnd"
    private val PROP_SRC_TYPE = "type"
    private val PROP_SRC_HEADERS = "requestHeaders"

    private val PROP_DRM_TYPE = "drmType"
    private val PROP_DRM_LICENSESERVER = "licenseServer"
    private val PROP_DRM_HEADERS = "headers"

    private val PROP_SELECTED_TEXT_TRACK_TYPE = "selectedTextType"
    private val PROP_SELECTED_TEXT_TRACK_VALUE = "value"

    private val PROP_SELECTED_AUDIO_TRACK_TYPE = "selectedAudioType"
    private val PROP_SELECTED_AUDIO_TRACK_VALUE = "value"

    private val PROP_BUFFER_CONFIG_MIN_BUFFER_MS = "minBufferMs"
    private val PROP_BUFFER_CONFIG_MAX_BUFFER_MS = "maxBufferMs"
    private val PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS = "bufferForPlaybackMs"
    private val PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = "bufferForPlaybackAfterRebufferMs"
    private val PROP_BUFFER_CONFIG_MAX_HEAP_ALLOCATION_PERCENT = "maxHeapAllocationPercent"
    private val PROP_BUFFER_CONFIG_MIN_BACK_BUFFER_MEMORY_RESERVE_PERCENT = "minBackBufferMemoryReservePercent"
    private val PROP_BUFFER_CONFIG_MIN_BUFFER_MEMORY_RESERVE_PERCENT = "minBufferMemoryReservePercent"

    private val PROP_SELECTED_VIDEO_TRACK_TYPE = "selectedVideoType"
    private val PROP_SELECTED_VIDEO_TRACK_VALUE = "value"

    constructor(config: ReactExoplayerConfig) : this() {
        this.config = config
    }

    override fun getName(): String {
        return this.REACT_CLASS
    }

    override fun createViewInstance(p0: ThemedReactContext): ReactExoplayerView {
        val view = ReactExoplayerView(p0, config)
        return view
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return mutableMapOf(
                OnVideoLoadEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoLoad"),
                OnVideoProgressEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoProgress"),
                OnVideoLoadStartEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoLoadStart"),
                OnAudioTracksEvent.EVENT_NAME to MapBuilder.of("registrationName", "onAudioTracks"),
                OnTextTracksEvent.EVENT_NAME to MapBuilder.of("registrationName", "onTextTracks"),
                OnVideoTracksEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoTracks"),
                OnVideoBandwidthUpdateEvent.EVENT_NAME to MapBuilder.of("registrationName", "onBandwidthUpdate"),
                OnVideoSeekEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoSeek"),
                OnReadyForDisplayEvent.EVENT_NAME to MapBuilder.of("registrationName", "onReadyForDisplay"),
                OnVideoBufferEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoBuffer"),
                OnVideoPlaybackStateChangedEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoPlaybackStateChanged"),
                OnVideoIdleEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoIdle"),
                OnVideoEndEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoEnd"),
                OnVideoFullscreenPlayerWillPresentEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoFullscreenPlayerWillPresent"),
                OnVideoFullscreenPlayerDidPresentEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoFullscreenPlayerDidPresent"),
                OnVideoFullscreenPlayerWillDismissEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoFullscreenPlayerWillDismiss"),
                OnVideoFullscreenPlayerDidDismissEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoFullscreenPlayerDidDismiss"),
                OnVideoErrorEvent.EVENT_NAME to MapBuilder.of("registrationName", "onVideoError"),
                OnPlaybackRateChangeEvent.EVENT_NAME to MapBuilder.of("registrationName", "onPlaybackRateChange"),
                OnTimedMetadataEvent.EVENT_NAME to MapBuilder.of("registrationName", "onTimedMetadata"),
                OnAudioFocusChangedEvent.EVENT_NAME to MapBuilder.of("registrationName", "onAudioFocusChanged"),
                OnVideoAudioBecomingNoisyEvent.EVENT_NAME to MapBuilder.of("registrationName", "onAudioBecomingNoisy"),
                OnReceiveAdEventEvent.EVENT_NAME to MapBuilder.of("registrationName", "onReceiveAdEvent"),
        )
    }

    override fun receiveCommand(root: ReactExoplayerView, commandId: String?, args: ReadableArray?) {
        mDelegate.receiveCommand(root, commandId, args)
    }

    override fun onDropViewInstance(view: ReactExoplayerView) {
        view.cleanUpResources();
    }

    @ReactProp(name = "src")
    override fun setSrc(view: ReactExoplayerView?, src: ReadableMap?) {
        if (view != null && src != null) {
            val uriString = safeGetString(src, PROP_SRC_URI, null)
            val startPositionMs = safeGetInt(src, PROP_START_POSITION, -1)
            val cropStartMs = safeGetInt(src, PROP_SRC_CROP_START, -1)
            val cropEndMs = safeGetInt(src, PROP_SRC_CROP_END, -1)
            val extension = safeGetString(src, PROP_SRC_TYPE, null)
            val headers: MutableMap<String, String> = mutableMapOf()
            val propSrcHeadersArray = if (src.hasKey(PROP_SRC_HEADERS)) src.getArray(PROP_SRC_HEADERS) else null
            propSrcHeadersArray?.let {
                if (it.size() > 0) {
                    for (i in 0 until it.size()) {
                        val current = it.getMap(i)
                        val key = if (current.hasKey("key")) current.getString("key") else null
                        val value = if (current.hasKey("value")) current.getString("value") else null
                        if (key != null && value != null) {
                            headers.put(key, value)
                        }
                    }
                }
            }
            if (TextUtils.isEmpty(uriString)) {
                view.clearSrc();
                return;
            }
            if (startsWithValidScheme(uriString ?: "")) {
                val srcUri: Uri = Uri.parse(uriString)
                if (srcUri != null) {
                    view.setSrc(srcUri, startPositionMs.toLong(), cropStartMs.toLong(), cropEndMs.toLong(), extension, headers)
                }
            } else {
                val context = view.context
                var identifier = context.getResources().getIdentifier(
                        uriString,
                        "drawable",
                        context.getPackageName()
                );
                if (identifier == 0) {
                    identifier = context.getResources().getIdentifier(
                            uriString,
                            "raw",
                            context.getPackageName()
                    );
                }
                if (identifier > 0) {
                    val srcUri = RawResourceDataSource.buildRawResourceUri(identifier);
                    if (srcUri != null) {
                        view.setRawSrc(srcUri, extension);
                    }
                } else {
                    view.clearSrc();
                }
            }
        }
    }

    @ReactProp(name = "drm")
    override fun setDrm(view: ReactExoplayerView?, drm: ReadableMap?) {
        if (drm != null && drm.hasKey(PROP_DRM_TYPE)) {
            val drmType = if (drm.hasKey(PROP_DRM_TYPE)) drm.getString(PROP_DRM_TYPE) else null
            val drmLicenseServer = if (drm.hasKey(PROP_DRM_LICENSESERVER)) drm.getString(PROP_DRM_LICENSESERVER) else null
            val drmHeadersArray = if (drm.hasKey(PROP_DRM_HEADERS)) drm.getArray(PROP_DRM_HEADERS) else null
            if (drmType != null && drmLicenseServer != null && Util.getDrmUuid(drmType) != null) {
                val drmUUID = Util.getDrmUuid(drmType)
                view?.setDrmType(drmUUID)
                view?.setDrmLicenseUrl(drmLicenseServer)
                if (drmHeadersArray != null) {
                    val drmKeyRequestPropertiesList: ArrayList<String?> = ArrayList()
                    for (i in 0 until drmHeadersArray.size()) {
                        val current = drmHeadersArray.getMap(i)
                        val key = if (current.hasKey("key")) current.getString("key") else null
                        val value = if (current.hasKey("value")) current.getString("value") else null
                        drmKeyRequestPropertiesList.add(key)
                        drmKeyRequestPropertiesList.add(value)
                    }
                    view?.setDrmLicenseHeader(drmKeyRequestPropertiesList.toArray(arrayOfNulls<String>(0)))
                }
                view?.setUseTextureView(false)
            }
        }
    }

    @ReactProp(name = "adTagUrl")
    override fun setAdTagUrl(view: ReactExoplayerView?, uriString: String?) {
        if (view != null && uriString != null) {
            if (TextUtils.isEmpty(uriString)) {
                return
            }
            val adTagUrl = Uri.parse(uriString)
            view.setAdTagUrl(adTagUrl)
        }
    }

    override fun setAllowsExternalPlayback(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    @ReactProp(name = "maxBitRate")
    override fun setMaxBitRate(view: ReactExoplayerView?, maxBitRate: Float) {
        view?.setMaxBitRateModifier(maxBitRate.toInt());
    }

    @ReactProp(name = "resizeMode")
    override fun setResizeMode(view: ReactExoplayerView?, resizeModeOrdinalString: String?) {
        if (view != null && resizeModeOrdinalString != null) {
            view.setResizeModeModifier(convertToIntDef(resizeModeOrdinalString));
        }
    }

    @ReactProp(name = "repeat", defaultBoolean = false)
    override fun setRepeat(view: ReactExoplayerView?, repeat: Boolean) {
        view?.setRepeatModifier(repeat)
    }

    override fun setAutomaticallyWaitsToMinimizeStalling(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    @ReactProp(name = "textTracks")
    override fun setTextTracks(view: ReactExoplayerView?, textTracks: ReadableArray?) {
        view?.setTextTracks(textTracks);
    }

    @ReactProp(name = "selectedTextTrack")
    override fun setSelectedTextTrack(view: ReactExoplayerView?, selectedTextTrack: ReadableMap?) {
        var typeString: String? = null
        var value: Dynamic? = null
        if (selectedTextTrack != null) {
            typeString = if (selectedTextTrack.hasKey(PROP_SELECTED_TEXT_TRACK_TYPE)) selectedTextTrack.getString(PROP_SELECTED_TEXT_TRACK_TYPE) else null
            value = if (selectedTextTrack.hasKey(PROP_SELECTED_TEXT_TRACK_VALUE)) selectedTextTrack.getDynamic(PROP_SELECTED_TEXT_TRACK_VALUE) else null
        }
        view?.setSelectedTextTrack(typeString, value)
    }

    @ReactProp(name = "selectedAudioTrack")
    override fun setSelectedAudioTrack(view: ReactExoplayerView?, selectedAudioTrack: ReadableMap?) {
        var typeString: String? = null
        var value: Dynamic? = null
        if (selectedAudioTrack != null) {
            typeString = if (selectedAudioTrack.hasKey(PROP_SELECTED_AUDIO_TRACK_TYPE)) selectedAudioTrack.getString(PROP_SELECTED_AUDIO_TRACK_TYPE) else null
            value = if (selectedAudioTrack.hasKey(PROP_SELECTED_AUDIO_TRACK_VALUE)) selectedAudioTrack.getDynamic(PROP_SELECTED_AUDIO_TRACK_VALUE) else null
        }
        view?.setSelectedAudioTrack(typeString, value)
    }

    @ReactProp(name = "paused", defaultBoolean = false)
    override fun setPaused(view: ReactExoplayerView?, paused: Boolean) {
        view?.setPausedModifier(paused)
    }

    @ReactProp(name = "muted", defaultBoolean = false)
    override fun setMuted(view: ReactExoplayerView?, muted: Boolean) {
        view?.setMutedModifier(muted);
    }

    @ReactProp(name = "controls", defaultBoolean = false)
    override fun setControls(view: ReactExoplayerView?, controls: Boolean) {
        view?.setControls(controls)
    }

    override fun setFilter(view: ReactExoplayerView?, value: String?) {
        // do nothing, ios only
    }

    override fun setFilterEnabled(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    @ReactProp(name = "volume", defaultFloat = 1.0f)
    override fun setVolume(view: ReactExoplayerView?, volume: Float) {
        view?.setVolumeModifier(volume);
    }

    @ReactProp(name = "playInBackground", defaultBoolean = false)
    override fun setPlayInBackground(view: ReactExoplayerView?, playInBackground: Boolean) {
        view?.setPlayInBackground(playInBackground);
    }

    @ReactProp(name = "preventsDisplaySleepDuringVideoPlayback", defaultBoolean = false)
    override fun setPreventsDisplaySleepDuringVideoPlayback(view: ReactExoplayerView?, preventsSleep: Boolean) {
        view?.setPreventsDisplaySleepDuringVideoPlayback(preventsSleep);
    }

    override fun setPreferredForwardBufferDuration(view: ReactExoplayerView?, value: Float) {
        // do nothing, ios only
    }

    override fun setPlayWhenInactive(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    override fun setPictureInPicture(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    override fun setIgnoreSilentSwitch(view: ReactExoplayerView?, value: String?) {
        // do nothing, ios only
    }

    override fun setMixWithOthers(view: ReactExoplayerView?, value: String?) {
        // do nothing, ios only
    }

    @ReactProp(name = "rate")
    override fun setRate(view: ReactExoplayerView?, rate: Float) {
        view?.setRateModifier(rate)
    }

    @ReactProp(name = "fullscreen", defaultBoolean = false)
    override fun setFullscreen(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    override fun setFullscreenAutorotate(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    override fun setFullscreenOrientation(view: ReactExoplayerView?, value: String?) {
        // do nothing, ios only
    }

    @ReactProp(name = "progressUpdateInterval", defaultFloat = 250.0f)
    override fun setProgressUpdateInterval(view: ReactExoplayerView?, progressUpdateInterval: Float) {
        view?.setProgressUpdateInterval(progressUpdateInterval);
    }

    override fun setRestoreUserInterfaceForPIPStopCompletionHandler(view: ReactExoplayerView?, value: Boolean) {
        // do nothing, ios only
    }

    override fun setLocalSourceEncryptionKeyScheme(view: ReactExoplayerView?, value: String?) {
        // do nothing, ios only
    }

    override fun save(view: ReactExoplayerView?) {
        // do nothing, ios only
    }

    override fun seek(view: ReactExoplayerView?, time: Float, tolerance: Float) {
        // todo: what is tolerance for?
        val to = Math.round(time * 1000f)
        view?.seekTo(to.toLong());
    }

    override fun setLicenseResult(view: ReactExoplayerView?, result: String?) {
        // do nothing, ios only
    }

    override fun setLicenseResultError(view: ReactExoplayerView?, error: String?) {
        // do nothing, ios only
    }

    private fun startsWithValidScheme(uriString: String): Boolean {
        val lowerCaseUri = uriString.lowercase(Locale.getDefault())
        return (lowerCaseUri.startsWith("http://")
                || lowerCaseUri.startsWith("https://")
                || lowerCaseUri.startsWith("content://")
                || lowerCaseUri.startsWith("file://")
                || lowerCaseUri.startsWith("asset://"))
    }

    /**
     * toStringMap converts a [ReadableMap] into a HashMap.
     *
     * @param readableMap The ReadableMap to be conveted.
     * @return A HashMap containing the data that was in the ReadableMap.
     * @see 'Adapted from https://github.com/artemyarulin/react-native-eval/blob/master/android/src/main/java/com/evaluator/react/ConversionUtil.java'
     */
    fun toStringMap(@Nullable readableMap: ReadableMap?): Map<String, String?>? {
        if (readableMap == null) return null
        val iterator = readableMap.keySetIterator()
        if (!iterator.hasNextKey()) return null
        val result: MutableMap<String, String?> = HashMap()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            result[key] = readableMap.getString(key)
        }
        return result
    }

    @ResizeMode.Mode
    private fun convertToIntDef(resizeModeOrdinalString: String): Int {
        if (!TextUtils.isEmpty(resizeModeOrdinalString)) {
            if (resizeModeOrdinalString == "none") {
                return ResizeMode.toResizeMode(ResizeMode.RESIZE_MODE_FIT)
            } else if (resizeModeOrdinalString == "contain") {
                return ResizeMode.toResizeMode(ResizeMode.RESIZE_MODE_FIT)
            } else if (resizeModeOrdinalString == "cover") {
                return ResizeMode.toResizeMode(ResizeMode.RESIZE_MODE_CENTER_CROP)
            } else if (resizeModeOrdinalString == "stretch") {
                return ResizeMode.toResizeMode(ResizeMode.RESIZE_MODE_FILL)
            }
        }
        return ResizeMode.RESIZE_MODE_FIT
    }

    @ReactProp(name = "backBufferDurationMs", defaultInt = 0)
    override fun setBackBufferDurationMs(view: ReactExoplayerView?, value: Int) {
        view?.setBackBufferDurationMs(value)
    }

    @ReactProp(name = "bufferConfig")
    override fun setBufferConfig(view: ReactExoplayerView?, bufferConfig: ReadableMap?) {
        var minBufferMs = DefaultLoadControl.DEFAULT_MIN_BUFFER_MS
        var maxBufferMs = DefaultLoadControl.DEFAULT_MAX_BUFFER_MS
        var bufferForPlaybackMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS
        var bufferForPlaybackAfterRebufferMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
        var maxHeapAllocationPercent = ReactExoplayerView.DEFAULT_MAX_HEAP_ALLOCATION_PERCENT
        var minBackBufferMemoryReservePercent = ReactExoplayerView.DEFAULT_MIN_BACK_BUFFER_MEMORY_RESERVE
        var minBufferMemoryReservePercent = ReactExoplayerView.DEFAULT_MIN_BUFFER_MEMORY_RESERVE

        if (bufferConfig != null) {
            minBufferMs = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_MIN_BUFFER_MS)) bufferConfig.getInt(PROP_BUFFER_CONFIG_MIN_BUFFER_MS) else minBufferMs
            maxBufferMs = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_MAX_BUFFER_MS)) bufferConfig.getInt(PROP_BUFFER_CONFIG_MAX_BUFFER_MS) else maxBufferMs
            bufferForPlaybackMs = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS)) bufferConfig.getInt(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS) else bufferForPlaybackMs
            bufferForPlaybackAfterRebufferMs = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS)) bufferConfig.getInt(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS) else bufferForPlaybackAfterRebufferMs
            maxHeapAllocationPercent = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_MAX_HEAP_ALLOCATION_PERCENT)) bufferConfig.getDouble(PROP_BUFFER_CONFIG_MAX_HEAP_ALLOCATION_PERCENT) else maxHeapAllocationPercent
            minBackBufferMemoryReservePercent = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_MIN_BACK_BUFFER_MEMORY_RESERVE_PERCENT)) bufferConfig.getDouble(PROP_BUFFER_CONFIG_MIN_BACK_BUFFER_MEMORY_RESERVE_PERCENT) else minBackBufferMemoryReservePercent
            minBufferMemoryReservePercent = if (bufferConfig.hasKey(PROP_BUFFER_CONFIG_MIN_BUFFER_MEMORY_RESERVE_PERCENT)) bufferConfig.getDouble(PROP_BUFFER_CONFIG_MIN_BUFFER_MEMORY_RESERVE_PERCENT) else minBufferMemoryReservePercent
            view?.setBufferConfig(minBufferMs, maxBufferMs, bufferForPlaybackMs, bufferForPlaybackAfterRebufferMs, maxHeapAllocationPercent, minBackBufferMemoryReservePercent, minBufferMemoryReservePercent)
        }
    }

    @ReactProp(name = "contentStartTime", defaultInt = -1)
    override fun setContentStartTime(view: ReactExoplayerView?, value: Int) {
        view?.setContentStartTime(value)
    }

    override fun setCurrentPlaybackTime(view: ReactExoplayerView?, value: Double) {
        // do nothing
    }

    @ReactProp(name = "disableDisconnectError", defaultBoolean = false)
    override fun setDisableDisconnectError(view: ReactExoplayerView?, value: Boolean) {
        view?.setDisableDisconnectError(value)
    }

    @ReactProp(name = "focusable", defaultBoolean = true)
    override fun setFocusable(view: ReactExoplayerView?, value: Boolean) {
        view?.setFocusable(value)
    }

    @ReactProp(name = "hideShutterView", defaultBoolean = false)
    override fun setHideShutterView(view: ReactExoplayerView?, value: Boolean) {
        view?.setHideShutterView(value)
    }

    @ReactProp(name = "minLoadRetryCount")
    override fun setMinLoadRetryCount(view: ReactExoplayerView?, value: Int) {
        view?.setMinLoadRetryCountModifier(value)
    }

    @ReactProp(name = "reportBandwidth", defaultBoolean = false)
    override fun setReportBandwidth(view: ReactExoplayerView?, value: Boolean) {
        view?.setReportBandwidth(value)
    }

    @ReactProp(name = "selectedVideoTrack")
    override fun setSelectedVideoTrack(view: ReactExoplayerView?, selectedVideoTrack: ReadableMap?) {
        var typeString: String? = null
        var value: Dynamic? = null
        if (selectedVideoTrack != null) {
            typeString = if (selectedVideoTrack.hasKey(PROP_SELECTED_VIDEO_TRACK_TYPE)) selectedVideoTrack.getString(PROP_SELECTED_VIDEO_TRACK_TYPE) else null
            value = if (selectedVideoTrack.hasKey(PROP_SELECTED_VIDEO_TRACK_VALUE)) selectedVideoTrack.getDynamic(PROP_SELECTED_VIDEO_TRACK_VALUE) else null
        }
        view?.setSelectedVideoTrack(typeString, value)
    }

    @ReactProp(name = "subtitleStyle")
    override fun setSubtitleStyle(view: ReactExoplayerView?, subtitleStyle: ReadableMap?) {
        view?.setSubtitleStyle(SubtitleStyle.parse(subtitleStyle));
    }

    override fun setTrackId(view: ReactExoplayerView?, value: String?) {
        // do nothing
    }

    @ReactProp(name = "useTextureView", defaultBoolean = true)
    override fun setUseTextureView(view: ReactExoplayerView?, value: Boolean) {
        view?.setUseTextureView(value)
    }

    @ReactProp(name = "useSecureView", defaultBoolean = true)
    override fun setUseSecureView(view: ReactExoplayerView?, value: Boolean) {
        view?.useSecureView(value)
    }

    override fun setDebug(view: ReactExoplayerView?, value: ReadableMap?) {
        TODO("Not yet implemented")
    }
}
