package com.google.ads.interactivemedia.v3.api;

import androidx.annotation.InspectableProperty;

public abstract class AdError {
    public abstract InspectableProperty getErrorCode();
    public abstract InspectableProperty getErrorCodeNumber();
    public abstract InspectableProperty getErrorType();
    public abstract String getMessage();
}
