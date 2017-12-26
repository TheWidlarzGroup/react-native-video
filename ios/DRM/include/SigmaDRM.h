//
//  SigmaDRM.h
//  SigmaDRM
//
//  Created by NguyenVanSao on 12/21/17.
//  Copyright © 2017 NguyenVanSao. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVAssetResourceLoader.h>
#import <AVFoundation/AVAsset.h>

@interface SigmaDRM : NSObject
-(SigmaDRM *)initWithUrl:(NSString *)url;
-(AVURLAsset *)assset;
@end
