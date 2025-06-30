#import "VideoView.h"
#import "VideoComponentViewUtils.h"

@implementation VideoView {
  UIView* _view;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    // Initialize VideoComponentView with the given frame
    _view = [VideoComponentViewUtils createVideoComponentWithFrame:frame];
    _view.translatesAutoresizingMaskIntoConstraints = NO;
    [self addSubview:_view];
    
    // Set up constraints to make VideoComponentView fill NitroView
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
  [VideoComponentViewUtils setNitroId:nitroId forVideoComponent:_view];

  // Emit the onNitroIdChange event when nitroId is updated
  if (self.onNitroIdChange) {
    self.onNitroIdChange(@{ @"nitroId": nitroId });
  }
}

@end
