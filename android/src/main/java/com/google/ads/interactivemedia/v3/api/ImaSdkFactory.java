package com.google.ads.interactivemedia.v3.api;

import androidx.annotation.InspectableProperty;

public abstract class ImaSdkFactory {
    public abstract ImaSdkSettings createImaSdkSettings();
    public abstract void setLanguage(String language);
}