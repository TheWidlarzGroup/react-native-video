package com.previewseekbar;

import android.content.Context;
import android.os.Build;
import android.util.AttributeSet;
import android.view.View;
import android.widget.FrameLayout;

import com.previewseekbar.base.PreviewGeneralLayout;
import com.previewseekbar.base.PreviewView;

public class PreviewSeekBarLayout extends PreviewGeneralLayout {

    private PreviewSeekBar seekBar;
    private FrameLayout previewFrameLayout;

    public PreviewSeekBarLayout(Context context) {
        super(context);
    }

    public PreviewSeekBarLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public PreviewSeekBarLayout(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    public PreviewView getPreviewView() {
        return seekBar;
    }

    @Override
    public FrameLayout getPreviewFrameLayout() {
        return previewFrameLayout;
    }

    /**
     * Align seekbar thumb with the frame layout center
     */
    @Override
    public void setupMargins() {
        // TODO: Enable the following when adding the thumbnails
        /*
        LayoutParams layoutParams = (LayoutParams) seekBar.getLayoutParams();

        layoutParams.rightMargin = (int) (previewFrameLayout.getWidth() / 2
                - seekBar.getThumb().getIntrinsicWidth() * 0.9f);
        layoutParams.leftMargin = layoutParams.rightMargin;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            layoutParams.setMarginEnd(layoutParams.leftMargin);
            layoutParams.setMarginStart(layoutParams.leftMargin);
        }

        seekBar.setLayoutParams(layoutParams);
        requestLayout();
        invalidate();
        */
    }

    @Override
    public boolean checkChilds() {
        int childs = getChildCount();

        if (childs < 2) {
            return false;
        }

        boolean hasSeekbar = false;
        boolean hasFrameLayout = false;

        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);

            if (child instanceof PreviewSeekBar) {
                hasSeekbar = true;
                seekBar = (PreviewSeekBar) child;
            } else if (child instanceof FrameLayout) {
                previewFrameLayout = (FrameLayout) child;
                hasFrameLayout = true;
            }

            if (hasSeekbar && hasFrameLayout) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1
                        && getResources().getConfiguration().getLayoutDirection()
                        == View.LAYOUT_DIRECTION_RTL) {
                    seekBar.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
                }
                return true;
            }
        }

        return hasSeekbar && hasFrameLayout;
    }
}
