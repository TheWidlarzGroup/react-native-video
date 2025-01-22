#import "VideoView.h"

#import <react/renderer/components/RNVideoViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNVideoViewSpec/EventEmitters.h>
#import <react/renderer/components/RNVideoViewSpec/Props.h>
#import <react/renderer/components/RNVideoViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

// TODO: update code once solved ReactNativeVideo-Swift.h import issues is fixed
#import "VideoComponentViewUtils.h"

using namespace facebook::react;

@interface VideoView () <RCTVideoViewViewProtocol>
@end

@implementation VideoView {
  UIView * _view;
  int _nitroId;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const VideoViewProps>();
    _props = defaultProps;
    
    _view = [VideoComponentViewUtils createVideoComponentWithFrame:frame];
    
    self.contentView = _view;
  }
  
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<VideoViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<VideoViewProps const>(props);
  
  [VideoComponentViewUtils setNitroId:[NSNumber numberWithInt:newViewProps.nitroId] forVideoComponent:_view];
  _nitroId = newViewProps.nitroId;
  
  if (oldViewProps.nitroId != newViewProps.nitroId) {
    [self onNitroIdChange:_nitroId];
  }
  
  [super updateProps:props oldProps:oldProps];
}

// Event emitter convenience method
- (void)onNitroIdChange:(int)nitroId
{
  auto eventEmitter = std::dynamic_pointer_cast<const VideoViewEventEmitter>(_eventEmitter);
  if (!eventEmitter) {
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
