import AVFoundation
import MediaAccessibility
import Promises

let RCTVideoUnset = -1

/*!
 * Collection of mutating functions
 */
enum RCTPlayerOperations {
    
    static func setSideloadedText(player:AVPlayer?, textTracks:[TextTrack]?, criteria:SelectedTrackCriteria?) {
        let type = criteria?.type
        let textTracks:[TextTrack]! = textTracks ?? RCTVideoUtils.getTextTrackInfo(player)
        
        // The first few tracks will be audio & video track
        let firstTextIndex:Int = 0
        for firstTextIndex in 0..<(player?.currentItem?.tracks.count ?? 0) {
            if player?.currentItem?.tracks[firstTextIndex].assetTrack?.hasMediaCharacteristic(.legible) ?? false {
                break
            }
        }
        
        var selectedTrackIndex:Int = RCTVideoUnset
        
        if (type == "disabled") {
            // Do nothing. We want to ensure option is nil
        } else if (type == "language") {
            let selectedValue = criteria?.value as? String
            for i in 0..<textTracks.count {
                let currentTextTrack = textTracks[i]
                if (selectedValue == currentTextTrack.language) {
                    selectedTrackIndex = i
                    break
                }
            }
        } else if (type == "title") {
            let selectedValue = criteria?.value as? String
            for i in 0..<textTracks.count {
                let currentTextTrack = textTracks[i]
                if (selectedValue == currentTextTrack.title) {
                    selectedTrackIndex = i
                    break
                }
            }
        } else if (type == "index") {
            if let value = criteria?.value, let index = value as? Int {
                if textTracks.count > index {
                    selectedTrackIndex = index
                }
            }
        }
        
        // in the situation that a selected text track is not available (eg. specifies a textTrack not available)
        if (type != "disabled") && selectedTrackIndex == RCTVideoUnset {
            let captioningMediaCharacteristics = MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics(.user) as! CFArray
            let captionSettings = captioningMediaCharacteristics as? [AnyHashable]
            if ((captionSettings?.contains(AVMediaCharacteristic.transcribesSpokenDialogForAccessibility)) != nil) {
                selectedTrackIndex = 0 // If we can't find a match, use the first available track
                let systemLanguage = NSLocale.preferredLanguages.first
                for i in 0..<textTracks.count {
                    let currentTextTrack = textTracks[i]
                    if systemLanguage == currentTextTrack.language {
                        selectedTrackIndex = i
                        break
                    }
                }
            }
        }
        
        for i in firstTextIndex..<(player?.currentItem?.tracks.count ?? 0) {
            var isEnabled = false
            if selectedTrackIndex != RCTVideoUnset {
                isEnabled = i == selectedTrackIndex + firstTextIndex
            }
            player?.currentItem?.tracks[i].isEnabled = isEnabled
        }
    }
    
    // UNUSED
    static func setStreamingText(player:AVPlayer?, criteria:SelectedTrackCriteria?) {
        let type = criteria?.type
        let group:AVMediaSelectionGroup! = player?.currentItem?.asset.mediaSelectionGroup(forMediaCharacteristic: AVMediaCharacteristic.legible)
        var mediaOption:AVMediaSelectionOption!
        
        if (type == "disabled") {
            // Do nothing. We want to ensure option is nil
        } else if (type == "language") || (type == "title") {
            let value = criteria?.value as? String
            for i in 0..<group.options.count {
                let currentOption:AVMediaSelectionOption! = group.options[i]
                var optionValue:String!
                if (type == "language") {
                    optionValue = currentOption.extendedLanguageTag
                } else {
                    optionValue = currentOption.commonMetadata.map(\.value)[0] as! String
                }
                if (value == optionValue) {
                    mediaOption = currentOption
                    break
                }
            }
            //} else if ([type isEqualToString:@"default"]) {
            //  option = group.defaultOption; */
        } else if (type == "index") {
            if let value = criteria?.value, let index = value as? Int {
                if group.options.count > index {
                    mediaOption = group.options[index]
                }
            }
        } else { // default. invalid type or "system"
            #if TARGET_OS_TV
                // Do noting. Fix for tvOS native audio menu language selector
            #else
                player?.currentItem?.selectMediaOptionAutomatically(in: group)
                return
            #endif
        }
        
        #if TARGET_OS_TV
            // Do noting. Fix for tvOS native audio menu language selector
        #else
            // If a match isn't found, option will be nil and text tracks will be disabled
            player?.currentItem?.select(mediaOption, in:group)
        #endif
    }
    
