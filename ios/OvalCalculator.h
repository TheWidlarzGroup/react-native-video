//
//  Generated by the J2ObjC translator.  DO NOT EDIT!
//  source: example/OvalCalculator.java
//
#import <Foundation/Foundation.h>


@interface OvalCalculator : NSObject

#pragma mark Public

- (instancetype)init;

- (BOOL)get_avoid_scale_drop_landscape;

- (double)get_landscape_offset_percentage;

- (double)get_landscape_offset_xWithDouble:(double)rad;

- (double)get_landscape_offset_yWithDouble:(double)rad;

- (double)get_landscase_offsetWithDouble:(double)rad;

- (BOOL)get_reduce_zoom_factor;

- (double)get_scaleWithDouble:(double)rad;

- (double)get_scaleWithDouble:(double)view_width
                   withDouble:(double)view_height
                   withDouble:(double)video_width
                   withDouble:(double)video_height
                   withDouble:(double)rad;

- (double)get_scale_rawWithDouble:(double)rad;

- (double)get_scale_raw_WithDouble:(double)rad;

- (double)get_trim_percentage;

- (double)get_video_height;

- (double)get_video_width;

- (double)get_view_height;

- (double)get_view_width;

- (BOOL)is_shift_on_landscape;

- (BOOL)is_size_changedWithDouble:(double)view_width
                       withDouble:(double)view_height
                       withDouble:(double)video_width
                       withDouble:(double)video_height;

- (void)set_avoid_scale_drop_landscapeWithBoolean:(BOOL)flag;

- (void)set_initWithBoolean:(BOOL)init_;

- (void)set_landscape_offsetWithDouble:(double)landscape_offset_percentage;

- (void)set_reduce_zoom_factorWithBoolean:(BOOL)flag;

- (void)set_trim_percentageWithDouble:(double)trim_percentage;

- (void)set_trim_sizeWithDouble:(double)trim_width
                     withDouble:(double)trim_height;

- (void)set_video_sizeWithDouble:(double)video_width
                      withDouble:(double)video_height;

- (void)set_view_sizeWithDouble:(double)view_width
                     withDouble:(double)view_height;

@end
