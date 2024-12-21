package com.google.ads.interactivemedia.v3.api;

import androidx.annotation.InspectableProperty;

public abstract class ImaSdkSettings {
    public abstract String getLanguage();
    public abstract void setLanguage(String language);
}

// Concrete Implementation
class ConcreteImaSdkSettings extends ImaSdkSettings {

    private String language;

    @Override
    public String getLanguage() {
        return language;
    }

    @Override
    public void setLanguage(String language) {
        this.language = language;
    }
}
