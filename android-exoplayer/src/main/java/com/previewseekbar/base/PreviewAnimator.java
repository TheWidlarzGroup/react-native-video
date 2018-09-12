package com.previewseekbar.base;


import android.os.Build;
import android.view.View;

abstract class PreviewAnimator {

    static final int MORPH_REVEAL_DURATION = 200;
    static final int MORPH_MOVE_DURATION = 150;
    static final int UNMORPH_MOVE_DURATION = 150;
    static final int UNMORPH_UNREVEAL_DURATION = 200;

    PreviewView previewView;
    PreviewLayout previewLayout;
    View previewChildView;
    View frameView;
    View morphView;

    PreviewAnimator(PreviewLayout previewLayout) {
        this.previewLayout = previewLayout;
        this.previewView = this.previewLayout.getPreviewView();
        this.previewChildView = this.previewLayout.getPreviewFrameLayout();
        this.morphView = this.previewLayout.getMorphView();
        this.frameView = this.previewLayout.getFrameView();
    }

    void move() {
        previewChildView.setX(getPreviewX());
        morphView.setX(getPreviewCenterX(morphView.getWidth()));
    }

    public abstract void show();

    public abstract void hide();

    float getWidthOffset(int progress) {
        return (float) progress / previewView.getMax();
    }

    float getPreviewCenterX(int width) {
        float ltr = (((View) previewLayout).getWidth() - previewChildView.getWidth())
                * getWidthOffset(previewView.getProgress()) + previewChildView.getWidth() / 2f
                - width / 2f;
        float rtl = (((View) previewLayout).getWidth() - previewChildView.getWidth())
                * (1 - getWidthOffset(previewView.getProgress())) + previewChildView.getWidth() / 2f
                - width / 2f;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            return ((View) previewView).getLayoutDirection() == View.LAYOUT_DIRECTION_LTR ?
                    ltr : rtl;
        } else {
            return ltr;
        }
    }

    float getPreviewX() {
        float ltr = ((float) (((View) previewLayout).getWidth() - previewChildView.getWidth()))
                * getWidthOffset(previewView.getProgress());
        float rtl = ((float) (((View) previewLayout).getWidth() - previewChildView.getWidth()))
                * (1 - getWidthOffset(previewView.getProgress()));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            return ((View) previewView).getLayoutDirection() == View.LAYOUT_DIRECTION_LTR ?
                    ltr : rtl;
        } else {
            return ltr;
        }
    }

    float getHideY() {
        return ((View) previewView).getY() + previewView.getThumbOffset();
    }

    float getShowY() {
        return (int) (previewChildView.getY() + previewChildView.getHeight() / 2f);
    }
}
