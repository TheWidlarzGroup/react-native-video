package com.brentvatne.datazoom

import androidx.media3.exoplayer.ExoPlayer
import io.datazoom.sdk.Config.Builder
import io.datazoom.sdk.Datazoom
import io.datazoom.sdk.logs.LogLevel
import io.datazoom.sdk.media3.createContext
import java.lang.Thread.sleep
import kotlin.concurrent.thread

object DatazoomManager {
    fun init(configId: String) {
        Datazoom.init(config = Builder(configId)
            .isProduction(true)
            .logLevel(LogLevel.VERBOSE)
            .build())
    }

    fun createContext(exoPlayer: ExoPlayer) = Datazoom.createContext(exoPlayer)
}
