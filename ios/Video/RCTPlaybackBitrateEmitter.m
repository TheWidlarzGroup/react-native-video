//
//  playbackBitrateEmitter.m
//  labs2020mobile
//
//  Created by Farales, Ron on 11/4/22.
//

#import <Foundation/Foundation.h>
#import "RCTPlaybackBitrateEmitter.h"
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>

@implementation playbackBitrateEmitter

  RCT_EXPORT_MODULE();

  bool hasBitrateListeners;
  playbackBitrateEmitter *sharedEmitter;

  -(instancetype)init
  {
    self = [super init];
    
    sharedEmitter = self;
    
    return self;
  }

  - (NSArray<NSString *> *)supportedEvents {
    return @[@"BITRATE_UPDATE"];
  }
  
  - (void)startObserving {
    hasBitrateListeners = YES;
  }
  
  - (void)stopObserving {
    hasBitrateListeners = NO;
  }
  

  + (void)emitBitrateEvent:(double)bitrate {
    if (hasBitrateListeners) {
      NSString* bitrateString = [@(bitrate) stringValue];
      [sharedEmitter sendEventWithName:@"BITRATE_UPDATE" body:@{@"bitrate": bitrateString}];
    }
  }

  
  + (BOOL)requiresMainQueueSetup {
    return NO;
  }
  
@end


