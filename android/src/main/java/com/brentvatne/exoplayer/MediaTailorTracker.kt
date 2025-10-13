package com.brentvatne.exoplayer

import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import android.util.Log
import okhttp3.Response

class MediaTailorTracker private constructor() {

    companion object {
        @Volatile
        private var instance: MediaTailorTracker? = null

        fun getInstance(): MediaTailorTracker {
            return instance ?: synchronized(this) {
                instance ?: MediaTailorTracker().also { instance = it }
            }
        }
    }

    private val client = OkHttpClient()
    private val activePollingJobs = mutableMapOf<String, Job>()
    private val pollingIntervalMs = 6000L

    @Synchronized
    fun startPolling(trackingUrl: String) {
        if (trackingUrl.isEmpty()) {
            Log.w("MediaTailorSDK", "Tracking URL empty, skipping polling")
            return;
        }

        // Cancel existing job for this URL if any
        activePollingJobs[trackingUrl]?.cancel()

        val job = CoroutineScope(Dispatchers.IO).launch {
            try {
                while (isActive) {
                    Log.d("MediaTailorSDK", "Polling check: trackingUrl=$trackingUrl")
                    sendTrackingPing(trackingUrl)
                    delay(pollingIntervalMs)
                }
            } catch (e: CancellationException) {
                Log.i("MediaTailorSDK", "Polling job cancelled for $trackingUrl")
            }
        }

        activePollingJobs[trackingUrl] = job
        Log.i("MediaTailorSDK", "Started polling tracking URL: $trackingUrl")
    }

    @Synchronized
    fun stopPolling() {
        activePollingJobs.forEach { (url, job) ->
            if (job.isActive) {
                job.cancel()
                Log.i("MediaTailorSDK", "Stopped polling tracking URL: $url")
            }
        }
        activePollingJobs.clear()
    }

    private fun sendTrackingPing(trackingUrl: String) {
        val request = Request.Builder().url(trackingUrl).build()
        client.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                Log.e("MediaTailorSDK", "Tracking ping failed for $trackingUrl: ${e.message}")
            }

            override fun onResponse(call: okhttp3.Call, response: Response) {
                Log.i("MediaTailorSDK", "Tracking response code=${response.code}, response=${response.body?.string()}")
                response.close()
            }
        })
    }
}
