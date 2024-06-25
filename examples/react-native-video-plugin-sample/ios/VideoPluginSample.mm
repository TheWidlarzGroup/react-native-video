#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoPluginSample, NSObject)

RCT_EXTERN_METHOD(setMetadata:
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
