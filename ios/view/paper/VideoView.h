#import <React/RCTView.h>

@interface VideoView : RCTView

@property (nonatomic, copy) NSNumber *nitroId;
@property (nonatomic, copy) RCTDirectEventBlock onNitroIdChange;

@end

