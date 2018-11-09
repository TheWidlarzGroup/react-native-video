//
//  DiceBeaconResponse.m
//  Beacon
//
//  Created by Lukasz Franieczek
//

#import "DiceBeaconResponse.h"

@implementation DiceBeaconResponse

@synthesize OK = _OK;
@synthesize errorMessages = _errorMessages;
@synthesize HTTPStatusCode = _HTTPStatusCode;
@synthesize frequency = _frequency;
@synthesize rawResponse = _rawResponse;

- (id)initWithHTTPURLResponse:(NSHTTPURLResponse *)urlResponse data:(NSData *)data;
{
    NSInteger HTTPStatusCodeOK = 200;
    
    _OK = urlResponse.statusCode == HTTPStatusCodeOK;
    _HTTPStatusCode = urlResponse.statusCode;
    if (!_OK && data != nil) {
        NSError* error = nil;
        NSDictionary* resp = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if (error == nil) {
            _errorMessages = [resp objectForKey:@"messages"];
        }
    }
    
    if (_OK) {
        NSError* error = nil;
        NSDictionary* resp = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if (error == nil) {
            if (resp[@"heartbeatInterval"] != nil && [resp[@"heartbeatInterval"] isKindOfClass:NSNumber.class]) {
                _frequency = ((NSNumber *)resp[@"heartbeatInterval"]).longValue;
            } else {
                _frequency = 5;
            }
        } else {
            // failed to read frequency, failover value set
            _frequency = 5;
        }
        
        if (_frequency < 1) {
            _frequency = 5;
        }
    }
    
    _rawResponse = data;
    return self;
}

@end
