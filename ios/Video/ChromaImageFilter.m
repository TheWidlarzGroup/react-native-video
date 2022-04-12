//
//  ChromaImageFilter.m
//  RCTVideo
//
//  Created by Kushagra Gupta on 04/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ChromaImageFilter.h"

static const char kI420FragmentShaderSource[] =
"kernel vec4 alphaFrame(__sample s) {"
"  float fmin = min(min(s.r, s.g), s.b);\n"
"  float fmax = max(max(s.r, s.g), s.b);\n"
"  vec4 screen = vec4(0.0,1.0,0.0,1.0);\n"
"  vec4 sourcePixel = vec4(s.r,s.g,s.b,1.0);\n"
"  float fmax1 = max(max(screen.r, screen.g), screen.b);\n"
"  float fmin1 = min(min(screen.r, screen.g), screen.b);\n"
"  vec3 screenPrimary = step(fmax1, screen.rgb);\n"
"  vec3 pixelPrimary = step(fmax, sourcePixel.rgb);\n"
"  float secondaryComponents = dot(1.0 - pixelPrimary, sourcePixel.rgb);\n"
"  float secondaryComponents1 = dot(1.0 - screenPrimary, screen.rgb);\n"
"  float screenSat = fmax1 - mix(secondaryComponents1 - fmin1, secondaryComponents1 / 2.0, 1.0);\n"
"  float pixelSat = fmax - mix(secondaryComponents - fmin, secondaryComponents / 2.0, 1.0);\n"
"  float diffPrimary = dot(abs(pixelPrimary - screenPrimary), vec3(1.0));\n"
"  float solid = step(1.0, step(pixelSat, 0.1) + step(fmax, 0.1) + diffPrimary);\n"
"  float alpha = max(0.0, 1.0 - pixelSat / screenSat);\n"
"  alpha = smoothstep(0.0, 1.0, alpha);\n"
"  vec4 semiTransparentPixel = vec4((sourcePixel.rgb - (1.0 - alpha) * screen.rgb * 1.0) / max(0.00001, alpha), alpha);\n"
"  vec4 pixel = mix(semiTransparentPixel, sourcePixel, solid);\n"
"  if (pixel.a < 0.1) { \n"
"   pixel = vec4(1.0,1.0,1.0, 0.0); \n"
"  }\n"
"    return pixel;"
"\n}";

@implementation ChromaImageFilter

+ (CIColorKernel *) kernel {
    static CIColorKernel *kernel;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        kernel = [CIColorKernel kernelWithString:[NSString stringWithCString:kI420FragmentShaderSource encoding:NSASCIIStringEncoding]];
    });
    return kernel;
}

@synthesize inputImage;
//@synthesize maskImage;

- (CIImage *) outputImage
{
    if (!inputImage) {
        return nil;
    }
    
    NSArray *args = [NSArray arrayWithObjects:(id)inputImage, nil];
    
    return [self.class.kernel applyWithExtent:inputImage.extent arguments:args];
}

@end

