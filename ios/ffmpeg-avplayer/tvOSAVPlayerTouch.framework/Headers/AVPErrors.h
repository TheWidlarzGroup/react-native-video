//
//  AVPErrors.h
//  AVPlayerTouch
//
//  Created by apple on 15/10/9.
//  Copyright © 2015年 apple. All rights reserved.
//

#import <Foundation/Foundation.h>

extern NSString *const AVPErrorDomain;

NS_ENUM(NSInteger) {
  AVPErrorInvalidLicense = -1500,
  AVPErrorExpiredLicense,

  /*
   * FFmpeg component error codes
   */
  AVPErrorFFmpegUnknown = -2000,
  AVPErrorFFmpegBSFNotFound,
  AVPErrorFFmpegBUG,
  AVPErrorFFmpegBufferToolSmall,
  AVPErrorFFmpegDecoderNotFound,
  AVPErrorFFmpegDemuxerNotFound,
  AVPErrorFFmpegEOF,
  AVPErrorFFmpegExit,
  AVPErrorFFmpegExternal,
  AVPErrorFFmpegInvalidData,
  AVPErrorFFmpegOptionNotFound,
  AVPErrorFFmpegProtocolNotFound,
  AVPErrorFFmpegStreamNotFound,
  AVPErrorFFmpegExperimental,
  AVPErrorFFmpegInputChanged,

  AVPErrorFFmpegHttpBadRequest,
  AVPErrorFFmpegHttpUnauthorized,
  AVPErrorFFmpegHttpForbidden,
  AVPErrorFFmpegHttpNotFound,
  AVPErrorFFmpegHttpOther4XX,
  AVPErrorFFmpegHttpServerError,
};