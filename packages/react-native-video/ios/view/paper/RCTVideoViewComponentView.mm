#import "RCTVideoViewComponentView.h"

#import "ReactNativeVideo-Swift-Cxx-Umbrella.hpp"

#if __has_include("ReactNativeVideo/ReactNativeVideo-Swift.h")
#import "ReactNativeVideo/ReactNativeVideo-Swift.h"
#else
#import "ReactNativeVideo-Swift.h"
#endif

@implementation RCTVideoViewComponentView {
  VideoComponentView *_view;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    // Initialize VideoComponentView with the given frame
    _view = [[VideoComponentView alloc] initWithFrame:frame];
    _view.translatesAutoresizingMaskIntoConstraints = NO;
    [self addSubview:_view];

    // Set up constraints to make VideoComponentView fill
    // RCTVideoViewComponentView
    [NSLayoutConstraint activateConstraints:@[
      [_view.leadingAnchor constraintEqualToAnchor:self.leadingAnchor],
      [_view.trailingAnchor constraintEqualToAnchor:self.trailingAnchor],
      [_view.topAnchor constraintEqualToAnchor:self.topAnchor],
      [_view.bottomAnchor constraintEqualToAnchor:self.bottomAnchor]
    ]];
  }
  return self;
}

- (void)setNitroId:(NSNumber *)nitroId {
  _nitroId = nitroId;
  [_view setNitroId:nitroId];

  // Emit the onNitroIdChange event when nitroId is updated
  if (self.onNitroIdChange) {
    self.onNitroIdChange(@{@"nitroId" : nitroId});
  }
}

@end
