//
//  DiceHTTPRequester.m
//  Beacon
//
//  Created by Lukasz Franieczek
//

#import "DiceHTTPRequester.h"
#import "DiceBeaconResponse.h"
#import "DiceUtils.h"

@implementation DiceHTTPRequester
{
    NSURLSession *session;
    NSURLSessionTask *requestTask;
}

@synthesize requestData = _requestData;

- (id)initWithDiceHTTPRequest:(DiceHTTPRequest *)request {
    NSURLSessionConfiguration *sessionConfig = [NSURLSessionConfiguration defaultSessionConfiguration];
    sessionConfig.HTTPMaximumConnectionsPerHost = 1;
    sessionConfig.HTTPShouldUsePipelining = YES;

    session = [NSURLSession sessionWithConfiguration:sessionConfig delegate:nil delegateQueue:[NSOperationQueue mainQueue]];
    _requestData = request;

    return self;
}

- (void)executeWithCompletionHandler:(void (^)(NSData *data, NSURLResponse *response, NSError *error))completionHandler {
    NSURLComponents *components = [NSURLComponents componentsWithURL:_requestData.URL resolvingAgainstBaseURL:NO];

    if (_requestData.parameters != nil) {
        NSMutableArray<NSURLQueryItem *> *queryItems = [NSMutableArray array];
        for (NSString *key in _requestData.parameters) {
            NSURLQueryItem *queryItem = [NSURLQueryItem queryItemWithName:key value:_requestData.parameters[key]];
            [queryItems addObject:queryItem];
        }

        NSURLComponents *components = [NSURLComponents componentsWithURL:_requestData.URL resolvingAgainstBaseURL:NO];
        components.queryItems = queryItems;
    }

    NSMutableURLRequest *const request  = [NSMutableURLRequest requestWithURL:components.URL];

    switch (_requestData.method) {
        case GET:
            request.HTTPMethod = @"GET";
            break;
        case POST:
            request.HTTPMethod = @"POST";
            break;
        case DELETE:
            request.HTTPMethod = @"DELETE";
            break;
        default:
            break;
    }

    NSString *dataLog = [NSString stringWithFormat:@"%@", request];
    
    if (_requestData.headers != nil) {
        [request setAllHTTPHeaderFields:_requestData.headers];
        dataLog = [NSString stringWithFormat:@"%@\nHeaders: %@", dataLog, _requestData.headers];
    }

    if (_requestData.body != nil && _requestData.method != GET) {
        [request setHTTPBody:_requestData.body];
        if (_requestData.body.length > 0) {
            dataLog = [NSString stringWithFormat:@"%@\nBody: %@", dataLog, [NSString stringWithUTF8String:[_requestData.body bytes]]];
        } else {
            dataLog = [NSString stringWithFormat:@"%@\nBody: %@", dataLog, @"Unknown body"];
        }
    }

    DICELog(@"=== Request START ===\n%@\n=== Request END ===", dataLog);
    requestTask = [session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        NSString *responseDataLog = [NSString stringWithFormat:@"%@", response];
        if (data != nil && data.length > 0) {
            NSString* s = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            responseDataLog = [NSString stringWithFormat:@"%@\nBody: %@", responseDataLog, s];
        }
        if (error != nil) {
            responseDataLog = [NSString stringWithFormat:@"%@\nError: %@", responseDataLog, error];
        }
        DICELog(@"=== Response START ===\n%@\n=== Response END ===", responseDataLog);
        if (error != nil
                && error.domain == NSURLErrorDomain
                && error.code == NSURLErrorCancelled) {
            DICELog(@"requestTask has been cancelled. completionHandler will not be called.");
            return;
        }
        completionHandler(data, response, error);
    }];
    [requestTask resume];
}

- (void)cancel
{
    [requestTask cancel];
}

@end
