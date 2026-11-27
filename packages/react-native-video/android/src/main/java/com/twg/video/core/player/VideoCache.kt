package com.twg.video.core.player

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File

/**
 * The on-disk cache behind `shouldCache`.
 *
 * One cache for the whole process: Media3 allows a single [SimpleCache] per directory, and
 * creating a second one for the same folder throws.
 */
@OptIn(UnstableApi::class)
object VideoCache {
  private const val DIRECTORY = "RNVCache"

  /** Least recently used files are evicted above this size. */
  private const val MAX_BYTES = 100L * 1024 * 1024

  private var cache: SimpleCache? = null

  @Synchronized
  private fun get(context: Context): SimpleCache {
    cache?.let { return it }

    val appContext = context.applicationContext
    return SimpleCache(
      File(appContext.cacheDir, DIRECTORY),
      LeastRecentlyUsedCacheEvictor(MAX_BYTES),
      StandaloneDatabaseProvider(appContext)
    ).also { cache = it }
  }

  /**
   * Wraps [upstream] so that what it downloads is written to the cache and read from it next time.
   * A cache that cannot be read or written never fails playback: the request goes upstream.
   */
  fun wrap(context: Context, upstream: DataSource.Factory): DataSource.Factory {
    return CacheDataSource.Factory()
      .setCache(get(context))
      .setUpstreamDataSourceFactory(upstream)
      .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
  }
}
