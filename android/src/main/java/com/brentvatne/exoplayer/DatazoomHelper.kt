package com.brentvatne.exoplayer

import android.util.Log
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.amazon.mediatailorsdk.Session
import com.amazon.mediatailorsdk.SessionUiEvent
import io.datazoom.sdk.Config
import io.datazoom.sdk.Datazoom
import io.datazoom.sdk.DzAdapter
import io.datazoom.sdk.SdkEvent
import io.datazoom.sdk.logs.LogLevel
import io.datazoom.sdk.media3.createContext
import io.datazoom.sdk.mediatailor.setupAdSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

object DatazoomHelper {

    private var adapter: DzAdapter? = null

    fun initializeDatazoom(player: ExoPlayer) {
        Log.i("MediaTailorSDK", "Initializing Datazoom SDK...")
        Datazoom.init(
            Config.build(
                configurationId = "8f5d1620-5d27-40da-80a2-d397d7574bf4",
                block = {
                    logLevel(LogLevel.DEBUG)
                }
            )
        )
        adapter = Datazoom.createContext(player)

        if (adapter != null) {
            Log.i("MediaTailorSDK", "✅ Datazoom initialized successfully and adapter created $adapter")
        } else {
            Log.e("MediaTailorSDK", "❌ Datazoom initialization failed, adapter is NULL")
        }

        CoroutineScope(Dispatchers.Main).launch() {
            Datazoom.sdkEvents.collect { event ->
                when (event) {
                    is SdkEvent.SdkInit -> {
                        Log.i("MediaTailorSDK", "✅ Datazoom SDK fully initialized: ${event.apiKey}, ${event.data}")
                    }
                    is SdkEvent.SdkError -> {
                        Log.e("MediaTailorSDK", "❌ Datazoom SDK error: ${event.exception}")
                    }
                }
            }
        }
    }

    fun setupAdSession(session: Session, playerView: PlayerView, contentUrl: String) {
        try {
            if (adapter == null) {
                Log.e("MediaTailorSDK", "❌ Cannot setupAdSession: Datazoom adapter is NULL, Datazoom not initialized properly")
                return
            }

            adapter?.setupAdSession(session, playerView, contentUrl)
            Log.i("MediaTailorSDK", "setupAdSession completed successfully")
            val metadata: Map<String, Any> = adapter!!.getMetadata()
            Log.d("MediaTailorSDK", "metaData: $metadata")

            session.addUiEventListener(SessionUiEvent.AD_START) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.AD_END) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.AD_PROGRESS) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.AD_CLICK) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.AD_CAN_SKIP) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.AD_INCOMING) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.NONLINEAR_AD_START) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.NONLINEAR_AD_END) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
            session.addUiEventListener(SessionUiEvent.AD_TRACKING_INFO_RESPONSE) { event, eventData ->
                Log.d("MediaTailorSDK", "📢 Ad Event: $event | data: $eventData")
            }
        } catch (e: Exception) {
            Log.e("MediaTailorSDK", "Failed to setupAdSession: ${e.message}")
            throw e
        }
    }
}
