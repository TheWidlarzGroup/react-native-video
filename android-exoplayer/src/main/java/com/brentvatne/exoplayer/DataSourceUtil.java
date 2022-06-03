package com.brentvatne.exoplayer;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.network.CookieJarContainer;
import com.facebook.react.modules.network.ForwardingCookieHandler;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.google.android.exoplayer2.database.ExoDatabaseProvider;
import com.google.android.exoplayer2.ext.okhttp.OkHttpDataSourceFactory;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.upstream.HttpDataSource;
import com.google.android.exoplayer2.upstream.cache.CacheDataSource;
import com.google.android.exoplayer2.upstream.cache.CacheEvictor;
import com.google.android.exoplayer2.upstream.cache.SimpleCache;
import com.google.android.exoplayer2.util.Util;

import okhttp3.JavaNetCookieJar;
import okhttp3.OkHttpClient;

import java.io.File;
import java.util.Map;

public class DataSourceUtil {

    private DataSourceUtil() {
    }

    private static DataSource.Factory rawDataSourceFactory = null;
    private static DataSource.Factory defaultDataSourceFactory = null;
    private static DataSource.Factory cachedDataSourceFactory = null;
    private static HttpDataSource.Factory defaultHttpDataSourceFactory = null;
    private static SimpleCache cache = null;
    private static String userAgent = null;

    public static void setUserAgent(String userAgent) {
        DataSourceUtil.userAgent = userAgent;
    }

    public static String getUserAgent(ReactContext context) {
        if (userAgent == null) {
            userAgent = Util.getUserAgent(context, "ReactNativeVideo");
        }
        return userAgent;
    }

    public static DataSource.Factory getRawDataSourceFactory(ReactContext context) {
        if (rawDataSourceFactory == null) {
            rawDataSourceFactory = buildRawDataSourceFactory(context);
        }
        return rawDataSourceFactory;
    }

    public static SimpleCache getCache(ReactContext context, File cacheDir, CacheEvictor cacheEvictor) {
        if (cache == null) {
            cache = buildCache(context, cacheDir, cacheEvictor);
        }
        return cache;
    }

    public static void setRawDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.rawDataSourceFactory = factory;
    }


    public static DataSource.Factory getDefaultDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        if (defaultDataSourceFactory == null || (requestHeaders != null && !requestHeaders.isEmpty())) {
            defaultDataSourceFactory = buildDataSourceFactory(context, bandwidthMeter, requestHeaders);
        }
        return defaultDataSourceFactory;
    }

    public static void setDefaultDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.defaultDataSourceFactory = factory;
    }

    public static DataSource.Factory getCachedDataSourceFactory(ReactContext context, DataSource.Factory upstreamDataSourceFactory, File cacheDir, CacheEvictor cacheEvictor) {
        if (cachedDataSourceFactory == null) {
            cachedDataSourceFactory = buildCachedDataSourceFactory(context, upstreamDataSourceFactory, cacheDir, cacheEvictor);
        }
        return cachedDataSourceFactory;
    }

    public static void SetCachedDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.cachedDataSourceFactory = factory;
    }

    public static HttpDataSource.Factory getDefaultHttpDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        if (defaultHttpDataSourceFactory == null || (requestHeaders != null && !requestHeaders.isEmpty())) {
            defaultHttpDataSourceFactory = buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders);
        }
        return defaultHttpDataSourceFactory;
    }

    public static void setDefaultHttpDataSourceFactory(HttpDataSource.Factory factory) {
        DataSourceUtil.defaultHttpDataSourceFactory = factory;
    }

    private static DataSource.Factory buildRawDataSourceFactory(ReactContext context) {
        return new RawResourceDataSourceFactory(context.getApplicationContext());
    }

    private static DataSource.Factory buildDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        return new DefaultDataSourceFactory(context, bandwidthMeter,
                buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders));
    }

    private static DataSource.Factory buildCachedDataSourceFactory(ReactContext context, DataSource.Factory upstreamDataSourceFactory, File cacheDir, CacheEvictor cacheEvictor) {
        return new CacheDataSource.Factory()
                .setCache(getCache(context, cacheDir, cacheEvictor))
                .setUpstreamDataSourceFactory(upstreamDataSourceFactory);
    }

    private static SimpleCache buildCache(ReactContext context, File cacheDir, CacheEvictor cacheEvictor) {
        ExoDatabaseProvider databaseProvider = new ExoDatabaseProvider(context);
        return new SimpleCache(cacheDir, cacheEvictor, databaseProvider);
    }

    private static HttpDataSource.Factory buildHttpDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        OkHttpClient client = OkHttpClientProvider.getOkHttpClient();
        CookieJarContainer container = (CookieJarContainer) client.cookieJar();
        ForwardingCookieHandler handler = new ForwardingCookieHandler(context);
        container.setCookieJar(new JavaNetCookieJar(handler));
        OkHttpDataSourceFactory okHttpDataSourceFactory = new OkHttpDataSourceFactory(client, getUserAgent(context), bandwidthMeter);

        if (requestHeaders != null)
            okHttpDataSourceFactory.getDefaultRequestProperties().set(requestHeaders);

        return okHttpDataSourceFactory;
    }
}
