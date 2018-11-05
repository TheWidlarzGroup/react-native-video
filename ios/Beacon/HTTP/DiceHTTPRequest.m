//
//  DiceHTTPRequest.m
//  Beacon
//
//  Created by Lukasz Franieczek
//

#import <Foundation/Foundation.h>
#import "DiceHTTPRequest.h"

@implementation DiceHTTPRequest

@synthesize URL = _URL;
@synthesize body = _body;
@synthesize method = _method;
@synthesize parameters = _parameters;
@synthesize headers = _headers;

- (id)initWithUrl:(NSURL *)URL {
    _URL = URL;
    return self;
}

@end
