package com.brentvatne.react

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.brentvatne.exoplayer.ReactExoplayerView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerModule
import kotlin.math.roundToInt

class VideoManagerModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return REACT_CLASS
    }

    private fun performOnPlayerView(reactTag: Int, callback: (ReactExoplayerView?) -> Unit) {
        UiThreadUtil.runOnUiThread {
            val view = if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
                reactApplicationContext.fabricUIManager?.resolveView(
                    reactTag
                )
            } else {
                val uiManager = reactApplicationContext.getNativeModule(UIManagerModule::class.java)
                uiManager?.resolveView(reactTag)
            }

            if (view is ReactExoplayerView) {
                callback(view)
            } else {
                callback(null)
            }
        }
    }

    @ReactMethod
    fun setPlayerPauseState(paused: Boolean?, reactTag: Int) {
        performOnPlayerView(reactTag) {
            it?.setPausedModifier(paused!!)
        }
    }

    @ReactMethod
    fun seek(info: ReadableMap, reactTag: Int) {
        if (!info.hasKey("time")) {
            return
        }

        val time = ReactBridgeUtils.safeGetInt(info, "time")
        performOnPlayerView(reactTag) {
            it?.seekTo((time * 1000f).roundToInt().toLong())
        }
    }

    @ReactMethod
    fun setMuted(muted: Boolean, reactTag: Int) {
        performOnPlayerView(reactTag) {
            it?.setMutedModifier(muted)
        }
    }

    companion object {
        private const val REACT_CLASS = "VideoManager"
    }
}
