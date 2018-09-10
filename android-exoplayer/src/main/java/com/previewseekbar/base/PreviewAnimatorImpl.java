package com.previewseekbar.base;


import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AccelerateInterpolator;

class PreviewAnimatorImpl extends PreviewAnimator {

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

    public PreviewAnimatorImpl(PreviewLayout previewLayout) {
        super(previewLayout);
    }

    @Override
    public void show() {
        previewChildView.setScaleX(getScaleXStart());
        previewChildView.setScaleY(getScaleYStart());
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

    private void startReveal() {
        previewChildView.animate()
                .setInterpolator(new AccelerateInterpolator())
                .setDuration(MORPH_REVEAL_DURATION)
                .scaleX(1)
                .scaleY(1)
                .setListener(new AnimatorListenerAdapter() {
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
                        previewChildView.animate().setListener(null);
                        frameView.setVisibility(View.INVISIBLE);
                    }
                });
    }

    private void startUnreveal() {
        frameView.animate().alpha(1f).setDuration(UNMORPH_UNREVEAL_DURATION)
                .setInterpolator(new AccelerateInterpolator());

        previewChildView.animate()
                .setDuration(UNMORPH_UNREVEAL_DURATION)
                .setInterpolator(new AccelerateInterpolator())
                .scaleX(getScaleXStart())
                .scaleY(getScaleYStart())
                .setListener(new AnimatorListenerAdapter() {
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
    }

    private float getScaleXStart() {
        return morphView.getWidth() / previewChildView.getWidth();
    }

    private float getScaleYStart() {
        return (morphView.getWidth() * 2) / previewChildView.getWidth();
    }

}
