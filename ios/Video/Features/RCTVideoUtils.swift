import AVFoundation

/*!
 * Collection of pure functions
 */
enum RCTVideoUtils {
    
    /*!
     * Calculates and returns the playable duration of the current player item using its loaded time ranges.
     *
     * \returns The playable duration of the current player item in seconds.
     */
    static func calculatePlayableDuration(_ player:AVPlayer?) -> NSNumber {
        guard let player = player,
              let video:AVPlayerItem = player.currentItem,
              video.status == AVPlayerItem.Status.readyToPlay else {
            return 0
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
                return playableDuration as NSNumber
            }
        }
        
        return 0
    }

    static func urlFilePath(filepath:NSString!) -> NSURL! {
        if filepath.contains("file://") {
            return NSURL(string: filepath as String)
        }
        
        // if no file found, check if the file exists in the Document directory
        let paths:[String]! = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
        var relativeFilePath:String! = filepath.lastPathComponent
        // the file may be multiple levels below the documents directory
        let fileComponents:[String]! = filepath.components(separatedBy: "Documents/")
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
            let audioTrack = [
                "index": NSNumber(value: i),
                "title": title,
                "language": language
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
            let textTrack = TextTrack([
                "index": NSNumber(value: i),
                "title": title,
                "language": language
            ])
            textTracks.append(textTrack)
        }
        return textTracks
    }
    
    // UNUSED
    static func getCurrentTime(playerItem:AVPlayerItem?) -> Float {
        return Float(CMTimeGetSeconds(playerItem?.currentTime() ?? .zero))
    }
}
