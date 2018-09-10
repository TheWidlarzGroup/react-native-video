package com.previewseekbar.base;


import android.support.annotation.ColorInt;

public interface PreviewView {

    int getProgress();

    int getMax();

    int getThumbOffset();

    int getDefaultColor();

    void addOnPreviewChangeListener(OnPreviewChangeListener listener);

    void removeOnPreviewChangeListener(OnPreviewChangeListener listener);

    interface OnPreviewChangeListener {
        void onStartPreview(PreviewView previewView);

        void onStopPreview(PreviewView previewView);

        void onPreview(PreviewView previewView, int progress, boolean fromUser);
    }

    public void setTintColor(@ColorInt int color);
}
