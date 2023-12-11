package com.brentvatne.exoplayer;

import android.content.Context;

import androidx.media3.datasource.DataSource;
import androidx.media3.datasource.RawResourceDataSource;

class RawResourceDataSourceFactory implements DataSource.Factory {

    private final Context context;

    RawResourceDataSourceFactory(Context context) {
        this.context = context;
    }

    @Override
    public DataSource createDataSource() {
        return new RawResourceDataSource(context);
    }
}
