package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.FileDataSource;

class FileDataSourceFactory implements DataSource.Factory {

    private final Uri uri;

    FileDataSourceFactory(Uri uri) {
        this.uri = uri;
    }

    @Override
    public DataSource createDataSource() {
        DataSpec dataSpec = new DataSpec(uri);
        FileDataSource fileDataSource = new FileDataSource();
        try {
            fileDataSource.open(dataSpec);
        } catch (FileDataSource.FileDataSourceException e) {
            // file at the URI could not be found / opened
            return null;
        }

        return fileDataSource;
    }
}
