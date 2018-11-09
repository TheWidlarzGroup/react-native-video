//
//  DiceBeaconResponse.h
//  Beacon
//
//  Created by Lukasz Franieczek
//

#import <Foundation/Foundation.h>

/**
 Error:
 {"status": 403, "messages": ["No access to video 641234567141"], "request-id": "5874a628-e0f1-11e8-b3f3-b5706c8ab211"}
 OK:
 {"heartbeatInterval": 5}
 
 */
@interface DiceBeaconResponse : NSObject
/** Defines if response is OK or Failure */
@property BOOL OK;
/**
 @brief String value that can be presented to the user.
 @remark Only present if OK == NO
 */
@property NSArray<NSString *> *errorMessages;

@property NSData* rawResponse;

/** HTTP status code of the response received */
@property NSInteger HTTPStatusCode;

/** Frequency (in seconds) with which requests to pulse service should be done during playback. Valid only if status OK == YES.*/
@property(readonly) NSInteger frequency;

- (id)initWithHTTPURLResponse:(NSHTTPURLResponse *)urlResponse data:(NSData *)data;

@end
