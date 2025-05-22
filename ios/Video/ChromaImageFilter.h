//
//  ChromaImageFilter.h
//  RCTVideo
//
//  Created by Kushagra Gupta on 04/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#include <AVFoundation/AVFoundation.h>
#import <CoreImage/CoreImage.h>


@interface ChromaImageFilter: CIFilter {
    CIImage *inputImage;
}

@property (retain, nonatomic) CIImage *inputImage;
//@property (retain, nonatomic) CIImage *maskImage;
//@property (class, nonatomic, assign) CIColorKernel *kernel;

@end