    static func setMediaSelectionTrackForCharacteristic(player:AVPlayer?, characteristic:AVMediaCharacteristic, criteria:SelectedTrackCriteria?) {
        let type = criteria?.type
        let group:AVMediaSelectionGroup! = player?.currentItem?.asset.mediaSelectionGroup(forMediaCharacteristic: characteristic)
        var mediaOption:AVMediaSelectionOption!
        
        if (type == "disabled") {
            // Do nothing. We want to ensure option is nil
        } else if (type == "language") || (type == "title") {
            let value = criteria?.value as? String
            for i in 0..<group.options.count {
                let currentOption:AVMediaSelectionOption! = group.options[i]
                var optionValue:String!
                if (type == "language") {
                    optionValue = currentOption.extendedLanguageTag
                } else {
                    optionValue = currentOption.commonMetadata.map(\.value)[0] as? String
                }
                if (value == optionValue) {
                    mediaOption = currentOption
                    break
                }
            }
            //} else if ([type isEqualToString:@"default"]) {
            //  option = group.defaultOption; */
        } else if type == "index" {
            if let value = criteria?.value, let index = value as? Int {
                if group.options.count > index {
                    mediaOption = group.options[index]
                }
            }
        } else if let group = group { // default. invalid type or "system"
            player?.currentItem?.selectMediaOptionAutomatically(in: group)
            return
        }
        
        if let group = group {
            // If a match isn't found, option will be nil and text tracks will be disabled
            player?.currentItem?.select(mediaOption, in:group)
        }
        
    }

    static func seek(player: AVPlayer, playerItem:AVPlayerItem, paused:Bool, seekTime:Float, seekTolerance:Float) -> Promise<Bool> {
        let timeScale:Int = 1000
        let cmSeekTime:CMTime = CMTimeMakeWithSeconds(Float64(seekTime), preferredTimescale: Int32(timeScale))
        let current:CMTime = playerItem.currentTime()
        let tolerance:CMTime = CMTimeMake(value: Int64(seekTolerance), timescale: Int32(timeScale))
        
        return Promise<Bool>(on: .global()) { fulfill, reject in
            guard CMTimeCompare(current, cmSeekTime) != 0 else {
                reject(NSError())
                return
            }
            if !paused { player.pause() }

            player.seek(to: cmSeekTime, toleranceBefore:tolerance, toleranceAfter:tolerance, completionHandler:{ (finished:Bool) in
                fulfill(finished)
            })
        }
    }
    
    static func configureAudio(ignoreSilentSwitch:String, mixWithOthers:String) {
        let session:AVAudioSession! = AVAudioSession.sharedInstance()
        var category:AVAudioSession.Category? = nil
        var options:AVAudioSession.CategoryOptions? = nil
        
        if (ignoreSilentSwitch == "ignore") {
            category = AVAudioSession.Category.playback
        } else if (ignoreSilentSwitch == "obey") {
            category = AVAudioSession.Category.ambient
        }
        
        if (mixWithOthers == "mix") {
            options = .mixWithOthers
        } else if (mixWithOthers == "duck") {
            options = .duckOthers
        }
        
        if let category = category, let options = options {
            do {
                try session.setCategory(category, options: options)
            } catch {
            }
        } else if let category = category, options == nil {
            do {
                try session.setCategory(category)
            } catch {
            }
        } else if category == nil, let options = options {
            do {
                try session.setCategory(session.category, options: options)
            } catch {
            }
        }
    }
}
