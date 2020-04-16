package com.imggaming.widgets;

import android.content.Context;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.brentvatne.react.R;

import androidx.annotation.Nullable;

public class DceSeekIndicator extends LinearLayout {

    private ImageView rewImageView;
    private ImageView forwardImageView;
    private TextView labelTextView;
    private Runnable runnable;

    public DceSeekIndicator(Context context) {
        super(context);
    }

    public DceSeekIndicator(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        LayoutInflater.from(context).inflate(R.layout.dce_seek_indicator, this);

        rewImageView = findViewById(R.id.seekIndicatorImageRewind);
        forwardImageView = findViewById(R.id.seekIndicatorImageForward);
        labelTextView = findViewById(R.id.seekIndicatorLabel);
    }

    public DceSeekIndicator(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void show(boolean isRew, String label) {
        show(isRew, label, 0, null);
    }

    public void show(boolean isRew, String label, int timeout, Runnable hideRunnable) {
        rewImageView.setVisibility(isRew ? View.VISIBLE : View.GONE);
        forwardImageView.setVisibility(isRew ? View.GONE : View.VISIBLE);
        labelTextView.setGravity(Gravity.RIGHT);
        setLabel(label);
        removeCallbacks(runnable);
        runnable = hideRunnable;
        if (timeout > 0) {
            postDelayed(runnable, timeout);
        }
    }

    public void setLabelMaxText(String maxText) {
        float width = labelTextView.getPaint().measureText(maxText);
        labelTextView.setWidth((int) width);
    }

    public void setLabel(String label) {
        labelTextView.setText(label);
    }

    public int getRewImageWidth() {
        return rewImageView.getWidth();
    }

    public int getForwardImageWidth() {
        return forwardImageView.getWidth();
    }

}
