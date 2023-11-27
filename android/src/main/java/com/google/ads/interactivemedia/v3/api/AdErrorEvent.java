package com.google.ads.interactivemedia.v3.api;

public abstract class AdErrorEvent {
    public abstract AdError getError();

    public interface AdErrorListener {
        public void onAdError(AdErrorEvent adErrorEvent);
    }
}
