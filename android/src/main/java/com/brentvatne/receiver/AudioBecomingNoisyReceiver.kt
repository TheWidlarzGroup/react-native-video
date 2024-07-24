package com.brentvatne.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import androidx.core.content.ContextCompat;

public class AudioBecomingNoisyReceiver extends BroadcastReceiver {
    private BecomingNoisyListener listener = BecomingNoisyListener.NO_OP;
    private final Context appContext;

    public AudioBecomingNoisyReceiver(Context context) {
        this.appContext = context.getApplicationContext();
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
            listener.onAudioBecomingNoisy();
        }
    }

    public void setListener(BecomingNoisyListener listener) {
        this.listener = listener;
        IntentFilter intentFilter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        try {
            ContextCompat.registerReceiver(appContext, this, intentFilter, ContextCompat.RECEIVER_NOT_EXPORTED);
        } catch (Exception e) {
            // Handle the exception and log it, but do not crash the app
            e.printStackTrace();
        }
    }

    public void removeListener() {
        this.listener = BecomingNoisyListener.NO_OP;
        try {
            appContext.unregisterReceiver(this);
        } catch (Exception ignore) {
            // Ignore if already unregistered
        }
    }
}
