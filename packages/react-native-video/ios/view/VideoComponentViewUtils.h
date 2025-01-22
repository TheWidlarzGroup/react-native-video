//
//  VideoComponent.h
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 25/10/2024.
//

@class VideoComponentView;

@interface VideoComponentViewUtils : NSObject

+ (UIView *)createVideoComponent;
+ (UIView *)createVideoComponentWithFrame:(CGRect)frame;
+ (void)setNitroId:(NSNumber *)nitroId forVideoComponent:(UIView *)videoComponent;

@end
