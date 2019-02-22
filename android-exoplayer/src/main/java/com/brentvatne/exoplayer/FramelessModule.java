package com.brentvatne.exoplayer;

import android.content.Context;
import android.support.animation.DynamicAnimation;
import android.support.animation.SpringAnimation;
import android.util.Log;
import android.view.View;

import static android.view.View.INVISIBLE;

public class FramelessModule {

    private FramelessModule.OnFramelessAnimateListener mListener;

    private Context context;
    private View virtual_view;

    public double device_rotation_degree;  // measured by sensors
    public double display_rotation_degree;  // the display degree (which may or may not be identical to device_rotation_degree)
    public double animate_offset_degree;

    public double lock_degree = 15.0;
    public double bounce_degree = 20.0;

    public double display_view_x;
    private double init_view_x;

    private final float ignore_gravity_cap = 0.25f;

    public long timelock_time;
    public long current_playback_time;

    private boolean is_locked_last_update = false;
    private boolean off_rotation = false;  // true when display_rotation_degree != device_rotation_degree
    public boolean is_bouncing = false;  // true during the bounce animation
    private boolean after_bounce = false;
    private double off_rotation_degree;

    public boolean is_bending = false;   // true when lock_degree <= device_rotation_degree < bounce_degree
    private double bend_x_distance = 60;

    private float bend_spring_stiff = 1000f;
    private float bend_spring_damp = 0.4f;

    private float spring_stiff = 90f;  // default 1500
    private float spring_damp = 0.8f;  // default 0.5

    public FramelessModule(Context context) {
        this.context = context;
    }

    public void setFramelessAnimateListener(FramelessModule.OnFramelessAnimateListener listener){
        mListener = listener;
    }

    public void set_init_view_x(float init_view_x) {
        this.init_view_x = init_view_x;
    }

    private void validate_virtual_view()
    {
        if (virtual_view != null)
            return;
        virtual_view = new View(context);
        virtual_view.setVisibility(INVISIBLE);
    }

    public boolean on_update_gravity_values(float[] gravityValues, float view_x)
    {
        if (Math.abs(gravityValues[0]) < ignore_gravity_cap && Math.abs(gravityValues[1]) < ignore_gravity_cap)
            return false;      // avoid irregular rotation with phone laying flat (facing top)

        device_rotation_degree = Math.atan2(gravityValues[0], gravityValues[1]) / Math.PI * 180.0;

        if (current_playback_time >= timelock_time)  // off-lock
        {
            if (is_locked_last_update) {
                to_unlock();
                is_locked_last_update = false;
            }
            display_rotation_degree = device_rotation_degree + animate_offset_degree;
        }
        else {  // lock
            //Log.v("rotato", "device rotation degree: " + device_rotation_degree + (off_rotation ? ", off rotation: " + off_rotation_degree : ""));
            if (!is_locked_last_update) {  // switch mode
                if (Math.abs(device_rotation_degree) > lock_degree)
                    to_lock();
                is_locked_last_update = true;
            }
            else if (is_bouncing);
            else if (is_bending && Math.abs(device_rotation_degree) > bounce_degree)
            {
                if (!is_bending)
                    init_view_x = view_x;
                to_bounce();
            }
            else if (Math.abs(device_rotation_degree) > lock_degree) {
                off_rotation = true;
                off_rotation_degree = device_rotation_degree > 0 ? lock_degree: -lock_degree;
                if (after_bounce);
                else {
                    if (!is_bending)
                        init_view_x = view_x;
                    is_bending = true;
                    display_view_x = init_view_x + bend_x_distance * (-device_rotation_degree + off_rotation_degree) / (bounce_degree - lock_degree);
                }
            }
            else if (Math.abs(device_rotation_degree) <= lock_degree) {
                is_bending = off_rotation = after_bounce = false;
                display_view_x = init_view_x;
            }

            if (off_rotation && Math.abs(device_rotation_degree) > lock_degree)  // calculate rotation degree
                display_rotation_degree = off_rotation_degree + animate_offset_degree;
            else {
                display_rotation_degree = device_rotation_degree + animate_offset_degree;
                off_rotation = false;
            }
        }
        return true;
    }

    private void to_bounce()
    {
        is_bouncing = true;

        validate_virtual_view();
        virtual_view.setTranslationX((float)display_view_x);
        final SpringAnimation animator = new SpringAnimation(virtual_view, DynamicAnimation.TRANSLATION_X, (float)init_view_x);

        animator.getSpring().setStiffness(bend_spring_stiff);
        animator.getSpring().setDampingRatio(bend_spring_damp);

        animator.addUpdateListener(new DynamicAnimation.OnAnimationUpdateListener() {
            @Override
            public void onAnimationUpdate(DynamicAnimation dynamicAnimation, float value,
                                          float velocity) {
                display_view_x = value;
                if (mListener != null)
                    mListener.OnFramelessAnimate((float)display_rotation_degree, (float)display_view_x);
            }
        });

        animator.addEndListener(new DynamicAnimation.OnAnimationEndListener() {
            @Override
            public void onAnimationEnd(DynamicAnimation animation, boolean canceled, float value, float velocity) {
                is_bouncing = false;
                after_bounce = true;
            }
        });
        animator.start();
    }

    private void to_unlock()
    {
        if (!off_rotation)
            return;

        start_spring_animation((float)(-device_rotation_degree + off_rotation_degree));
    }

    private void to_lock()  // called after checking if Math.abs(device_rotation_degree) > lock_degree
    {
        off_rotation = true;
        off_rotation_degree = device_rotation_degree > 0 ? lock_degree: -lock_degree;

        start_spring_animation((float)(device_rotation_degree - off_rotation_degree));
    }

    private void start_spring_animation(float start_value)
    {
        validate_virtual_view();
        virtual_view.setRotation(start_value);
        final SpringAnimation animator = new SpringAnimation(virtual_view, DynamicAnimation.ROTATION, 0);

        animator.getSpring().setStiffness(spring_stiff);
        animator.getSpring().setDampingRatio(spring_damp);

        animator.addUpdateListener(new DynamicAnimation.OnAnimationUpdateListener() {
            @Override
            public void onAnimationUpdate(DynamicAnimation dynamicAnimation, float value,
                                          float velocity) {
                animate_offset_degree = value;
                calculate_display_rotation_degree();
                if (mListener != null)
                    mListener.OnFramelessAnimate((float)display_rotation_degree, (float)display_view_x);
            }
        });
        animator.start();
    }

    private void calculate_display_rotation_degree()
    {
        if (current_playback_time >= timelock_time)
            display_rotation_degree = device_rotation_degree + animate_offset_degree;
        else if (off_rotation) {
            if (Math.abs(device_rotation_degree) <= lock_degree) {
                display_rotation_degree = device_rotation_degree + animate_offset_degree;
                off_rotation = false;
            }
            else
                display_rotation_degree = off_rotation_degree + animate_offset_degree;
        }
        else {
            if (Math.abs(device_rotation_degree) > lock_degree)
            {
                off_rotation = true;
                off_rotation_degree = device_rotation_degree > 0 ? lock_degree: -lock_degree;
                display_rotation_degree = off_rotation_degree + animate_offset_degree;
            }
            else
                display_rotation_degree = device_rotation_degree + animate_offset_degree;
        }
    }

    public interface OnFramelessAnimateListener{
        void OnFramelessAnimate(float degree, float translate_x);
    }
}