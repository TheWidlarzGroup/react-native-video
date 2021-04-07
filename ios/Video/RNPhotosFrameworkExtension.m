//
//  RNPhotosFrameworkExtension.m
//  react-native-video
//
//  Created by Hanno  Gödecke on 30.12.20.
//

#import "RNPhotosFrameworkExtension.h"

@implementation RNPhotosFrameworkExtension

-(NSString *)startLoadingPhotosAsset:(NSDictionary *)source bufferingCallback:(RCTBubblingEventBlock) onVideoBuffer andReactTag:(NSString *)reactTag andCompleteBlock:(RNPFVIdeoLoadCompleteBlock)completeBlock {
    NSURL *url = [RCTConvert NSURL:source[@"uri"]];
    if(self.imageRequestID != PHInvalidImageRequestID) {
        [[PHImageManager defaultManager] cancelImageRequest:self.imageRequestID];
        self.imageRequestID = PHInvalidImageRequestID;
    }
    if([url.scheme caseInsensitiveCompare:@"ph"] == NSOrderedSame) {
        NSString *localIdentifier = [url.absoluteString substringFromIndex:@"ph://".length];
        self.loadedPhotosLocalIdentifier = localIdentifier;
        PHVideoRequestOptions *videoRequestOptions = [self getVideoRequestOptionsFromUrl:url];

        videoRequestOptions.progressHandler = ^void (double progress, NSError *__nullable error, BOOL *stop, NSDictionary *__nullable info)
        {
            if(onVideoBuffer && self.loadedPhotosLocalIdentifier != nil && [localIdentifier isEqualToString:self.loadedPhotosLocalIdentifier] ) {
                onVideoBuffer(@{
                                @"isBuffering": @(YES),
                                @"progress" : @(progress),
                                @"target": reactTag
                                });
            }
        };
        [self loadPhotosVideoPlayerItem:localIdentifier andPhVideoRequestOptions:videoRequestOptions andSource:source andCompleteBlock:^(AVAsset * _Nullable asset, PHImageRequestID imageRequestID) {
            if(asset && completeBlock && self.loadedPhotosLocalIdentifier != nil && [localIdentifier isEqualToString:self.loadedPhotosLocalIdentifier]) {
                completeBlock(source, asset, imageRequestID);
            }
        }];
        return localIdentifier;
    }
    return nil;
}

-(void) loadPhotosVideoPlayerItem:(NSString *)localIdentifier andPhVideoRequestOptions:(PHVideoRequestOptions *)requestOptions andSource:(NSDictionary *)source andCompleteBlock:(void(^)(AVAsset * _Nullable avAsset, PHImageRequestID imageRequestID))completeBlock  {

    PHAsset *asset = [self getAssetFromOfLocalIdentifier:localIdentifier];
    if(asset == nil) {
        return [NSException raise:@"Invalid localIdentifier" format:@"Could not locate photos-asset with localIdentifier %@", localIdentifier];
    }
    self.imageRequestID = [[PHImageManager defaultManager] requestAVAssetForVideo:asset options:requestOptions resultHandler:^(AVAsset * _Nullable avAsset, AVAudioMix * _Nullable audioMix, NSDictionary * _Nullable info) {
        completeBlock(avAsset, self.imageRequestID);
    }];
}

-(PHVideoRequestOptions *)getVideoRequestOptionsFromUrl:(NSURL *)url {
    PHVideoRequestOptions *videoRequestOptions = [PHVideoRequestOptions new];
    videoRequestOptions.networkAccessAllowed = YES;

    NSURLComponents *urlComponents = [NSURLComponents componentsWithURL:url
                                                resolvingAgainstBaseURL:NO];
    NSArray *queryItems = urlComponents.queryItems;
    NSString *deliveryModeQuery = [self valueForKey:@"deliveryMode"
                                     fromQueryItems:queryItems];
    NSString *versionQuery = [self valueForKey:@"version"
                                fromQueryItems:queryItems];

    PHVideoRequestOptionsVersion version = PHVideoRequestOptionsVersionCurrent;

    if(versionQuery) {
        if([versionQuery isEqualToString:@"original"]) {
            version = PHVideoRequestOptionsVersionOriginal;
        }
    }

    PHVideoRequestOptionsDeliveryMode deliveryMode = PHVideoRequestOptionsDeliveryModeAutomatic;
    if(deliveryModeQuery != nil) {
        if([deliveryModeQuery isEqualToString:@"mediumQuality"]) {
            deliveryMode = PHVideoRequestOptionsDeliveryModeMediumQualityFormat;
        }
        else if([deliveryModeQuery isEqualToString:@"highQuality"]) {
            deliveryMode = PHVideoRequestOptionsDeliveryModeHighQualityFormat;
        }
        else if([deliveryModeQuery isEqualToString:@"fast"]) {
            deliveryMode = PHVideoRequestOptionsDeliveryModeFastFormat;
        }
    }
    videoRequestOptions.deliveryMode = deliveryMode;
    videoRequestOptions.version = version;


    return videoRequestOptions;
}

-(PHAsset *) getAssetFromOfLocalIdentifier:(NSString *)localIdentifier {
    PHFetchOptions *fetchOptions = [PHFetchOptions new];
    fetchOptions.includeHiddenAssets = YES;
    fetchOptions.includeAllBurstAssets = YES;
    return [[PHAsset fetchAssetsWithLocalIdentifiers:@[localIdentifier] options:fetchOptions] firstObject];
}

- (NSString *)valueForKey:(NSString *)key
           fromQueryItems:(NSArray *)queryItems
{
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"name=%@", key];
    NSURLQueryItem *queryItem = [[queryItems
                                  filteredArrayUsingPredicate:predicate]
                                 firstObject];
    return queryItem.value;
}

@end
