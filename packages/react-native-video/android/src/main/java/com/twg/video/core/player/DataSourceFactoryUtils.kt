package com.twg.video.core.player

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import com.margelo.nitro.video.HybridVideoPlayerSourceSpec
import okhttp3.JavaNetCookieJar

/**
 * @param useCache write what is downloaded to [VideoCache] and read it from there next time.
 * Only network sources are cached.
 */
fun buildBaseDataSourceFactory(
  context: Context,
  source: HybridVideoPlayerSourceSpec,
  useCache: Boolean = false
): DefaultDataSource.Factory {
  return if (source.uri.startsWith("http")) {
    val httpDataSourceFactory = buildHttpDataSourceFactory(context, source)
    DefaultDataSource.Factory(
      context,
      if (useCache) {
        VideoCache.wrap(context, httpDataSourceFactory, source.config.headers)
      } else {
        httpDataSourceFactory
      }
    )
  } else {
    DefaultDataSource.Factory(context)
  }
}

@OptIn(UnstableApi::class)
fun buildHttpDataSourceFactory(context: Context, source: HybridVideoPlayerSourceSpec): OkHttpDataSource.Factory {
  val client = OkHttpClientProvider.getOkHttpClient()

  if (context is ReactContext) {
    val handler = ForwardingCookieHandler(context)
    (client.cookieJar as CookieJarContainer).setCookieJar(JavaNetCookieJar(handler))
  }

  val factory = OkHttpDataSource.Factory(client)

  val headers: Map<String, String>? = source.config.headers

  if (headers != null) {
    factory.setDefaultRequestProperties(headers)
  }

  if (headers == null || !headers.containsKey("User-Agent")) {
    factory.setUserAgent(getUserAgent(context))
  }

  return factory
}

@OptIn(UnstableApi::class)
fun getUserAgent(context: Context): String {
  return Util.getUserAgent(context, context.packageName)
}
