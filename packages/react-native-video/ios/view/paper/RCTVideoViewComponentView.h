#import <React/RCTView.h>

@interface RCTVideoViewComponentView : RCTView

@property (nonatomic, copy) NSNumber *nitroId;
@property (nonatomic, copy) RCTDirectEventBlock onNitroIdChange;

@end

