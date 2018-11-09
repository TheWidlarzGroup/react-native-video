//
//  DiceBeaconRequest.m
//  Beacon
//
//  Created by Lukasz Franieczek
//

#import <Foundation/Foundation.h>
#import "DiceBeaconRequest.h"
#import "DiceHTTPRequester.h"
#import "DiceBeaconResponse.h"
#import "DiceUtils.h"

@implementation DiceBeaconRequest
{
    DiceHTTPRequester *_requester;
}

// MARK: Parameters
@synthesize requestURL = _requestURL;
@synthesize headers = _headers;
@synthesize body = _body;

// MARK: DiceBeaconRequest

+ (DiceBeaconRequest *)requestWithURLString:(NSString *)urlString headers:(NSDictionary<NSString*, NSString*> *)headers body:(NSDictionary *)body;
{
    return [[DiceBeaconRequest alloc] initWithURLString:urlString headers:headers body:body];
}

- (id)initWithURLString:(NSString *)urlString headers:(NSDictionary<NSString*, NSString*> *)headers body:(NSDictionary *)body;
{
    _requestURL = [NSURL URLWithString:urlString];
    if (_requestURL == nil) {
        return nil;
    }

    _headers = headers;
    if (body != nil) {
        NSError* error = nil;
        _body = [NSJSONSerialization dataWithJSONObject:body options:0 error:&error];
        if (error != nil) {
            return nil;
        }
    } else {
        _body = nil;
    }
    
    return self;
}

- (NSString *)description
{
    NSString *ret = [NSString stringWithFormat:@"url=%@ headers=%@ body=%@", _requestURL, _headers, _body];
    return ret;
}

- (void)makeRequestWithCompletionHandler:(void (^)(DiceBeaconResponse* response, NSError *error))completionHandler
{
    
    DiceHTTPRequest *request = [[DiceHTTPRequest alloc] initWithUrl:_requestURL];

    request.method = POST;
    request.body = _body;

    if (_requester == nil) {
        _requester = [[DiceHTTPRequester alloc] initWithDiceHTTPRequest:request];
    } else {
        _requester.requestData = request;
    }
    [_requester executeWithCompletionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
         if (error != nil) {
             DICELog(@"Error %@", error);
             completionHandler(nil, error);
             return;
         }

         DiceBeaconResponse *resp = [[DiceBeaconResponse alloc] initWithHTTPURLResponse:(NSHTTPURLResponse *)response data:data];
         if (!resp.OK) {
             // todo: log information?
         }
         completionHandler(resp, error);
         
     }];
}

- (void)cancel
{
    [_requester cancel];
}

@end
