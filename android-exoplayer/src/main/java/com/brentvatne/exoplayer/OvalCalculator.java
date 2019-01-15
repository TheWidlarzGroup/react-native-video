package com.brentvatne.exoplayer;

import android.util.Log;

public class OvalCalculator {

    //  This class calculates corresponding scale, given view/video dimension
    //  and the rotating angle (in rad). OvalCalculator should be declared as a
    //  member for each view, no initialization is required, unless a non-default
    //  setting is preferred.
    //
    //  Usage: on handling sensor data changed, the changed 'degree' (for instance, -180 to 180)*
    //  or 'rad' (-PI to PI)* is calculated,
    //
    //  view.oValCalculator.set_fit() or set_fill(), depending on how your view stretch video
    //
    //  float scale = (float)view.ovalCalculator.get_scale(view.getWidth(), view.getHeight(), view.getVideoWidth(), view.getVideoHeight(), rad);
    //
    //  view.setScaleX(scale);
    //  view.setScaleY(scale);
    //  view.setRotation(degree);
    //
    //  if (view.ovalCalculator.is_shift_on_landscape()) {
    //      view.setTranslationX((float) view.ovalCalculator.get_landscape_offset_x(rad));
    //      view.setTranslationY((float) view.ovalCalculator.get_landscape_offset_y(rad));
    //  }
    //
    // * It's okay for the degree or rad to be not regularized (> 180 or < -180), the OvalCalculator
    //   will handle that.
    //

    private double video_width, video_height;
    private double view_width, view_height;

    //private double min_scale = -1, max_scale = -1, zoom_factor = -1;

    private int fill_mode = 0; // 0: preserve_ratio_fill, 1: preserve_ratio_fit
    private double landscape_offset_percentage = 0;

    private double trim_percentage = 0;
    //private double trim_videoWidth = 3, trim_videoHeight = 4; // default trim is on
    private double trim_videoWidth = 0, trim_videoHeight = 0;

    private boolean reduceZoomFactor = false;
    private double reduceZoomFactor_viewWidth = 9, reduceZoomFactor_viewHeight = 16;

    private boolean avoidScaleDropLandscape = true;
    private double asd_max_rad = -1, asd_max_scale = -1;
    private double asd_view_width = -1, asd_view_height = -1, asd_video_width = -1, asd_video_height = -1;

    private boolean slow_start_landscape = true;
    //private double slow_start_percentage = 1;
    private double slow_start_rad_landscape = 3.0 * Math.PI / 180.0;      // if rad < slow_start_rad, a constant scale will be returned

    private boolean slow_start_portrait = true;
    //private double slow_start_percentage = 1;
    private double slow_start_rad_portrait = 18.0 * Math.PI / 180.0;      // if rad < slow_start_rad, a constant scale will be returned
    //private double slow_start_end_rad = 57.0 * Math.PI / 180.0;  //
    //private double slow_start_percentage = 0.5;
    //private double slow_start_rad = 16.6 * Math.PI / 180.0;      // if rad < slow_start_rad, a constant scale will be returned
    //private double slow_start_end_rad = 55.0 * Math.PI / 180.0;  //

    private boolean init = false;

    public OvalCalculator()  {

    }

    public boolean is_init()
    {
        return init;
    }

    public void set_init(boolean init)
    {
        this.init = init;
    }

    public boolean is_size_changed(double view_width, double view_height, double video_width, double video_height)
    {
        return (view_width != this.view_width || view_height != this.view_height || video_width != this.video_width || video_height != this.video_height);
    }

    public void set_video_size(double video_width, double video_height)
    {
        this.video_width = video_width;
        this.video_height = video_height;

        if (trim_videoWidth != 0 && trim_videoHeight != 0)
            set_trim_size(trim_videoWidth, trim_videoHeight); // calculate trim percentage
    }

    public void set_view_size(double view_width, double view_height)
    {
        this.view_width = view_width;
        this.view_height = view_height;
    }

    public void set_trim_size(double trim_width, double trim_height)  // need to init video size before calling this
    {
        if (this.video_width == 0 || this.video_height == 0 || this.video_width == -1 || this.video_height == -1)
            return;

        double video_width = this.video_width, video_height = this.video_height, t;
        if (trim_width > trim_height)
        {
            t = trim_height;
            trim_height = trim_width;
            trim_width = t;
        }
        if (video_width > video_height)
        {
            t = video_height;
            video_height = video_width;
            video_width = t;
        }
        trim_percentage = 100.0 * (video_height * trim_width - trim_height * video_width) / (video_height * trim_width * 2.0);
    }

    public void set_trim_percentage(double trim_percentage)
    {
        this.trim_percentage = trim_percentage;
    }

    public void set_landscape_offset(double landscape_offset_percentage)
    {
        this.landscape_offset_percentage = landscape_offset_percentage;
    }

