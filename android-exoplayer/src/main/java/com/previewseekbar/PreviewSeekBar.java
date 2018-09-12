package com.previewseekbar;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.support.annotation.ColorInt;
import android.support.annotation.ColorRes;
import android.support.v4.content.ContextCompat;
import android.support.v7.widget.AppCompatSeekBar;
import android.util.AttributeSet;
import android.widget.SeekBar;

import com.previewseekbar.base.PreviewView;

import java.util.ArrayList;
import java.util.List;

/**
 * A SeekBar that should be used inside PreviewSeekBarLayout
 */
public class PreviewSeekBar extends AppCompatSeekBar implements PreviewView,
        SeekBar.OnSeekBarChangeListener {

    private List<PreviewView.OnPreviewChangeListener> listeners;

    public PreviewSeekBar(Context context) {
        super(context);
        init();
    }

    public PreviewSeekBar(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public PreviewSeekBar(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        listeners = new ArrayList<>();
        super.setOnSeekBarChangeListener(this);
    }

    @Override
    public void setOnSeekBarChangeListener(OnSeekBarChangeListener l) {
        // No-op
    }

    public void setTintColorResource(@ColorRes int colorResource) {
        setTintColor(ContextCompat.getColor(getContext(), colorResource));
    }

    public void setTintColor(@ColorInt int color) {
        getThumb().setColorFilter(color, PorterDuff.Mode.SRC_ATOP);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            setProgressTintList(ColorStateList.valueOf(color));
            setProgressBackgroundTintList(ColorStateList.valueOf(Color.WHITE));
        } else {
            Drawable progressDrawable = getProgressDrawable().mutate();
            progressDrawable.setColorFilter(color, android.graphics.PorterDuff.Mode.SRC_IN);
            setProgressDrawable(progressDrawable);

        }
    }

    @Override
    public int getDefaultColor() {
        ColorStateList list = null;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            list = getThumbTintList();
        }
        if (list != null) {
            return list.getDefaultColor();
        } else {
            return 0;
        }
    }

    @Override
    public void addOnPreviewChangeListener(OnPreviewChangeListener listener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    @Override
    public void removeOnPreviewChangeListener(OnPreviewChangeListener listener) {
        listeners.remove(listener);
    }

    @Override
    public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
        for (OnPreviewChangeListener listener : listeners) {
            listener.onPreview(this, progress, fromUser);
        }
    }

    @Override
    public void onStartTrackingTouch(SeekBar seekBar) {
        for (OnPreviewChangeListener listener : listeners) {
            listener.onStartPreview(this);
        }
    }

    @Override
    public void onStopTrackingTouch(SeekBar seekBar) {
        for (OnPreviewChangeListener listener : listeners) {
            listener.onStopPreview(this);
        }
    }


}
