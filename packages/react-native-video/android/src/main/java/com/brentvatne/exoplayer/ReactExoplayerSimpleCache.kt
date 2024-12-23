package com.brentvatne.exoplayer

import android.content.Context
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File

object RNVSimpleCache {
    // TODO: when to release? how to check if cache is released?
    private var simpleCache: SimpleCache? = null

    fun setSimpleCache(context: Context, cacheSize: Int) {
        if (simpleCache != null || cacheSize <= 0) return
        simpleCache = SimpleCache(
            File(context.cacheDir, "RNVCache"),
            LeastRecentlyUsedCacheEvictor(
                cacheSize.toLong() * 1024 * 1024
            ),
            StandaloneDatabaseProvider(context)
        )
    }

    fun getCacheFactory(factory: HttpDataSource.Factory): DataSource.Factory {
        if (simpleCache == null) return factory
        return CacheDataSource.Factory()
            .setCache(simpleCache!!)
            .setUpstreamDataSourceFactory(factory)
    }
}
