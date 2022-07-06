package com.imggaming.widgets;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ValueAnimator;
import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.LinearLayoutCompat;

import com.brentvatne.react.R;
import com.google.android.exoplayer2.endeavor.LimitedSeekRange;
import com.imggaming.translations.DiceLocalizedStrings;
import com.imggaming.translations.DiceLocalizedStrings.StringId;

import java.util.Objects;

/**
 * A widget that is displayed when a live program is started, and automatically hides itself after
 * 10 seconds. Either displaying "Watch from Beginning" or "Watch from Live" based on the given
 * {@link LimitedSeekRange}.
 */
public class DceWatchFromWidget extends LinearLayoutCompat {

    private TextView labelTextView;
    private ImageView icon;

    private @Nullable LimitedSeekRange limitedSeekRange;
    private boolean wasShownAlready;
    private Runnable hideRunnable;

    public DceWatchFromWidget(@NonNull Context context) {
        super(context);
        init();
    }

    public DceWatchFromWidget(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public DceWatchFromWidget(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        LayoutInflater.from(getContext()).inflate(R.layout.dce_watch_from_beginning_widget, this);
        setClickable(true);
        setFocusable(true);
        hideRunnable = this::hide;
        labelTextView = findViewById(R.id.watch_from_label);
        icon = findViewById(R.id.watch_from_icon);
    }

    /**
     * Set the {@link LimitedSeekRange}. It resets the widget (which means it can be shown again)
     * if the newly given limited seek range is different from the current one.
     *
     * @param limitedSeekRange The limited seek range to set.
     */
    public void setLimitedSeekRange(LimitedSeekRange limitedSeekRange) {
        if (!Objects.equals(limitedSeekRange, this.limitedSeekRange)) {
            // Reset it if the new seek range is not the same.
            wasShownAlready = false;
        }
        this.limitedSeekRange = limitedSeekRange;
    }

    /**
     * Show the widget if it wasn't shown before.
     */
    public void show() {
        if (limitedSeekRange == null || LimitedSeekRange.isUseAsVod(limitedSeekRange) || wasShownAlready) {
            return;
        }
        if (!limitedSeekRange.isSeekToStart()) {
            labelTextView.setText(DiceLocalizedStrings.getInstance().string(StringId.epgProgrammeStartBeginning));
            icon.setImageResource(R.drawable.ic_watch_from_beginning_selector);
        } else {
            labelTextView.setText(DiceLocalizedStrings.getInstance().string(StringId.epgProgrammeStartLive));
            icon.setImageResource(R.drawable.ic_watch_from_live_selector);
        }

        ValueAnimator fadeIn = ValueAnimator.ofFloat(0f, 1f);
        fadeIn.setDuration(200);
        fadeIn.addUpdateListener(animation -> setAlpha((Float) animation.getAnimatedValue()));
        fadeIn.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationStart(Animator animation) {
                super.onAnimationStart(animation);
                setVisibility(View.VISIBLE);
                wasShownAlready = true;
            }
        });
        fadeIn.start();

        // Hide it automatically after 10s.
        postDelayed(hideRunnable, 10_000);
    }

    /**
     * Hide the widget.
     */
    public void hide() {
        ValueAnimator fadeOut = ValueAnimator.ofFloat(1f, 0f);
        fadeOut.setDuration(200);
        fadeOut.addUpdateListener(animation -> setAlpha((Float) animation.getAnimatedValue()));
        fadeOut.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                super.onAnimationEnd(animation);
                setVisibility(View.GONE);
            }
        });
        fadeOut.start();
    }

    public boolean isWatchFromBeginning() {
        if (limitedSeekRange != null) {
            return !limitedSeekRange.isSeekToStart();
        }
        return false;
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        removeCallbacks(hideRunnable);
    }
}
