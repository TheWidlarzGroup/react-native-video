#ifdef RCT_NEW_ARCH_ENABLED
#import <react/renderer/components/RNCVideo/Props.h>

using namespace facebook::react;

inline bool isSrcHeadersEqual(const std::vector<RNCVideoSrcRequestHeadersStruct> &prev, const std::vector<RNCVideoSrcRequestHeadersStruct> &next) {
    if (prev.size() != next.size()) return false;
    
    auto comparator = [](const RNCVideoSrcRequestHeadersStruct &a, const RNCVideoSrcRequestHeadersStruct &b) {
            return a.key < b.key;
        };
    
    std::vector<RNCVideoSrcRequestHeadersStruct> header1 = prev;
    std::vector<RNCVideoSrcRequestHeadersStruct> header2 = next;
    
    std::sort(header1.begin(), header1.end(), comparator);
    std::sort(header2.begin(), header2.end(), comparator);
    
    for (size_t i = 0; i < header1.size(); i++) {
            if (header1[i].key != header2[i].key || header1[i].value != header2[i].value) {
                return false;
            }
        }

    return true;
}

inline bool isDrmHeadersEqual(const std::vector<RNCVideoDrmHeadersStruct> &prev, const std::vector<RNCVideoDrmHeadersStruct> &next) {
    if (prev.size() != next.size()) return false;
    
    auto comparator = [](const RNCVideoDrmHeadersStruct &a, const RNCVideoDrmHeadersStruct &b) {
            return a.key < b.key;
        };
    
    std::vector<RNCVideoDrmHeadersStruct> header1 = prev;
    std::vector<RNCVideoDrmHeadersStruct> header2 = next;
    
    std::sort(header1.begin(), header1.end(), comparator);
    std::sort(header2.begin(), header2.end(), comparator);
    
    for (size_t i = 0; i < header1.size(); i++) {
            if (header1[i].key != header2[i].key || header1[i].value != header2[i].value) {
                return false;
            }
        }

    return true;
}

inline bool isSrcStructEqual(const RNCVideoSrcStruct &prev, const RNCVideoSrcStruct &next) {
    bool isEqualHeaders = isSrcHeadersEqual(prev.requestHeaders, next.requestHeaders);
    
    return prev.uri == next.uri && prev.isNetwork == next.isNetwork && prev.isAsset == next.isAsset && prev.shouldCache == next.shouldCache && prev.type == next.type && isEqualHeaders;
}

inline bool isDrmStructEqual(const RNCVideoDrmStruct &prev, const RNCVideoDrmStruct &next) {
    bool isEqualHeaders = isDrmHeadersEqual(prev.headers, next.headers);
    
    return toString(prev.drmType) == toString(next.drmType) && prev.licenseServer == next.licenseServer && prev.contentId == next.contentId && prev.certificateUrl == next.certificateUrl && prev.base64Certificate == next.base64Certificate && isEqualHeaders;
}

inline bool isTextTracksVectorEqual(const std::vector<RNCVideoTextTracksStruct> &prev, const std::vector<RNCVideoTextTracksStruct> &next) {
    if (prev.size() != next.size())
        {
            return false;
        }
    
    auto comparator = [](const RNCVideoTextTracksStruct &a, const RNCVideoTextTracksStruct &b) {
        if (a.title != b.title) {
            return a.title < b.title;
        }
        if (a.language != b.language) {
            return a.language < b.language;
        }
        if (a.type != b.type) {
            return a.type < b.type;
        }
        return a.uri < b.uri;
    };
    
    std::vector<RNCVideoTextTracksStruct> sortedPrevTracks = prev;
    std::sort(sortedPrevTracks.begin(), sortedPrevTracks.end(), comparator);
    std::vector<RNCVideoTextTracksStruct> sortedNextTracks = next;
    std::sort(sortedNextTracks.begin(), sortedNextTracks.end(), comparator);
    
    for (int i = 0; i < sortedPrevTracks.size(); i++) {
        const RNCVideoTextTracksStruct& prevTrack = sortedPrevTracks[i];
        const RNCVideoTextTracksStruct& nextTrack = sortedNextTracks[i];

        if (prevTrack.title != nextTrack.title ||
            prevTrack.language != nextTrack.language ||
            prevTrack.type != nextTrack.type ||
            prevTrack.uri != nextTrack.uri) {
            return false;
        }
    }

        return true;
}

inline bool isSelectedTextTrackStructEqual(const RNCVideoSelectedTextTrackStruct &prev, const RNCVideoSelectedTextTrackStruct &next) {
    return prev.selectedTextType == next.selectedTextType && prev.value == next.value && prev.index == next.index;
}

inline bool isSelectedAudioTrackStructEqual(const RNCVideoSelectedAudioTrackStruct &prev, const RNCVideoSelectedAudioTrackStruct &next) {
    return prev.selectedAudioType == next.selectedAudioType && prev.value == next.value && prev.index == next.index;
}


#endif
