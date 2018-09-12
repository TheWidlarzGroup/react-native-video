package com.previewseekbar.base;


import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.os.Build;
import android.view.View;
import android.view.ViewAnimationUtils;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AccelerateInterpolator;

class PreviewAnimatorLollipopImpl extends PreviewAnimator {

    private Animator.AnimatorListener showListener = new AnimatorListenerAdapter() {
        @Override
        public void onAnimationEnd(Animator animation) {
            super.onAnimationEnd(animation);
            morphView.animate().setListener(null);
            startReveal();
        }
    };

    private Animator.AnimatorListener hideListener = new AnimatorListenerAdapter() {
        @Override
        public void onAnimationEnd(Animator animation) {
            super.onAnimationEnd(animation);
            morphView.setVisibility(View.INVISIBLE);
            morphView.animate().setListener(null);
        }
    };

    public PreviewAnimatorLollipopImpl(PreviewLayout previewLayout) {
        super(previewLayout);
    }

    @Override
    public void show() {
        previewChildView.setVisibility(View.INVISIBLE);
        frameView.setVisibility(View.INVISIBLE);
        morphView.setX(getPreviewCenterX(morphView.getWidth()));
        morphView.setY(((View) previewView).getY());
        morphView.setVisibility(View.VISIBLE);
        morphView.animate()
                .y(getShowY())
                .scaleY(4.0f)
                .scaleX(4.0f)
                .setDuration(MORPH_MOVE_DURATION)
                .setInterpolator(new AccelerateDecelerateInterpolator())
                .setListener(showListener);
    }

    @Override
    public void hide() {
        frameView.setVisibility(View.VISIBLE);
        previewChildView.setVisibility(View.VISIBLE);
        morphView.setY(getShowY());
        morphView.setScaleX(4.0f);
        morphView.setScaleY(4.0f);
        morphView.setVisibility(View.INVISIBLE);
        startUnreveal();
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private void startReveal() {
        Animator animator = ViewAnimationUtils.createCircularReveal(previewChildView,
                getCenterX(previewChildView),
                getCenterY(previewChildView),
                morphView.getWidth() * 2,
                getRadius(previewChildView));

        animator.setTarget(previewChildView);
        animator.setDuration(MORPH_REVEAL_DURATION);
        animator.setInterpolator(new AccelerateInterpolator());
        animator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationStart(Animator animation) {
                super.onAnimationStart(animation);
                frameView.setAlpha(1f);
                previewChildView.setVisibility(View.VISIBLE);
                frameView.setVisibility(View.VISIBLE);
                morphView.setVisibility(View.INVISIBLE);
                frameView.animate().alpha(0f).setDuration(MORPH_REVEAL_DURATION);
            }

            @Override
            public void onAnimationEnd(Animator animation) {
                super.onAnimationEnd(animation);
                previewChildView.animate().setListener(null);
                frameView.setVisibility(View.INVISIBLE);
            }

        });

        animator.start();

    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private void startUnreveal() {
        Animator animator = ViewAnimationUtils.createCircularReveal(previewChildView,
                getCenterX(previewChildView),
                getCenterY(previewChildView),
                getRadius(previewChildView), morphView.getWidth() * 2);
        animator.setTarget(previewChildView);
        animator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                super.onAnimationEnd(animation);
                previewChildView.animate().setListener(null);
                frameView.setVisibility(View.INVISIBLE);
                previewChildView.setVisibility(View.INVISIBLE);
                morphView.setVisibility(View.VISIBLE);
                morphView.animate()
                        .y(getHideY())
                        .scaleY(0.5f)
                        .scaleX(0.5f)
                        .setDuration(UNMORPH_MOVE_DURATION)
                        .setInterpolator(new AccelerateInterpolator())
                        .setListener(hideListener);
            }
        });
        frameView.animate().alpha(1f).setDuration(UNMORPH_UNREVEAL_DURATION)
                .setInterpolator(new AccelerateInterpolator());
        animator.setDuration(UNMORPH_UNREVEAL_DURATION)
                .setInterpolator(new AccelerateInterpolator());
        animator.start();
    }

    private int getRadius(View view) {
        return (int) Math.hypot(view.getWidth() / 2, view.getHeight() / 2);
    }

    private int getCenterX(View view) {
        return view.getWidth() / 2;
    }

    private int getCenterY(View view) {
        return view.getHeight() / 2;
    }
}
