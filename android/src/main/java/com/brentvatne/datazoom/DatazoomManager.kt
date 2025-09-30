package com.brentvatne.datazoom

import androidx.media3.exoplayer.ExoPlayer
import io.datazoom.sdk.Config.Builder
import io.datazoom.sdk.Datazoom
import io.datazoom.sdk.DzAdapter
import io.datazoom.sdk.logs.LogLevel
import io.datazoom.sdk.media3.createContext

object DatazoomManager {
    @JvmStatic
    fun init(configId: String) {
        Datazoom.init(config = Builder(configId)
            .isProduction(true)
            .logLevel(LogLevel.VERBOSE)
            .build())
    }
    @JvmStatic
    fun createContext(exoPlayer: ExoPlayer) : DzAdapter = Datazoom.createContext(exoPlayer)
    @JvmStatic
    fun releaseContext(id: String) = Datazoom.removeContext(id)
    @JvmStatic
    fun releaseContext(adapter: DzAdapter) = Datazoom.removeContext(adapter)
}

