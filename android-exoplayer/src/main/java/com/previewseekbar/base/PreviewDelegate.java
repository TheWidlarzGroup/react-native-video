package com.previewseekbar.base;


import android.os.Build;
import android.view.View;

class PreviewDelegate implements PreviewView.OnPreviewChangeListener {

    private PreviewLayout previewLayout;
    private PreviewAnimator animator;
    private boolean showing;
    private boolean startTouch;
    private boolean setup;
    private boolean isEnabled;
    private PreviewLoader loader;
    private final boolean ANIMATION_DISABLED = true;

    PreviewDelegate(PreviewLayout previewLayout) {
        this.previewLayout = previewLayout;
    }

    void setup() {
        previewLayout.getPreviewFrameLayout().setVisibility(View.INVISIBLE);
        previewLayout.getMorphView().setVisibility(View.INVISIBLE);
        previewLayout.getFrameView().setVisibility(View.INVISIBLE);
        previewLayout.getPreviewView().addOnPreviewChangeListener(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            this.animator = new PreviewAnimatorLollipopImpl(previewLayout);
        } else {
            this.animator = new PreviewAnimatorImpl(previewLayout);
        }
        setup = true;
    }

    void setPreviewLoader(PreviewLoader loader) {
        this.loader = loader;
    }

    boolean isShowing() {
        return showing;
    }

    void show() {
        if (!ANIMATION_DISABLED && !showing && setup) {
            animator.show();
            showing = true;
        }
    }

    void setEnabled(boolean isEnabled) {
        this.isEnabled = isEnabled;
    }

    void hide() {
        if (showing) {
            animator.hide();
            showing = false;
        }
    }

    @Override
    public void onStartPreview(PreviewView previewView) {
        startTouch = true;
    }

    @Override
    public void onStopPreview(PreviewView previewView) {
        if (showing) {
            animator.hide();
        }
        showing = false;
        startTouch = false;
    }

    @Override
    public void onPreview(PreviewView previewView, int progress, boolean fromUser) {
        if (setup && isEnabled) {
            animator.move();
            if (!showing && !startTouch && fromUser) {
                show();
            }
            if (loader != null) {
                loader.loadPreview(progress, previewView.getMax());
            }
        }
        startTouch = false;
    }
}
