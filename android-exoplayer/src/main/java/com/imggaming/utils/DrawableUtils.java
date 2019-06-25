package com.imggaming.utils;

import android.graphics.drawable.Drawable;
import android.support.v4.graphics.drawable.DrawableCompat;

public class DrawableUtils {

    public static Drawable setTint(Drawable d, int color) {
        Drawable wrappedDrawable = DrawableCompat.wrap(d);
        DrawableCompat.setTint(wrappedDrawable, color);
        return wrappedDrawable;
    }
}
