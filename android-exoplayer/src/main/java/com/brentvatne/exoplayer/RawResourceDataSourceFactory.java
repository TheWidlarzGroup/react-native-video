package com.brentvatne.exoplayer;

import android.content.Context;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.RawResourceDataSource;

class RawResourceDataSourceFactory implements DataSource.Factory {

    private final Context context;

    RawResourceDataSourceFactory(Context context) {
        this.context = context;
    }

    @Override
    public DataSource createDataSource() {
        return new RawResourceDataSource(context, null);
    }
}
