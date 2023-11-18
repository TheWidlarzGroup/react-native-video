package com.brentvatne.exoplayer;

import androidx.media3.common.C;
import androidx.media3.datasource.HttpDataSource.HttpDataSourceException;
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy;

public final class ReactExoplayerLoadErrorHandlingPolicy extends DefaultLoadErrorHandlingPolicy {
    private final int minLoadRetryCount;

    public ReactExoplayerLoadErrorHandlingPolicy(int minLoadRetryCount) {
        super(minLoadRetryCount);
        this.minLoadRetryCount = minLoadRetryCount;
    }

    @Override
    public long getRetryDelayMsFor(LoadErrorInfo loadErrorInfo) {
        String errorMessage = loadErrorInfo.exception.getMessage();

        if (
                loadErrorInfo.exception instanceof HttpDataSourceException &&
                        errorMessage != null && (errorMessage.equals("Unable to connect") || errorMessage.equals("Software caused connection abort"))
        ) {
            // Capture the error we get when there is no network connectivity and keep retrying it
            return 1000; // Retry every second
        } else if(loadErrorInfo.errorCount < this.minLoadRetryCount) {
            return Math.min((loadErrorInfo.errorCount - 1) * 1000, 5000); // Default timeout handling
        } else {
            return C.TIME_UNSET; // Done retrying and will return the error immediately
        }
    }

    @Override
    public int getMinimumLoadableRetryCount(int dataType) {
        return Integer.MAX_VALUE;
    }
}
