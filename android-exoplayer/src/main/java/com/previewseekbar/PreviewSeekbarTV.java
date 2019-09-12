package com.previewseekbar;

import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.support.annotation.ColorInt;
import android.util.AttributeSet;
import android.util.TypedValue;
import android.view.View;

import com.brentvatne.react.R;

public class PreviewSeekbarTV extends PreviewSeekBar {

    private View.OnFocusChangeListener listener = new View.OnFocusChangeListener() {
        @Override
        public void onFocusChange(View v, boolean hasFocus) {
            handleThumbFocus(tintColor, hasFocus());

            if (focusListener != null) {
                focusListener.onFocusChange(v, hasFocus);
            }
        }
    };
    private OnFocusChangeListener focusListener;

    private int tintColor;

    public PreviewSeekbarTV(Context context) {
        super(context);
    }

    public PreviewSeekbarTV(Context context, AttributeSet attrs) {
        super(context, attrs);

        tintColor = getDefaultTintColor();

        handleThumbFocus(tintColor, hasFocus());

        setOnFocusChangeListener(listener);
    }

    public PreviewSeekbarTV(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    private int getDefaultTintColor() {
        TypedValue typedValue = new TypedValue();

        TypedArray a = getContext().obtainStyledAttributes(typedValue.data, new int[] { R.attr.colorAccent });
        int color = a.getColor(0, 0);

        a.recycle();

        return color;
    }

    @Override
    public void setOnFocusChangeListener(final View.OnFocusChangeListener l) {
        if (l == listener) {
            super.setOnFocusChangeListener(listener);
        } else {
            focusListener = l;
        }
    }

    @Override
    public void setTintColor(@ColorInt int color) {
        this.tintColor = color;
        handleThumbFocus(color, hasFocus());
    }

    private void handleThumbFocus(int color, boolean hasFocus) {
        ColorStateList accent = ColorStateList.valueOf(color);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            setProgressTintList(accent);
        } else {
            Drawable progressDrawable = getProgressDrawable().mutate();
            progressDrawable.setColorFilter(color, android.graphics.PorterDuff.Mode.SRC_IN);
            setProgressDrawable(progressDrawable);
        }
    }
}
