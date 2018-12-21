//
//  Scaler.m
//  RCTVideo
//
//  Created by June Kim on 12/20/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "FWScaler.h"


@implementation FWScaler {
  BOOL avoidScaleDropLandscape_;
  BOOL reduceZoomFactor_;
  double reduceZoomFactor_viewWidth_;
  double reduceZoomFactor_viewHeight_;
  double asd_max_rad_;
  double asd_max_scale_;
  double asd_view_width_;
  double asd_view_height_;
  double asd_video_width_;
  double asd_video_height_;
}


- (void) asdCheckViewSizeChangeWithViewWidth: (double) view_width viewHeight:(double) view_height videoWidth: (double) video_width videoHeight: (double) video_height {
  if (view_width == self->asd_view_width_ && view_height == self->asd_view_height_ && video_width == self->asd_video_width_ && video_height == self->asd_video_height_) return;
  self->asd_max_rad_ = -1;
  self->asd_max_scale_ = -1;
  self->asd_view_width_ = view_width;
  self->asd_view_height_ = view_height;
  self->asd_video_width_ = video_width;
  self->asd_video_height_ = video_height;
}

float FWScaler_rescale_avoid_landscale_dropWithDouble_withDouble_withDouble_withDouble_(FWScaler *self, double _rad, double scale_, double video_width, double video_height) {
  double rad = _rad;
  if (self->asd_max_scale_ == -1 || scale_ > self->asd_max_scale_) {
    self->asd_max_scale_ = scale_;
    self->asd_max_rad_ = abs(rad);
    self->asd_max_rad_ = (rad > 0.5 * M_PI) ? M_PI - rad : rad;
  }
  else if (scale_ < self->asd_max_scale_) {
    rad = abs(rad);
    rad = (rad > 0.5 * M_PI) ? M_PI - rad : rad;
    if ((video_width < video_height && rad > self->asd_max_rad_) || (video_width > video_height && rad < self->asd_max_rad_)) scale_ = self->asd_max_scale_;
  }
  return (float) scale_;
}

- (float) getScaleWithViewWidth: (double) view_width viewHeight:(double) view_height videoWidth:(double) video_width videoHeight: (double) video_height rad: (double) rad raw: (BOOL) raw {
  if (view_width == 0 || view_height == 0 || video_width == 0 || video_height == 0 || video_width == -1 || video_height == -1) return 1.0f;
  if (self->avoidScaleDropLandscape_) {
    [self asdCheckViewSizeChangeWithViewWidth:view_width viewHeight:view_height videoWidth:video_width videoHeight:video_height];
  }
  if (self->reduceZoomFactor_) {
    if (view_width < view_height && view_height / view_width > self->reduceZoomFactor_viewHeight_ / self->reduceZoomFactor_viewWidth_) view_width = view_height * self->reduceZoomFactor_viewWidth_ / self->reduceZoomFactor_viewHeight_;
    else if (view_width > view_height && view_width / view_height > self->reduceZoomFactor_viewHeight_ / self->reduceZoomFactor_viewWidth_) view_height = view_width * self->reduceZoomFactor_viewWidth_ / self->reduceZoomFactor_viewHeight_;
  }
  double half_view_width = 0.5 * view_width;
  double half_view_height = 0.5 * view_height;
  double half_video_width = 0.5 * video_width;
  double half_video_height = 0.5 * video_height;
  double scale_x = view_width / video_width;
  double scale_y = view_height / video_height;
  double original_video_scale = scale_x > scale_y ? scale_x : scale_y;
  if (video_width > video_height) original_video_scale = scale_x < scale_y ? scale_x : scale_y;
  double xc1 = half_view_width * cos(rad) - half_view_height * sin(rad);
  double yc1 = half_view_width * sin(rad) + half_view_height * cos(rad);
  double xc2 = -half_view_width * cos(rad) - half_view_height * sin(rad);
  double yc2 = -half_view_width * sin(rad) + half_view_height * cos(rad);
  double r2_1 = xc1 * xc1 / half_video_width / half_video_width + yc1 * yc1 / half_video_height / half_video_height;
  double r2_2 = xc2 * xc2 / half_video_width / half_video_width + yc2 * yc2 / half_video_height / half_video_height;
  double r2 = r2_1 > r2_2 ? r2_1 : r2_2;
  double r = sqrt(r2);
  if (self->avoidScaleDropLandscape_) r = FWScaler_rescale_avoid_landscale_dropWithDouble_withDouble_withDouble_withDouble_(self, rad, r, video_width, video_height);
  if (raw) return (float) r;
  else return (float) (r / original_video_scale);
}


@end
