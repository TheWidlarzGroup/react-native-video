//
//  DiceHTTPRequester.h
//  Beacon
//
//  Created by Lukasz Franieczek
//

#import <Foundation/Foundation.h>
#import "DiceHTTPRequest.h"

@interface DiceHTTPRequester : NSObject

/** DiceHTTPRequest that will be used  */
@property DiceHTTPRequest *requestData;

- (id)initWithDiceHTTPRequest:(DiceHTTPRequest *)request;

/**
 Executes request data
 @param completionHandler used to notify request result
 */
- (void)executeWithCompletionHandler:(void (^)(NSData *data, NSURLResponse *response, NSError *error))completionHandler;

- (void)cancel;

@end
