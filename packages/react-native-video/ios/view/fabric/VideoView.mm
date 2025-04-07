#import "VideoView.h"

#import <react/renderer/components/RNVideoViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNVideoViewSpec/EventEmitters.h>
#import <react/renderer/components/RNVideoViewSpec/Props.h>
#import <react/renderer/components/RNVideoViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

#import "ReactNativeVideo-Swift-Cxx-Umbrella.hpp"
#import "ReactNativeVideo-Swift.h"

using namespace facebook::react;

@interface VideoView () <RCTVideoViewViewProtocol>
@end

@implementation VideoView {
  VideoComponentView * _view;
  int _nitroId;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const VideoViewProps>();
    _props = defaultProps;
    
    _view = [[VideoComponentView alloc] initWithFrame:frame];
    
    self.contentView = _view;
  }
  
  // -1 means that nitroId wasn't set yet
  _nitroId = -1;
  
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<VideoViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<VideoViewProps const>(props);
  
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

// Event emitter convenience method
- (void)onNitroIdChange:(int)nitroId
{
  auto eventEmitter = std::dynamic_pointer_cast<const VideoViewEventEmitter>(_eventEmitter);
  if (!eventEmitter || nitroId == -1) {
    return;
  }
  
  eventEmitter->onNitroIdChange({ .nitroId = nitroId });
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter {
  [super updateEventEmitter:eventEmitter];
  [self onNitroIdChange:_nitroId];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<VideoViewComponentDescriptor>();
}

Class<RCTComponentViewProtocol> VideoViewCls(void)
{
  return VideoView.class;
}

@end
