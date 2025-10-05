#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNDatazoom, NSObject)

RCT_EXTERN_METHOD(initialize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
