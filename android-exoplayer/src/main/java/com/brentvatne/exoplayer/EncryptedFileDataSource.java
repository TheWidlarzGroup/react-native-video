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

public final class EncryptedFileDataSource implements DataSource {

    Context mContext;

    EncryptedFileDataSource(Context context) {
        mContext = context;
    }

    private TransferListener mTransferListener;
    private FileInputStream mInputStream;
    private Uri mUri;
    private boolean mOpened;

    @Override
    public void addTransferListener(@NonNull TransferListener transferListener) {
        mTransferListener = transferListener;
    }

    @Override
    public long open(@NonNull DataSpec dataSpec) throws IOException {
        if (mOpened) {
            return C.LENGTH_UNSET;
        }
        mUri = dataSpec.uri;
        try {
            setupInputStream();
            skipToPosition(dataSpec);
        } catch (IOException e) {
            throw e;
        }catch (GeneralSecurityException e) {

        }
        mOpened = true;
        if (mTransferListener != null) {
            mTransferListener.onTransferStart(this, dataSpec, false);
        }
        return C.LENGTH_UNSET;
    }

    private void setupInputStream() throws IOException, GeneralSecurityException {
        MasterKey mainKey = new MasterKey.Builder(mContext.getApplicationContext())
          .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
          .build();
        EncryptedFile encryptedFile = new EncryptedFile.Builder(mContext,
                                                                new File(mUri.getPath()),
                                                                mainKey,
                                                                EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
        ).build();
        mInputStream = encryptedFile.openFileInput();
    }

    private void skipToPosition(DataSpec dataSpec) throws IOException {
        mInputStream.skip(dataSpec.position);
    }

    @Nullable
    @Override
    public Uri getUri() {
        return mUri;
    }

    @Override
    public void close() throws IOException {
        mUri = null;
        try {
            if (mInputStream != null) {
                mInputStream.close();
            }
        } catch (IOException e) {
            throw new EncryptedDataSource.EncryptedFileDataSourceException(e);
        } finally {
            mInputStream = null;
            if (mOpened) {
                mOpened = false;
                if (mTransferListener != null) {
                    mTransferListener.onTransferEnd(this, null, false);
                }
            }
        }
    }

    @Override
    public int read(byte[] buffer, int offset, int readLength) throws IOException {
        // fast-fail if there's 0 quantity requested or we think we've already processed everything
        if (readLength == 0) {
            return 0;
        }
        // constrain the read length and try to read from the cipher input stream
        int bytesToRead = getBytesToRead(readLength);
        int bytesRead;
        try {
            bytesRead = mInputStream.read(buffer, offset, bytesToRead);
        } catch (IOException e) {
            throw new EncryptedDataSource.EncryptedFileDataSourceException(e);
        }
        // if we get a -1 that means we failed to read - we're either going to EOF error or broadcast EOF
        if (bytesRead == -1) {
            return C.RESULT_END_OF_INPUT;
        }
        // we can't decrement bytes remaining if it's just a flag representation (as opposed to a mutable numeric quantity)
//        if (mBytesRemaining != C.LENGTH_UNSET) {
//            mBytesRemaining -= bytesRead;
//        }
        // notify
        if (mTransferListener != null) {
            mTransferListener.onBytesTransferred(this,null,  false, bytesRead);
        }
        // report
        return bytesRead;
    }

    private int getBytesToRead(int bytesToRead) {
        return bytesToRead;
    }
}
<<<<<<< HEAD
=======

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
>>>>>>> 4c0efb62 (Update EncryptedFileDataSource.java)
