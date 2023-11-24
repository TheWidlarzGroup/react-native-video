package com.google.ads.interactivemedia.v3.api;

public abstract class AdErrorEvent {
    public abstract AdError getError();

    public interface AdErrorEventListener {
        public void onAdErrorEvent(AdErrorEvent adErrorEvent);
    }
}
