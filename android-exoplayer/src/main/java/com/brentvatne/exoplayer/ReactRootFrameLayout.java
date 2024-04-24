package com.brentvatne.exoplayer;

import android.content.Context;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

class ReactRootFrameLayout extends FrameLayout {
    interface OnSizeChangedListener {
        void onViewSizeChanged(ReactRootFrameLayout reactRootFrameLayout, View childView);
    }

    private OnSizeChangedListener onSizeChangedListener;

    public ReactRootFrameLayout(@NonNull Context context) {
        super(context);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        if (onSizeChangedListener != null && getChildCount() > 0 && w > 0 && h > 0) {
            onSizeChangedListener.onViewSizeChanged(this, getChildAt(0));
        }
    }

    public void setOnSizeChangedListener(OnSizeChangedListener listener) {
        onSizeChangedListener = listener;
    }
}
