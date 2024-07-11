package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import androidx.media3.common.C

@SuppressLint("InlinedApi")
enum class AudioOutput(private val mName: String, @C.StreamType val streamType: Int) {

    SPEAKER("speaker", C.STREAM_TYPE_MUSIC),
    EARPIECE("earpiece", C.STREAM_TYPE_VOICE_CALL);

    companion object {
        @JvmStatic
        fun get(name: String): AudioOutput {
            for (d in entries) {
                if (d.mName.equals(name, ignoreCase = true)) {
                    return d
                }
            }
            return SPEAKER
        }
    }

    override fun toString(): String = "${javaClass.simpleName}($mName, $streamType)"
}
