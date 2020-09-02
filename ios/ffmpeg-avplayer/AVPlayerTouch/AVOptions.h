//
//  AVOptions.h
//  AVPlayerTouch
//
//  Created by apple on 16/2/12.
//  Copyright © 2016年 apple. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 * AV Options name
 *
 * Please be careful, you must know what you are doing,
 * the default option value is enough for the most situations.
 **/


/**
 * Common options for all protocols
 */
extern NSString *const AVOptionNameAVFormatName;    // set input av format short name, such as "mjpeg", it's optional. Please reference the "showFormats" method of "FFAVParse" class.
extern NSString *const AVOptionNameAVProbeSize;     // set probing size (Must be an integer not lesser than 32, default is 5Mb)
extern NSString *const AVOptionNameAVAnalyzeduration;// Specify how many seconds are analyzed to probe the input. A higher value will enable detecting more accurate information, but will increase latency (It defaults to 5 seconds).

/**
 * HTTP(s) protocol
 */
extern NSString *const AVOptionNameHttpUserAgent;   // (HTTP) override User-Agent header
extern NSString *const AVOptionNameHttpHeader;      // (HTTP) set custom HTTP headers (a NSString or NSDictionary object)
extern NSString *const AVOptionNameHttpContentType; // (HTTP) force a content type
extern NSString *const AVOptionNameHttpTimeout;     // (HTTP) set timeout of socket I/O operations
extern NSString *const AVOptionNameHttpMimeType;    // (HTTP) set MIME type
extern NSString *const AVOptionNameHttpCookies;     // (HTTP) set cookies to be sent in applicable future requests
extern NSString *const AVOptionNameHttpAuthType;    // (HTTP) set authentication type - ["none", "basic"]
extern NSString *const AVOptionNameHttpReconnect;   // (HTTP) auto reconnect after disconnect before EOF - [0, 1]
