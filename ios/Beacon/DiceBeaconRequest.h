//
//  DiceBeaconRequest.h
//  Beacon
//
//  Created by Lukasz Franieczek
//
#include "DiceBeaconResponse.h"

@interface DiceBeaconRequest : NSObject
/** API URL */
@property(readonly) NSURL *requestURL;
/** Call headers */
@property(readonly) NSDictionary<NSString*, NSString*> *headers;
/** POST Body */
@property(readonly) NSData *body;


+ (DiceBeaconRequest *)requestWithURLString:(NSString *)urlString headers:(NSDictionary<NSString*, NSString*> *)headers body:(NSDictionary *)body;

/**
 Executes Beacon request.
 @param completionHandler notifies result of the request
 */
- (void)makeRequestWithCompletionHandler:(void (^)(DiceBeaconResponse* response, NSError *error))completionHandler;

- (void)cancel;
@end

