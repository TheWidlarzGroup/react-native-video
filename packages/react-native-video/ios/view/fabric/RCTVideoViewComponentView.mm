#import "RCTVideoViewComponentView.h"

#import <react/renderer/components/RNCVideoViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNCVideoViewSpec/EventEmitters.h>
#import <react/renderer/components/RNCVideoViewSpec/Props.h>
#import <react/renderer/components/RNCVideoViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

#import "ReactNativeVideo-Swift-Cxx-Umbrella.hpp"

#if __has_include("ReactNativeVideo/ReactNativeVideo-Swift.h")
#import "ReactNativeVideo/ReactNativeVideo-Swift.h"
#else
#import "ReactNativeVideo-Swift.h"
#endif

using namespace facebook::react;

@interface RCTVideoViewComponentView () <RCTRNCVideoViewViewProtocol>
@end

@implementation RCTVideoViewComponentView {
  VideoComponentView *_view;
  int _nitroId;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps =
        std::make_shared<const RNCVideoViewProps>();
    _props = defaultProps;

    _view = [[VideoComponentView alloc] initWithFrame:frame];

    self.contentView = _view;
  }

  // -1 means that nitroId wasn't set yet
  _nitroId = -1;

  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
      *std::static_pointer_cast<RNCVideoViewProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<RNCVideoViewProps const>(props);

  if (oldViewProps.nitroId != newViewProps.nitroId) {
    [self setNitroId:newViewProps.nitroId];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)setNitroId:(int)nitroId {
  _nitroId = nitroId;
  [_view setNitroId:[NSNumber numberWithInt:nitroId]];
  [self onNitroIdChange:nitroId];
}

+ (BOOL)shouldBeRecycled
{
  return NO;
}

// Event emitter convenience method
- (void)onNitroIdChange:(int)nitroId {
  auto eventEmitter =
      std::dynamic_pointer_cast<const RNCVideoViewEventEmitter>(_eventEmitter);
  if (!eventEmitter || nitroId == -1) {
    return;
  }

  eventEmitter->onNitroIdChange({.nitroId = nitroId});
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter {
  [super updateEventEmitter:eventEmitter];
  [self onNitroIdChange:_nitroId];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RNCVideoViewComponentDescriptor>();
}

Class<RCTComponentViewProtocol> RNCVideoViewCls(void) {
  return RCTVideoViewComponentView.class;
}

@end
