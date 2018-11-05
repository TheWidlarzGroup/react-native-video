//
//  DiceHTTPRequest.h
//  Beacon
//
//  Created by Lukasz Franieczek
//

typedef enum {
    GET,
    POST,
    DELETE
} DiceHTTPMethod;

@interface DiceHTTPRequest : NSObject

@property DiceHTTPMethod method;
/** query parameters */
@property NSDictionary<NSString *, NSString *> *parameters;
/** request body - valid only for POST requests */
@property NSData *body;
/** Headers */
@property NSDictionary<NSString *, NSString *> *headers;
/** The URL of the request */
@property (readonly) NSURL *URL;

- (id)initWithUrl:(NSURL *)URL;

@end


