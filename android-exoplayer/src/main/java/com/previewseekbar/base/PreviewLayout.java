package com.previewseekbar.base;


import android.view.View;
import android.widget.FrameLayout;

public interface PreviewLayout {

    PreviewView getPreviewView();

    View getMorphView();

    View getFrameView();

    FrameLayout getPreviewFrameLayout();
}
