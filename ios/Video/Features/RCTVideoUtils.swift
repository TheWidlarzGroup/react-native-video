import AVFoundation
import Promises
import Photos

/*!
 * Collection of pure functions
 */
enum RCTVideoUtils {
    
    /*!
     * Calculates and returns the playable duration of the current player item using its loaded time ranges.
     *
     * \returns The playable duration of the current player item in seconds.
     */
    static func calculatePlayableDuration(_ player:AVPlayer?, withSource source:VideoSource?) -> NSNumber {
        guard let player = player,
              let video:AVPlayerItem = player.currentItem,
              video.status == AVPlayerItem.Status.readyToPlay else {
            return 0
        }
        
        if (source?.startTime != nil && source?.endTime != nil) {
            return NSNumber(value: (Float64(source?.endTime ?? 0) - Float64(source?.startTime ?? 0)) / 1000)
        }
        
        var effectiveTimeRange:CMTimeRange?
        for (_, value) in video.loadedTimeRanges.enumerated() {
            let timeRange:CMTimeRange = value.timeRangeValue
            if CMTimeRangeContainsTime(timeRange, time: video.currentTime()) {
                effectiveTimeRange = timeRange
                break
            }
        }
        
        if let effectiveTimeRange = effectiveTimeRange {
            let playableDuration:Float64 = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange))
            if playableDuration > 0 {
                if (source?.startTime != nil) {
                    return NSNumber(value: (playableDuration - Float64(source?.startTime ?? 0) / 1000))
                }
                
                return playableDuration as NSNumber
            }
        }
        
        return 0
    }

    static func urlFilePath(filepath:NSString!, searchPath:FileManager.SearchPathDirectory) -> NSURL! {
        if filepath.contains("file://") {
            return NSURL(string: filepath as String)
        }
        
        // if no file found, check if the file exists in the Document directory
        let paths:[String]! = NSSearchPathForDirectoriesInDomains(searchPath, .userDomainMask, true)
        var relativeFilePath:String! = filepath.lastPathComponent
        // the file may be multiple levels below the documents directory
        let directoryString:String! = searchPath == .cachesDirectory ? "Library/Caches/" : "Documents";
        let fileComponents:[String]! = filepath.components(separatedBy: directoryString)
        if fileComponents.count > 1 {
            relativeFilePath = fileComponents[1]
        }
        
        let path:String! = (paths.first! as NSString).appendingPathComponent(relativeFilePath)
        if FileManager.default.fileExists(atPath: path) {
            return NSURL.fileURL(withPath: path) as NSURL
        }
        return nil
    }
    
    static func playerItemSeekableTimeRange(_ player:AVPlayer?) -> CMTimeRange {
        if let playerItem = player?.currentItem,
           playerItem.status == .readyToPlay,
           let firstItem = playerItem.seekableTimeRanges.first {
            return firstItem.timeRangeValue
        }
        
        return (CMTimeRange.zero)
    }
    
    static func playerItemDuration(_ player:AVPlayer?) -> CMTime {
        if let playerItem = player?.currentItem,
           playerItem.status == .readyToPlay {
            return(playerItem.duration)
        }
        
        return(CMTime.invalid)
    }
    
    static func calculateSeekableDuration(_ player:AVPlayer?) -> NSNumber {
        let timeRange:CMTimeRange = RCTVideoUtils.playerItemSeekableTimeRange(player)
        if CMTIME_IS_NUMERIC(timeRange.duration)
        {
            return NSNumber(value: CMTimeGetSeconds(timeRange.duration))
        }
        return 0
    }
    
    static func getAudioTrackInfo(_ player:AVPlayer?) -> [AnyObject]! {
        guard let player = player else {
            return []
        }

        let audioTracks:NSMutableArray! = NSMutableArray()
        let group = player.currentItem?.asset.mediaSelectionGroup(forMediaCharacteristic: .audible)
        for i in 0..<(group?.options.count ?? 0) {
            let currentOption = group?.options[i]
            var title = ""
            let values = currentOption?.commonMetadata.map(\.value)
            if (values?.count ?? 0) > 0, let value = values?[0] {
                title = value as! String
            }
            let language:String! = currentOption?.extendedLanguageTag ?? ""

            let selectedOption: AVMediaSelectionOption? = player.currentItem?.currentMediaSelection.selectedMediaOption(in: group!)

            let audioTrack = [
                "index": NSNumber(value: i),
                "title": title,
                "language": language ?? "",
                "selected": currentOption?.displayName == selectedOption?.displayName
            ] as [String : Any]
            audioTracks.add(audioTrack)
        }
        return audioTracks as [AnyObject]?
    }
    
    static func getTextTrackInfo(_ player:AVPlayer?) -> [TextTrack]! {
        guard let player = player else {
            return []
        }

        // if streaming video, we extract the text tracks
        var textTracks:[TextTrack] = []
        let group = player.currentItem?.asset.mediaSelectionGroup(forMediaCharacteristic: .legible)
        for i in 0..<(group?.options.count ?? 0) {
            let currentOption = group?.options[i]
            var title = ""
            let values = currentOption?.commonMetadata.map(\.value)
            if (values?.count ?? 0) > 0, let value = values?[0] {
                title = value as! String
            }
            let language:String! = currentOption?.extendedLanguageTag ?? ""
            let selectedOpt = player.currentItem?.currentMediaSelection
            let selectedOption: AVMediaSelectionOption? = player.currentItem?.currentMediaSelection.selectedMediaOption(in: group!)
            let textTrack = TextTrack([
                "index": NSNumber(value: i),
                "title": title,
                "language": language,
                "selected": currentOption?.displayName == selectedOption?.displayName
            ])
            textTracks.append(textTrack)
        }
        return textTracks
    }
    
    // UNUSED
    static func getCurrentTime(playerItem:AVPlayerItem?) -> Float {
        return Float(CMTimeGetSeconds(playerItem?.currentTime() ?? .zero))
    }
    
    static func base64DataFromBase64String(base64String:String?) -> Data? {
        if let base64String = base64String {
            return Data(base64Encoded:base64String)
        }
        return nil
    }

    static func replaceURLScheme(url: URL, scheme: String?) -> URL? {
        var urlComponents = URLComponents(url: url, resolvingAgainstBaseURL: false)
        urlComponents?.scheme = scheme

        return urlComponents?.url
    }

    static func extractDataFromCustomSchemeUrl(from url: URL, scheme: String) -> Data? {
        guard url.scheme == scheme,
              let adoptURL = RCTVideoUtils.replaceURLScheme(url:url, scheme: nil) else { return nil }

        return Data(base64Encoded: adoptURL.absoluteString)
    }
    
    static func generateMixComposition(_ asset:AVAsset) -> AVMutableComposition {
        let mixComposition:AVMutableComposition = AVMutableComposition()
        
        let videoAsset:AVAssetTrack! = asset.tracks(withMediaType: AVMediaType.video).first
        let videoCompTrack:AVMutableCompositionTrack! = mixComposition.addMutableTrack(withMediaType: AVMediaType.video, preferredTrackID:kCMPersistentTrackID_Invalid)
        do {
            try videoCompTrack.insertTimeRange(
                CMTimeRangeMake(start: .zero, duration: videoAsset.timeRange.duration),
                of: videoAsset,
                at: .zero)
        } catch {
        }
        
        let audioAsset:AVAssetTrack! = asset.tracks(withMediaType: AVMediaType.audio).first
        let audioCompTrack:AVMutableCompositionTrack! = mixComposition.addMutableTrack(withMediaType: AVMediaType.audio, preferredTrackID:kCMPersistentTrackID_Invalid)
        do {
            try audioCompTrack.insertTimeRange(
                CMTimeRangeMake(start: .zero, duration: videoAsset.timeRange.duration),
                of: audioAsset,
                at: .zero)
        } catch {
        }
        
        return mixComposition
    }
    
    static func getValidTextTracks(asset:AVAsset, assetOptions:NSDictionary?, mixComposition:AVMutableComposition, textTracks:[TextTrack]?) -> [TextTrack] {
        let videoAsset:AVAssetTrack! = asset.tracks(withMediaType: AVMediaType.video).first
        var validTextTracks:[TextTrack] = []
        
        if let textTracks = textTracks, textTracks.count > 0 {
            for i in 0..<textTracks.count {
                var textURLAsset:AVURLAsset!
                let textUri:String = textTracks[i].uri
                if textUri.lowercased().hasPrefix("http") {
                    textURLAsset = AVURLAsset(url: NSURL(string: textUri)! as URL, options:(assetOptions as! [String : Any]))
                } else {
                    let isDisabledTrack:Bool! = textTracks[i].type == "disabled"
                    let searchPath:FileManager.SearchPathDirectory = isDisabledTrack ? .cachesDirectory : .documentDirectory;
                    textURLAsset = AVURLAsset(url: RCTVideoUtils.urlFilePath(filepath: textUri as NSString?, searchPath: searchPath) as URL, options:nil)
                }
                let textTrackAsset:AVAssetTrack! = textURLAsset.tracks(withMediaType: AVMediaType.text).first
                if (textTrackAsset == nil) {continue} // fix when there's no textTrackAsset
                validTextTracks.append(textTracks[i])
                let textCompTrack:AVMutableCompositionTrack! = mixComposition.addMutableTrack(withMediaType: AVMediaType.text,
                                                                                              preferredTrackID:kCMPersistentTrackID_Invalid)
                do {
                    try textCompTrack.insertTimeRange(
                        CMTimeRangeMake(start: .zero, duration: videoAsset.timeRange.duration),
                        of: textTrackAsset,
                        at: .zero)
                } catch {
                }
            }
        }
        
        let emptyVttFile:TextTrack? = self.createEmptyVttFile()
        if (emptyVttFile != nil) {
            validTextTracks.append(emptyVttFile!)
        }
        
        return validTextTracks
    }

    /*
     * Create an useless / almost empty VTT file in the list with available tracks. This track gets selected when you give type: "disabled" as the selectedTextTrack
     * This is needed because there is a bug where sideloaded texttracks cannot be disabled in the AVPlayer. Loading this VTT file instead solves that problem.
     * For more info see: https://github.com/react-native-community/react-native-video/issues/1144
     */
    static func createEmptyVttFile() -> TextTrack? {
        let fileManager = FileManager.default
        let cachesDirectoryUrl = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let filePath = cachesDirectoryUrl.appendingPathComponent("empty.vtt").path
        
        if !fileManager.fileExists(atPath: filePath) {
            let stringToWrite = "WEBVTT\n\n1\n99:59:59.000 --> 99:59:59.001\n."

            do {
                try stringToWrite.write(to: URL(fileURLWithPath: filePath), atomically: true, encoding: String.Encoding.utf8)
            } catch {
                return nil
            }
        }
        
        return TextTrack([
            "language": "disabled",
            "title": "EmptyVttFile",
            "type": "text/vtt",
            "uri": filePath,
        ])
    }
    
    static func delay(seconds: Int = 0) -> Promise<Void> {
        return Promise<Void>(on: .global()) { fulfill, reject in
            DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + Double(Int64(seconds)) / Double(NSEC_PER_SEC), execute: {
                fulfill(())
            })
        }
    }
    
    static func preparePHAsset(uri: String) -> Promise<AVAsset?> {
        return Promise<AVAsset?>(on: .global()) { fulfill, reject in
            let assetId = String(uri[uri.index(uri.startIndex, offsetBy: "ph://".count)...])
            guard let phAsset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: nil).firstObject else {
                reject(NSError(domain: "", code: 0, userInfo: nil))
                return
            }
            let options = PHVideoRequestOptions()
            options.isNetworkAccessAllowed = true
            PHCachingImageManager().requestAVAsset(forVideo: phAsset, options: options) { data, _, _ in
                fulfill(data)
            }
        }
    }
    
    static func prepareAsset(source:VideoSource) -> (asset:AVURLAsset?, assetOptions:NSMutableDictionary?)? {
        guard let sourceUri = source.uri, sourceUri != "" else { return nil }
        var asset:AVURLAsset!
        let bundlePath = Bundle.main.path(forResource: source.uri, ofType: source.type) ?? ""
        let url = source.isNetwork || source.isAsset
        ? URL(string: source.uri ?? "")
        : URL(fileURLWithPath: bundlePath)
        let assetOptions:NSMutableDictionary! = NSMutableDictionary()
        
        if source.isNetwork {
            if let headers = source.requestHeaders, headers.count > 0 {
                assetOptions.setObject(headers, forKey:"AVURLAssetHTTPHeaderFieldsKey" as NSCopying)
            }
            let cookies:[AnyObject]! = HTTPCookieStorage.shared.cookies
            assetOptions.setObject(cookies, forKey:AVURLAssetHTTPCookiesKey as NSCopying)
            asset = AVURLAsset(url: url!, options:assetOptions as! [String : Any])
        } else {
            asset = AVURLAsset(url: url!)
        }
        return (asset, assetOptions)
    }
}
