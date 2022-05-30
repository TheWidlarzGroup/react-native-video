package com.imggaming.widgets;

import static android.view.ViewGroup.LayoutParams.WRAP_CONTENT;

import android.content.Context;
import android.content.res.Configuration;
import android.util.AttributeSet;
import android.view.Gravity;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatImageView;

import com.brentvatne.entity.Watermark;
import com.brentvatne.util.Utils;
import com.bumptech.glide.Glide;

/**
 * Watermark widget that can position itself based on the provided {@link Watermark}.
 */
public class DceWatermarkWidget extends AppCompatImageView {

    private static final int MARGIN_PX = 48;
    private static final float OPACITY = .75f;

    private @Nullable
    Watermark watermark;

    public DceWatermarkWidget(@NonNull Context context) {
        super(context);
    }

    public DceWatermarkWidget(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public DceWatermarkWidget(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void setWatermark(@Nullable Watermark watermark) {
        this.watermark = watermark;
    }

    /**
     * Show the watermark.
     */
    public void show() {
        if (!Watermark.isValid(watermark)) {
            return;
        }
        applyStyle(watermark);
        Glide.with(this)
                .load(replaceUrl(
                        watermark.getUrl()
                ))
                .into(this);
        setVisibility(VISIBLE);
    }

    /**
     * Hide the watermark.
     */
    public void hide() {
        setVisibility(GONE);
    }

    private void applyStyle(@NonNull Watermark watermark) {
        if (!Watermark.isValid(watermark)) {
            return;
        }
        // Set opacity.
        setAlpha(OPACITY);
        // Set size and margins.
        int size = getTargetSize();
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
                watermark.getDimension() == Watermark.Dimension.WIDTH ? size : WRAP_CONTENT,
                watermark.getDimension() == Watermark.Dimension.HEIGHT ? size : WRAP_CONTENT);

        layoutParams.leftMargin = MARGIN_PX;
        layoutParams.rightMargin = MARGIN_PX;
        layoutParams.topMargin = MARGIN_PX;
        layoutParams.bottomMargin = MARGIN_PX;
        // Set position.
        switch (watermark.getPosition()) {
            case TOP_LEFT:
                layoutParams.gravity = Gravity.TOP | Gravity.LEFT;
                break;
            case TOP_RIGHT:
                layoutParams.gravity = Gravity.TOP | Gravity.RIGHT;
                break;
            case BOTTOM_LEFT:
                layoutParams.gravity = Gravity.BOTTOM | Gravity.LEFT;
                break;
            case BOTTOM_RIGHT:
                layoutParams.gravity = Gravity.BOTTOM | Gravity.RIGHT;
                break;
        }
        setLayoutParams(layoutParams);
    }

    /**
     * Get the scaled target size of the view based on watermark's dimension and scale ratio.
     * The watermark's dimension can be used to decide whether the returned size need to applied
     * as width or height.
     *
     * @return The target size of the view in one dimension.
     */
    private int getTargetSize() {
        if (!Watermark.isValid(watermark)) {
            return -1;
        }
        int playerViewWidth = Utils.getRealScreenWidth(getContext());
        int playerViewHeight = Utils.getRealScreenHeight(getContext());
        return watermark.getDimension() == Watermark.Dimension.WIDTH
                ? (int) (playerViewWidth * watermark.getSizeRatio())
                : (int) (playerViewHeight * watermark.getSizeRatio());
    }

    @Nullable
    private String replaceUrl(@Nullable String url) {
        if (url == null || !Watermark.isValid(watermark)) {
            return null;
        }
        int size = getTargetSize();
        if (watermark.getDimension() == Watermark.Dimension.WIDTH) {
            return url.replaceFirst("original", size + "xAUTO");
        } else {
            return url.replaceFirst("original", "AUTOx" + size);
        }
    }

    @Override
    protected void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (!Watermark.isValid(watermark)) {
            return;
        }
        // Resize on orientation change.
        int size = getTargetSize();
        FrameLayout.LayoutParams layoutParams = (FrameLayout.LayoutParams) getLayoutParams();
        layoutParams.width = watermark.getDimension() == Watermark.Dimension.WIDTH ? size : WRAP_CONTENT;
        layoutParams.height = watermark.getDimension() == Watermark.Dimension.HEIGHT ? size : WRAP_CONTENT;
    }
}
