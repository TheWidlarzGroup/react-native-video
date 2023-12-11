package com.google.ads.interactivemedia.v3.api;

import androidx.annotation.InspectableProperty;

import java.util.Map;

public abstract class AdEvent {
    public abstract InspectableProperty getType();
    public abstract Map<String, String> getAdData();

    public interface AdEventListener {
        public void onAdEvent(AdEvent adEvent);
    }
}
