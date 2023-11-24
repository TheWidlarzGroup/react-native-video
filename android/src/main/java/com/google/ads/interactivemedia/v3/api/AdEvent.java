package com.google.ads.interactivemedia.v3.api;

import androidx.annotation.InspectableProperty;

public abstract class AdEvent {
    public abstract InspectableProperty getType();
    public abstract InspectableProperty getAdData();

    public interface AdEventListener {
        public void onAdEvent(AdEvent adEvent);
    }
}
