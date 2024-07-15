package com.brentvatne.exoplayer

import androidx.media3.common.C
import androidx.media3.datasource.HttpDataSource.HttpDataSourceException
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy.LoadErrorInfo
import kotlin.math.min

class ReactExoplayerLoadErrorHandlingPolicy(private val minLoadRetryCount: Int) : DefaultLoadErrorHandlingPolicy(minLoadRetryCount) {
    override fun getRetryDelayMsFor(loadErrorInfo: LoadErrorInfo): Long {
        val errorMessage: String? = loadErrorInfo.exception.message

        return if (loadErrorInfo.exception is HttpDataSourceException &&
            errorMessage != null &&
            (errorMessage == "Unable to connect" || errorMessage == "Software caused connection abort")
        ) {
            // Capture the error we get when there is no network connectivity and keep retrying it
            1000 // Retry every second
        } else if (loadErrorInfo.errorCount < minLoadRetryCount) {
            min(((loadErrorInfo.errorCount - 1) * 1000L), 5000L) // Default timeout handling
        } else {
            C.TIME_UNSET // Done retrying and will return the error immediately
        }
    }

    override fun getMinimumLoadableRetryCount(dataType: Int): Int = Int.MAX_VALUE
}
