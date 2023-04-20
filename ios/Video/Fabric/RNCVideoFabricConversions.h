#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <react/renderer/components/RNCVideo/Props.h>

using namespace facebook::react;

inline NSDictionary *srcDictFromCppStruct(const RNCVideoSrcStruct &src) {
    NSString * uri = RCTNSStringFromStringNilIfEmpty(src.uri) ?: @"";
    NSString * type = RCTNSStringFromStringNilIfEmpty(src.type) ?: @"";
    
    return @{
        @"uri": uri,
        @"isNetwork": @(src.isNetwork),
        @"isAsset": @(src.isAsset),
        @"shouldCache": @(src.shouldCache),
        @"type": type,
        @"startTime": @(src.startTime),
        @"endTime": @(src.endTime)
    };
}

inline NSDictionary *drmHeadersFromCppVector(const std::vector<RNCVideoDrmHeadersStruct> &vector) {
    NSMutableDictionary *drmHeader = [NSMutableDictionary dictionaryWithCapacity:vector.size()];
    
    for (const RNCVideoDrmHeadersStruct &header : vector) {
        NSString *key = RCTNSStringFromString(header.key);
        NSString *value = RCTNSStringFromString(header.value);
        
        [drmHeader setObject:value forKey:key];
    }
    
    return drmHeader;
}

inline NSDictionary *drmDictFromCppStruct(const RNCVideoDrmStruct &drm) {
    NSDictionary *headers = drmHeadersFromCppVector(drm.headers);
    
    return @{
        @"type": RCTNSStringFromStringNilIfEmpty(toString(drm.drmType)) ?: @"",
        @"headers": headers,
        @"licenseServer": RCTNSStringFromStringNilIfEmpty(drm.licenseServer) ?: @"",
        @"contentId": RCTNSStringFromStringNilIfEmpty(drm.contentId) ?: @"",
        @"certificateUrl": RCTNSStringFromStringNilIfEmpty(drm.certificateUrl) ?: @"",
        @"base64Certificate": @(drm.base64Certificate),
    };
}

inline NSArray *textTracksArrayFromCppVector(const std::vector<RNCVideoTextTracksStruct> &vector) {
    NSMutableArray *array = [NSMutableArray arrayWithCapacity:vector.size()];
    
    for (const RNCVideoTextTracksStruct &textTrack : vector) {
        NSDictionary *dict = @{
            @"title": RCTNSStringFromStringNilIfEmpty(textTrack.title) ?: @"",
            @"language": RCTNSStringFromStringNilIfEmpty(textTrack.language) ?: @"",
            @"type": RCTNSStringFromStringNilIfEmpty(textTrack.type) ?: @"",
            @"uri": RCTNSStringFromStringNilIfEmpty(textTrack.uri) ?: @"",
        };
        
        [array addObject:dict];
    }
    return array;
}

inline NSDictionary *selectedTextTrackDictFromCppStruct(const RNCVideoSelectedTextTrackStruct &textTrack) {
    NSString *type = RCTNSStringFromString(toString(textTrack.selectedTextType));
    
    if ([type isEqualToString:@"title"] || [type isEqualToString:@"language"]) {
        return @{
            @"type": type,
            @"value": RCTNSStringFromStringNilIfEmpty(textTrack.value) ?: @"",
        };
    } else if ([type isEqualToString:@"index"]) {
        return @{
            @"type": type,
            @"value": @(textTrack.index)
        };
    }
    return @{
        @"type": type,
    };
}

inline NSDictionary *selectedAudioTrackDictFromCppStruct(const RNCVideoSelectedAudioTrackStruct &audioTrack) {
    NSString *type = RCTNSStringFromString(toString(audioTrack.selectedAudioType));
    
    if ([type isEqualToString:@"title"] || [type isEqualToString:@"language"]) {
        return @{
            @"type": type,
            @"value": RCTNSStringFromStringNilIfEmpty(audioTrack.value) ?: @"",
        };
    } else if ([type isEqualToString:@"index"]) {
        return @{
            @"type": type,
            @"value": @(audioTrack.index)
        };
    }
    return @{
        @"type": type,
    };
}

#endif