    public void set_reduce_zoom_factor(boolean flag)
    {
        reduceZoomFactor = flag;
    }

    public void set_avoid_scale_drop_landscape(boolean flag)
    {
        avoidScaleDropLandscape = flag;
    }

    public double get_trim_percentage()
    {
        return trim_percentage;
    }

    public double get_video_width()
    {
        return video_width;
    }

    public double get_video_height()
    {
        return video_height;
    }

    public double get_view_width()
    {
        return view_width;
    }

    public double get_view_height()
    {
        return view_height;
    }

    public boolean get_reduce_zoom_factor()
    {
        return reduceZoomFactor;
    }

    public boolean get_avoid_scale_drop_landscape()
    {
        return avoidScaleDropLandscape;
    }

    public double get_landscape_offset_percentage()
    {
        return landscape_offset_percentage;
    }

    public boolean is_shift_on_landscape()
    {
        return (landscape_offset_percentage != 0 && video_width < video_height);  // only for portrait video
    }

    public double get_landscase_offset(double rad)
    {
        if (video_width >= video_height)
            return 0;
        if (!slow_start_portrait)
            return Math.abs(Math.sin(rad)) * landscape_offset_percentage * view_height;

        double r = regularize_rad(rad);
        if (Math.abs(r) <= slow_start_rad_portrait || Math.abs(r) >= Math.PI - slow_start_rad_portrait)   // give a constant scale within the given (slow start) rad
            return 0;
        else if (Math.abs(r) <= 0.5 * Math.PI)
            return Math.abs(Math.sin((Math.abs(r) -  slow_start_rad_portrait) * 0.5 * Math.PI / (0.5 * Math.PI - slow_start_rad_portrait))) * landscape_offset_percentage * view_height;
        else
            return Math.abs(Math.sin(Math.PI - ((Math.PI - Math.abs(r) - slow_start_rad_portrait) * 0.5 * Math.PI / (0.5 * Math.PI - slow_start_rad_portrait)))) * landscape_offset_percentage * view_height;
    }

    public double get_landscape_offset_x(double rad)
    {
        return get_landscase_offset(rad) * Math.sin(rad);
    }

    public double get_landscape_offset_y(double rad)
    {
        return -get_landscase_offset(rad) * Math.cos(rad);
    }

    private boolean check_invalid_init()
    {
        return (view_width == 0 || view_height == 0 || video_width == 0 || video_height == 0 || video_width == -1 || video_height == -1);
    }

    private double get_trimmed_video_width()
    {
        double trimmed_video_width = video_width;
        if (video_width > video_height) {
            trimmed_video_width = video_width * (1 - 0.02 * trim_percentage);
            trimmed_video_width = trimmed_video_width < video_height ? video_height : trimmed_video_width;
        }
        return trimmed_video_width;
    }

    private double get_trimmed_video_height()
    {
        double trimmed_video_height = video_height;
        if (video_width < video_height) {
            trimmed_video_height = video_height * (1 - 0.02 * trim_percentage);
            trimmed_video_height = trimmed_video_height < video_width ? video_width : trimmed_video_height;
        }
        return trimmed_video_height;
    }

    public double get_scale(double view_width, double view_height, double video_width, double video_height, double rad)
    {
        if (is_size_changed(view_width, view_height, video_width, video_height))
        {
            set_view_size(view_width, view_height);
            set_video_size(video_width, video_height);
        }

        return get_scale(rad);
    }

    public void set_fill()
    {
        fill_mode = 0;
    }

    public void set_fit()
    {
        fill_mode = 1;
    }

    public int get_video_stretch_mode()
    {
        return fill_mode;
    }

    public double get_scale(double rad)
    {
        double scale_x = view_width / video_width;
        double scale_y = view_height / video_height;
        double original_video_scale = scale_x > scale_y ? scale_x : scale_y;  // the original scale of the video
        if (fill_mode == 1)
            original_video_scale = scale_x > scale_y ? scale_y : scale_x;

        double raw_scale = get_scale_raw(rad);

        //return Math.sqrt(video_width * video_height / view_width / view_height * r * r);
        return raw_scale / original_video_scale;  // how much we need to scale further
    }

    public double get_scale_raw(double rad)
    {
        if (slow_start_portrait && video_width < video_height) {
            double r = regularize_rad(rad);
            if (Math.abs(r) <= slow_start_rad_portrait || Math.abs(r) >= Math.PI - slow_start_rad_portrait)   // give a constant scale within the given (slow start) rad
                return get_scale_raw_(slow_start_rad_portrait);
            else
                return get_scale_raw_(r);
        }
        else if (slow_start_landscape && video_width > video_height) {
            double r = regularize_rad(rad + 0.5 * Math.PI);
            if (Math.abs(r) <= slow_start_rad_landscape || Math.abs(r) >= Math.PI - slow_start_rad_landscape)   // give a constant scale within the given (slow start) rad
                return get_scale_raw_(slow_start_rad_landscape + 0.5 * Math.PI);
            else
                return get_scale_raw_(regularize_rad(rad));
        }
        else
            return get_scale_raw_(rad);
    }

