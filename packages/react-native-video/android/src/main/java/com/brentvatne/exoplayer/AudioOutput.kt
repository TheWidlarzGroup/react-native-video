package com.brentvatne.exoplayer

import android.annotation.SuppressLint
import androidx.media3.common.C

@SuppressLint("InlinedApi")
enum class AudioOutput(private val outputName: String, @C.StreamType val streamType: Int) {

    SPEAKER("speaker", C.STREAM_TYPE_MUSIC),
    EARPIECE("earpiece", C.STREAM_TYPE_VOICE_CALL);

    companion object {
        @JvmStatic
        fun get(name: String): AudioOutput {
            for (entry in values()) {
                if (entry.outputName.equals(name, ignoreCase = true)) {
                    return entry
                }
            }
            return SPEAKER
        }
    }

    override fun toString(): String = "${javaClass.simpleName}($outputName, $streamType)"
}
