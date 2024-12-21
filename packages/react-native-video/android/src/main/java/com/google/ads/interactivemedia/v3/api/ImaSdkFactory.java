package com.google.ads.interactivemedia.v3.api;

public abstract class ImaSdkFactory {
    private static ImaSdkFactory instance;

    public abstract ImaSdkSettings createImaSdkSettings();

    public static ImaSdkFactory getInstance() {
        if (instance == null) {
            instance = new ConcreteImaSdkFactory();
        }
        return instance;
    }
}

class ConcreteImaSdkFactory extends ImaSdkFactory {

    @Override
    public ImaSdkSettings createImaSdkSettings() {
        return new ConcreteImaSdkSettings();
    }
}