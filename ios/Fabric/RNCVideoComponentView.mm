#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCVideoComponentView.h"

#import <react/renderer/components/RNCVideo/ComponentDescriptors.h>
#import <react/renderer/components/RNCVideo/EventEmitters.h>
#import <react/renderer/components/RNCVideo/Props.h>
#import <react/renderer/components/RNCVideo/RCTComponentViewHelpers.h>

#import <React/RCTBridge+Private.h>

#import "RCTFabricComponentsPlugins.h"
#import "RCTVideo.h"

using namespace facebook::react;

@interface RNCVideoComponentView () <RCTRNCVideoViewProtocol>

@end

@implementation RNCVideoComponentView {
    UIView * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<RNCVideoComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNCVideoProps>();
    _props = defaultProps;

    RCTBridge *bridge = [RCTBridge currentBridge];
    _view = [[RCTVideo alloc] initWithEventDispatcher: bridge.eventDispatcher];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<RNCVideoProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<RNCVideoProps const>(props);

    if (oldViewProps.color != newViewProps.color) {
//        NSString * colorToConvert = [[NSString alloc] initWithUTF8String: newViewProps.color.c_str()];
//        [_view setBackgroundColor: [ColorUtils hexStringToColor:colorToConvert]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> RNCVideoCls(void)
{
    return RNCVideoComponentView.class;
}

@end
#endif
