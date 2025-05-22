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
"  vec3 screenPrimary = step(fmax1, screen.rgb);\n"
"  vec3 pixelPrimary = step(fmax, sourcePixel.rgb);\n"
"  float secondaryComponents = dot(1.0 - pixelPrimary, sourcePixel.rgb);\n"
"  float screenSat = fmax - mix(secondaryComponents - fmin, secondaryComponents / 2.0, 1.0);\n"
"  float pixelSat = fmax - mix(secondaryComponents - fmin, secondaryComponents / 2.0, 1.0);\n"
"  float diffPrimary = dot(abs(pixelPrimary - screenPrimary), vec3(1.0));\n"
"  float solid = step(1.0, step(pixelSat, 0.1) + step(fmax, 0.1) + diffPrimary);\n"
"  vec4 pixel =  vec4(s.r, s.g, s.b, 1.0);\n"
"   if(solid == 0.0)\n"
"   {\n"
"   pixel = vec4(s.r, s.g, s.b, 0.0);\n"
"   }\n"
"    return pixel;"
"\n}";

//"  vec4 screen = vec4(0.0,1.0,0.0,1.0);\n"
//"  vec4 sourcePixel = vec4(r,g,b,1.0);\n"
//"  float fmax1 = max(max(screen.r, screen.g), screen.b);\n"
//"  vec3 screenPrimary = step(fmax1, screen.rgb);\n"
//"  vec3 pixelPrimary = step(fmax, sourcePixel.rgb);\n"
//"  float secondaryComponents = dot(1.0 - pixelPrimary, sourcePixel.rgb);\n"
//"  float screenSat = fmax - mix(secondaryComponents - fmin, secondaryComponents / 2.0, 1.0);\n"
//"  float pixelSat = fmax - mix(secondaryComponents - fmin, secondaryComponents / 2.0, 1.0);\n"
//"  float diffPrimary = dot(abs(pixelPrimary - screenPrimary), vec3(1.0));\n"
//"  float solid = step(1.0, step(pixelSat, 0.1) + step(fmax, 0.1) + diffPrimary);\n"
//"  vec4 pixel =  vec4(r, g, b, 1.0);\n"
//"   if(solid == 0.0)\n"
//"   {\n"
//"   pixel = vec4(r, g, b, 0.0);\n"
//"   }\n"
//
//"   " FRAGMENT_SHADER_COLOR " = pixel;\n"
//"  }\n";

@implementation ChromaImageFilter

+ (CIColorKernel *) kernel {
//    return [CIColorKernel kernelWithString:@"kernel vec4 alphaFrame(__sample s) {\nreturn vec4( s.rgb, 1.0 );\n}"];
    return [CIColorKernel kernelWithString:[NSString stringWithCString:kI420FragmentShaderSource encoding:NSASCIIStringEncoding]];
}

@synthesize inputImage;
//@synthesize maskImage;

- (CIImage *) outputImage
{
    CIColorKernel *kernel = [ChromaImageFilter kernel];
    
//    if (!inputImage || !maskImage) {
//        return nil;
//    }
    
    NSArray *args = [NSArray arrayWithObjects:(id)inputImage, nil];
    
    return [kernel applyWithExtent:inputImage.extent arguments:args];
}

@end

