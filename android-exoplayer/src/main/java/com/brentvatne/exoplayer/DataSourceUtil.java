package com.brentvatne.exoplayer;

import android.content.Context;
import android.util.ArrayMap;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.google.android.exoplayer2.ext.okhttp.OkHttpDataSourceFactory;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.upstream.HttpDataSource;
import com.google.android.exoplayer2.util.Util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class DataSourceUtil {

    private DataSourceUtil() {
    }

    private static DataSource.Factory rawDataSourceFactory = null;
    private static DataSource.Factory defaultDataSourceFactory = null;
    private static String userAgent = null;

    public static void setUserAgent(String userAgent) {
        DataSourceUtil.userAgent = userAgent;
    }

    public static String getUserAgent(Context context) {
        if (userAgent == null) {
            userAgent = Util.getUserAgent(context.getApplicationContext(), "ReactNativeVideo");
        }
        return userAgent;
    }

    public static DataSource.Factory getRawDataSourceFactory(Context context) {
        if (rawDataSourceFactory == null) {
            rawDataSourceFactory = buildRawDataSourceFactory(context);
        }
        return rawDataSourceFactory;
    }

    public static void setRawDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.rawDataSourceFactory = factory;
    }

    public static DataSource.Factory getDefaultDataSourceFactory(Context context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        if (defaultDataSourceFactory == null || !requestHeaders.isEmpty()) {
            defaultDataSourceFactory = buildDataSourceFactory(context, bandwidthMeter, requestHeaders);
        }
        return defaultDataSourceFactory;
    }

    public static void setDefaultDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.defaultDataSourceFactory = factory;
    }

    private static DataSource.Factory buildRawDataSourceFactory(Context context) {
        return new RawResourceDataSourceFactory(context.getApplicationContext());
    }

    private static DataSource.Factory buildDataSourceFactory(Context context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        Context appContext = context.getApplicationContext();
        return new DefaultDataSourceFactory(appContext, bandwidthMeter,
                buildHttpDataSourceFactory(appContext, bandwidthMeter, requestHeaders));
    }

    private static HttpDataSource.Factory buildHttpDataSourceFactory(Context context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        OkHttpDataSourceFactory okHttpDataSourceFactory = new OkHttpDataSourceFactory(OkHttpClientProvider.getOkHttpClient(), getUserAgent(context), bandwidthMeter);

        if (requestHeaders != null)
            okHttpDataSourceFactory.getDefaultRequestProperties().set(requestHeaders);

        return okHttpDataSourceFactory;
    }
}
