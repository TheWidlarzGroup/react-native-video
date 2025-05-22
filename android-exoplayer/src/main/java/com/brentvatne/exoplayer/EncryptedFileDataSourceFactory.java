package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;

import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.TransferListener;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.security.crypto.EncryptedFile;
import androidx.security.crypto.MasterKey;
import com.brentvatne.exoplayer.EncryptedFileDataSource;

public class EncryptedFileDataSourceFactory implements DataSource.Factory {

    Context mContext;

    public EncryptedFileDataSourceFactory(Context context) {
        mContext = context;
    }

    @Override
    public DataSource createDataSource() {
        return new EncryptedFileDataSource(mContext);
    }
}
