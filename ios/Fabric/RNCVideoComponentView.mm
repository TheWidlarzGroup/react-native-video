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
    RCTVideo * _view;
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
    
    NSString * uri = [NSString stringWithFormat:@"%s", newViewProps.src.uri.c_str()];
    NSString * type = [NSString stringWithFormat:@"%s", newViewProps.src.type.c_str()];
    NSDictionary *sourceDict =  @{
        @"uri" : uri,
        @"type": type,
        @"endTime": @(newViewProps.src.endTime),
        @"isAsset": @(newViewProps.src.isAsset),
        @"isNetwork": @(newViewProps.src.isNetwork),
        @"shouldCache": @(newViewProps.src.shouldCache),
        @"requestHeaders": @{},
        @"startTime": @(newViewProps.src.startTime),
    };
    [_view setSrc:sourceDict];
    

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> RNCVideoCls(void)
{
    return RNCVideoComponentView.class;
}

@end
#endif
