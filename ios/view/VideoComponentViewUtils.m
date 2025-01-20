//
//  VideoComponent.m
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 25/10/2024.
//

#import "VideoComponentViewUtils.h"
#import "ReactNativeVideo-Swift.h"

@implementation VideoComponentViewUtils

+ (UIView *)createVideoComponent {
  VideoComponentView *component = [[VideoComponentView alloc] init];
  return component;
}

+ (UIView *)createVideoComponentWithFrame:(CGRect)frame {
  VideoComponentView *videoComponent = [[VideoComponentView alloc] initWithFrame:frame];
    return videoComponent;
}

+ (void)setNitroId:(NSNumber *)nitroId forVideoComponent:(UIView *)videoComponent {
    if ([videoComponent isKindOfClass:[VideoComponentView class]]) {
        VideoComponentView *vc = (VideoComponentView *)videoComponent;
        [vc setNitroId:nitroId];
    } else {
        NSLog(@"Error: The provided view is not a VideoComponent instance.");
    }
}

@end
