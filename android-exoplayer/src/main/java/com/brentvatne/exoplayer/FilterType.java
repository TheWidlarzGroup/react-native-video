package com.brentvatne.exoplayer;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import com.daasuu.epf.filter.GlBilateralFilter;
import com.daasuu.epf.filter.GlBoxBlurFilter;
import com.daasuu.epf.filter.GlBulgeDistortionFilter;
import com.daasuu.epf.filter.GlCGAColorspaceFilter;
import com.daasuu.epf.filter.GlFilter;
import com.daasuu.epf.filter.GlFilterGroup;
import com.daasuu.epf.filter.GlGaussianBlurFilter;
import com.daasuu.epf.filter.GlGrayScaleFilter;
import com.daasuu.epf.filter.GlHazeFilter;
import com.daasuu.epf.filter.GlInvertFilter;
import com.daasuu.epf.filter.GlLookUpTableFilter;
import com.daasuu.epf.filter.GlMonochromeFilter;
import com.daasuu.epf.filter.GlSepiaFilter;
import com.daasuu.epf.filter.GlSharpenFilter;
import com.daasuu.epf.filter.GlSphereRefractionFilter;
import com.daasuu.epf.filter.GlToneCurveFilter;
import com.daasuu.epf.filter.GlVignetteFilter;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public enum FilterType {
    DEFAULT,
    BILATERAL_BLUR,
    BOX_BLUR,
    TONE_CURVE_SAMPLE,
    LOOK_UP_TABLE_SAMPLE,
    BULGE_DISTORTION,
    CGA_COLORSPACE,
    GAUSSIAN_FILTER,
    GRAY_SCALE,
    HAZE,
    INVERT,
    MONOCHROME,
    SEPIA,
    SHARP,
    VIGNETTE,
    FILTER_GROUP_SAMPLE,
    SPHERE_REFRACTION,
    BITMAP_OVERLAY_SAMPLE;


    public static List<FilterType> createFilterList() {
        List<FilterType> filters = new ArrayList<>();

        filters.add(DEFAULT);
        filters.add(SEPIA);
        filters.add(MONOCHROME);
        filters.add(TONE_CURVE_SAMPLE);
        filters.add(LOOK_UP_TABLE_SAMPLE);
        filters.add(VIGNETTE);
        filters.add(INVERT);
        filters.add(HAZE);
        filters.add(BOX_BLUR);
        filters.add(BILATERAL_BLUR);
        filters.add(GRAY_SCALE);
        filters.add(SPHERE_REFRACTION);
        filters.add(FILTER_GROUP_SAMPLE);
        filters.add(GAUSSIAN_FILTER);
        filters.add(BULGE_DISTORTION);
        filters.add(CGA_COLORSPACE);
        filters.add(SHARP);
        filters.add(BITMAP_OVERLAY_SAMPLE);

        return filters;
    }

    public static GlFilter createGlFilter(FilterType filterType) {
        switch (filterType) {
            case DEFAULT:
                return new GlFilter();
            case SEPIA:
                return new GlSepiaFilter();
            case GRAY_SCALE:
                return new GlGrayScaleFilter();
            case INVERT:
                return new GlInvertFilter();
            case HAZE:
                return new GlHazeFilter();
            case MONOCHROME:
                return new GlMonochromeFilter();
            case BILATERAL_BLUR:
                return new GlBilateralFilter();
            case BOX_BLUR:
                return new GlBoxBlurFilter();
            case SPHERE_REFRACTION:
                return new GlSphereRefractionFilter();
            case VIGNETTE:
                return new GlVignetteFilter();
            case FILTER_GROUP_SAMPLE:
                return new GlFilterGroup(new GlSepiaFilter(), new GlVignetteFilter());
            case GAUSSIAN_FILTER:
                return new GlGaussianBlurFilter();
            case BULGE_DISTORTION:
                return new GlBulgeDistortionFilter();
            case CGA_COLORSPACE:
                return new GlCGAColorspaceFilter();
            case SHARP:
                GlSharpenFilter glSharpenFilter = new GlSharpenFilter();
                glSharpenFilter.setSharpness(4f);
                return glSharpenFilter;
            default:
                return new GlFilter();
        }
    }

}