    public double get_scale_raw_(double rad)
    {
        if (check_invalid_init())
            return 1.0;

        // video is the outer rectangle, view is the inner rectangle
        // the formula of the oval is x^2/a^2 + y^2/b^2 = 1

        double video_width = this.video_width, video_height = this.video_height;  // video_width, video_height in this function are local variables

        if (trim_percentage != 0)
        {
            video_width = get_trimmed_video_width();
            video_height = get_trimmed_video_height();
        }

        // a = half_video_width, b = half_video_height           // this is the equation of eclipse
        // x = scale * (a * cos(theta) - b * sin(theta)
        // y = scale * (a * sin(theta) + b * cos(theta)

        if (avoidScaleDropLandscape)
            asd_check_view_size_change(view_width, view_height, video_width, video_height);

        if (reduceZoomFactor)
        {
            if (view_width < view_height && view_height / view_width > reduceZoomFactor_viewHeight / reduceZoomFactor_viewWidth)
                view_width = view_height * reduceZoomFactor_viewWidth / reduceZoomFactor_viewHeight;
            else if (view_width > view_height && view_width / view_height > reduceZoomFactor_viewHeight / reduceZoomFactor_viewWidth)
                view_height = view_width * reduceZoomFactor_viewWidth / reduceZoomFactor_viewHeight;
        }

        double half_view_width = 0.5 * view_width, half_view_height = 0.5 * view_height;
        double half_video_width = 0.5 * video_width, half_video_height = 0.5 * video_height;

        double xc1 = half_view_width * Math.cos(rad) - half_view_height * Math.sin(rad);  // the top right corner of inner rectangle
        double yc1 = half_view_width * Math.sin(rad) + half_view_height * Math.cos(rad);

        double xc2 = -half_view_width * Math.cos(rad) - half_view_height * Math.sin(rad); // the top left corner of inner rectangle
        double yc2 = -half_view_width * Math.sin(rad) + half_view_height * Math.cos(rad);

        double r2_1 = xc1 * xc1 / half_video_width / half_video_width + yc1 * yc1 / half_video_height / half_video_height;
        // the square of minimal scale that guarantee the top right corner stays inside the oval
        double r2_2 = xc2 * xc2 / half_video_width / half_video_width + yc2 * yc2 / half_video_height / half_video_height;
        // the square of minimal scale that guarantee the top left corner stays inside the oval

        double r2 = r2_1 > r2_2 ? r2_1 : r2_2; // use the bigger one
        double r = Math.sqrt(r2);

        if (avoidScaleDropLandscape)
            r = rescale_avoid_landscale_drop(rad, r, video_width, video_height);

        return r;
    }

    private void asd_check_view_size_change(double view_width, double view_height, double video_width, double video_height) {
        if (view_width == asd_view_width && view_height == asd_view_height && video_width == asd_video_width && video_height == asd_video_height)
            return;

        asd_max_rad = -1;
        asd_max_scale = -1;
        asd_view_width = view_width;
        asd_view_height = view_height;
        asd_video_width = video_width;
        asd_video_height = video_height;
    }

    private double regularize_rad(double rad) // make sure rad is between -PI and PI
    {
        while (rad <= -Math.PI)
            rad += 2.0 * Math.PI;
        while (rad > Math.PI)
            rad -= 2.0 * Math.PI;
        return rad;
    }

    private float rescale_avoid_landscale_drop(double rad, double scale, double video_width, double video_height)
    {
        rad = regularize_rad(rad);
        if (asd_max_scale == -1 || scale > asd_max_scale) {
            asd_max_scale = scale;
            rad = Math.abs(rad);
            asd_max_rad = (rad > 0.5 * Math.PI) ? Math.PI - rad : rad;
        }
        else if (scale == asd_max_scale) {  // take the smallest/largest rad for portrait/landscape
            rad = Math.abs(rad);
            rad = (rad > 0.5 * Math.PI) ? Math.PI - rad : rad;
            if (video_width < video_height && rad < asd_max_rad || video_width > video_height && rad > asd_max_rad)
                rad = asd_max_rad;
        }
        else if (scale < asd_max_scale) {
            rad = Math.abs(rad);
            rad = (rad > 0.5 * Math.PI) ? Math.PI - rad : rad;
            if (video_width < video_height && rad > asd_max_rad || video_width > video_height && rad < asd_max_rad)
                scale = asd_max_scale;
        }
        return (float)scale;
    }
}
