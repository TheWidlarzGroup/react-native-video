package com.brentvatne.exoplayer

import android.content.Context
import android.net.Uri
import androidx.media3.common.util.Util
import androidx.media3.datasource.AssetDataSource
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import okhttp3.Call
import okhttp3.JavaNetCookieJar
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

object DataSourceUtil {
    private var defaultDataSourceFactory: DataSource.Factory? = null
    private var defaultHttpDataSourceFactory: HttpDataSource.Factory? = null
    private var userAgent: String? = null

    private fun sendLogToReact(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    private fun getUserAgent(context: ReactContext): String {
        if (userAgent == null) {
            userAgent = Util.getUserAgent(context, context.packageName)
        }
        return userAgent as String
    }

    @JvmStatic
    fun getDefaultDataSourceFactory(context: ReactContext, bandwidthMeter: DefaultBandwidthMeter?, requestHeaders: Map<String, String>?): DataSource.Factory {
        if (defaultDataSourceFactory == null || !requestHeaders.isNullOrEmpty()) {
            defaultDataSourceFactory = buildDataSourceFactory(context, bandwidthMeter, requestHeaders)
        }
        return defaultDataSourceFactory as DataSource.Factory
    }

    @JvmStatic
    fun getDefaultHttpDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?
    ): HttpDataSource.Factory {
        if (defaultHttpDataSourceFactory == null || !requestHeaders.isNullOrEmpty()) {
            defaultHttpDataSourceFactory = buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders)
        }
        return defaultHttpDataSourceFactory as HttpDataSource.Factory
    }

    private fun buildDataSourceFactory(context: Context, bandwidthMeter: DefaultBandwidthMeter?, requestHeaders: Map<String, String>?): DataSource.Factory {
        val okHttpClient = buildUnsafeOkHttpClient()
        val okHttpFactory = OkHttpDataSource.Factory(okHttpClient)
        if (requestHeaders != null) {
            okHttpFactory.setDefaultRequestProperties(requestHeaders)
        }
        return DefaultDataSource.Factory(context, okHttpFactory)
    }

    private fun buildUnsafeOkHttpClient(): OkHttpClient {
        val trustAllCerts = arrayOf<TrustManager>(
            object : X509TrustManager {
                override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
                override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            }
        )

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, trustAllCerts, SecureRandom())

        return OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
            .hostnameVerifier(HostnameVerifier { _, _ -> true })
            .addInterceptor(HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BODY))
            .build()
    }

    private fun buildHttpDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?
    ): HttpDataSource.Factory {
        val client = OkHttpClientProvider.getOkHttpClient()
        val container = client.cookieJar as CookieJarContainer
        val handler = ForwardingCookieHandler(context)
        container.setCookieJar(JavaNetCookieJar(handler))
        val okHttpDataSourceFactory = OkHttpDataSource.Factory(client as Call.Factory)
            .setTransferListener(bandwidthMeter)

        if (requestHeaders != null) {
            okHttpDataSourceFactory.setDefaultRequestProperties(requestHeaders)
            if (!requestHeaders.containsKey("User-Agent")) {
                okHttpDataSourceFactory.setUserAgent(getUserAgent(context))
            }
        } else {
            okHttpDataSourceFactory.setUserAgent(getUserAgent(context))
        }

        return okHttpDataSourceFactory
    }

    @JvmStatic
    fun buildAssetDataSourceFactory(context: ReactContext?, srcUri: Uri?): DataSource.Factory {
        val dataSpec = DataSpec(srcUri!!)
        val rawResourceDataSource = AssetDataSource(context!!)
        rawResourceDataSource.open(dataSpec)
        return DataSource.Factory { rawResourceDataSource }
    }
}
