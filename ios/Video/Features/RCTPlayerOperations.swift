import AVFoundation
import MediaAccessibility
import Promises

let RCTVideoUnset = -1

// MARK: - RCTPlayerOperations

/*!
 * Collection of mutating functions
 */
enum RCTPlayerOperations {
    static func setSideloadedText(player: AVPlayer?, textTracks: [TextTrack], criteria: SelectedTrackCriteria?) -> Promise<Void> {
        return Promise {
            let type = criteria?.type

            let trackCount: Int! = player?.currentItem?.tracks.count ?? 0

            // The first few tracks will be audio & video track
            var firstTextIndex = 0
            for i in 0 ..< trackCount where (player?.currentItem?.tracks[i].assetTrack?.hasMediaCharacteristic(.legible)) != nil {
                firstTextIndex = i
                break
            }

            var selectedTrackIndex: Int = RCTVideoUnset

            if type == "disabled" {
                // Select the last text index which is the disabled text track
                selectedTrackIndex = trackCount - firstTextIndex
            } else if type == "language" {
                let selectedValue = criteria?.value as? String
                for i in 0 ..< textTracks.count {
                    let currentTextTrack = textTracks[i]
                    if selectedValue == currentTextTrack.language {
                        selectedTrackIndex = i
                        break
                    }
                }
            } else if type == "title" {
                let selectedValue = criteria?.value as? String
                for i in 0 ..< textTracks.count {
                    let currentTextTrack = textTracks[i]
                    if selectedValue == currentTextTrack.title {
                        selectedTrackIndex = i
                        break
                    }
                }
            } else if type == "index" {
                if let value = criteria?.value, let index = value as? Int {
                    if textTracks.count > index {
                        selectedTrackIndex = index
                    }
                }
            }

            // in the situation that a selected text track is not available (eg. specifies a textTrack not available)
            if (type != "disabled") && selectedTrackIndex == RCTVideoUnset {
                let captioningMediaCharacteristics = MACaptionAppearanceCopyPreferredCaptioningMediaCharacteristics(.user)
                let captionSettings = captioningMediaCharacteristics as? [AnyHashable]
                if (captionSettings?.contains(AVMediaCharacteristic.transcribesSpokenDialogForAccessibility)) != nil {
                    selectedTrackIndex = 0 // If we can't find a match, use the first available track
                    let systemLanguage = NSLocale.preferredLanguages.first
                    for i in 0 ..< textTracks.count {
                        let currentTextTrack = textTracks[i]
                        if systemLanguage == currentTextTrack.language {
                            selectedTrackIndex = i
                            break
                        }
                    }
                }
            }

            for i in firstTextIndex ..< trackCount {
                var isEnabled = false
                if selectedTrackIndex != RCTVideoUnset {
                    isEnabled = i == selectedTrackIndex + firstTextIndex
                }
                player?.currentItem?.tracks[i].isEnabled = isEnabled
            }
        }
    }

    // UNUSED
    static func setStreamingText(player: AVPlayer?, criteria: SelectedTrackCriteria?) {
        let type = criteria?.type
        var mediaOption: AVMediaSelectionOption!

        RCTVideoAssetsUtils.getMediaSelectionGroup(asset: player?.currentItem?.asset, for: .legible).then { group in
            guard let group else { return }

            if type == "disabled" {
                // Do nothing. We want to ensure option is nil
            } else if (type == "language") || (type == "title") {
                let value = criteria?.value as? String
                for i in 0 ..< group.options.count {
                    let currentOption: AVMediaSelectionOption! = group.options[i]
                    var optionValue: String!
                    if type == "language" {
                        optionValue = currentOption.extendedLanguageTag
                    } else {
                        optionValue = currentOption.commonMetadata.map(\.value)[0] as! String
                    }
                    if value == optionValue {
                        mediaOption = currentOption
                        break
                    }
                }
                // } else if ([type isEqualToString:@"default"]) {
                //  option = group.defaultOption; */
            } else if type == "index" {
                if let value = criteria?.value, let index = value as? Int {
                    if group.options.count > index {
                        mediaOption = group.options[index]
                    }
                }
            } else { // default. invalid type or "system"
                #if os(tvOS)
                // Do noting. Fix for tvOS native audio menu language selector
                #else
                    player?.currentItem?.selectMediaOptionAutomatically(in: group)
                    return
                #endif
            }

            #if os(tvOS)
            // Do noting. Fix for tvOS native audio menu language selector
            #else
                // If a match isn't found, option will be nil and text tracks will be disabled
                player?.currentItem?.select(mediaOption, in: group)
            #endif
        }
    }

    static func setMediaSelectionTrackForCharacteristic(player: AVPlayer?, characteristic: AVMediaCharacteristic, criteria: SelectedTrackCriteria?) {
        let type = criteria?.type
        var mediaOption: AVMediaSelectionOption!

        RCTVideoAssetsUtils.getMediaSelectionGroup(asset: player?.currentItem?.asset, for: characteristic).then { group in
            guard let group else { return }

            if type == "disabled" {
                // Do nothing. We want to ensure option is nil
            } else if (type == "language") || (type == "title") {
                let value = criteria?.value as? String
                for i in 0 ..< group.options.count {
                    let currentOption: AVMediaSelectionOption! = group.options[i]
                    var optionValue: String!
                    if type == "language" {
                        optionValue = currentOption.extendedLanguageTag
                    } else {
                        optionValue = currentOption.commonMetadata.map(\.value)[0] as? String
                    }
                    if value == optionValue {
                        mediaOption = currentOption
                        break
                    }
                }
                // } else if ([type isEqualToString:@"default"]) {
                //  option = group.defaultOption; */
            } else if type == "index" {
                if let value = criteria?.value, let index = value as? Int {
                    if group.options.count > index {
                        mediaOption = group.options[index]
                    }
                }
            } else { // default. invalid type or "system"
                player?.currentItem?.selectMediaOptionAutomatically(in: group)
                return
            }

            // If a match isn't found, option will be nil and text tracks will be disabled
            player?.currentItem?.select(mediaOption, in: group)
        }
    }

    static func seek(player: AVPlayer, playerItem: AVPlayerItem, paused: Bool, seekTime: Float, seekTolerance: Float) -> Promise<Bool> {
        let timeScale = 1000
        let cmSeekTime: CMTime = CMTimeMakeWithSeconds(Float64(seekTime), preferredTimescale: Int32(timeScale))
        let current: CMTime = playerItem.currentTime()
        let tolerance: CMTime = CMTimeMake(value: Int64(seekTolerance), timescale: Int32(timeScale))

        return Promise<Bool>(on: .global()) { fulfill, reject in
            guard CMTimeCompare(current, cmSeekTime) != 0 else {
                reject(NSError(domain: "", code: 0, userInfo: nil))
                return
            }
            if !paused { player.pause() }

            player.seek(to: cmSeekTime, toleranceBefore: tolerance, toleranceAfter: tolerance, completionHandler: { (finished: Bool) in
                fulfill(finished)
            })
        }
    }

    static func configureAudio(ignoreSilentSwitch: String, mixWithOthers: String, audioOutput: String) {
        let audioSession: AVAudioSession! = AVAudioSession.sharedInstance()
        var category: AVAudioSession.Category?
        var options: AVAudioSession.CategoryOptions?

        if ignoreSilentSwitch == "ignore" {
            category = audioOutput == "earpiece" ? AVAudioSession.Category.playAndRecord : AVAudioSession.Category.playback
        } else if ignoreSilentSwitch == "obey" {
            category = AVAudioSession.Category.ambient
        }

        if mixWithOthers == "mix" {
            options = .mixWithOthers
        } else if mixWithOthers == "duck" {
            options = .duckOthers
        }

        if let category, let options {
            do {
                try audioSession.setCategory(category, options: options)
            } catch {
                debugPrint("[RCTPlayerOperations] Problem setting up AVAudioSession category and options. Error: \(error).")
                #if !os(tvOS)
                    // Handle specific set category and option combination error
                    // setCategory:AVAudioSessionCategoryPlayback withOptions:mixWithOthers || duckOthers
                    // Failed to set category, error: 'what' Error Domain=NSOSStatusErrorDomain
                    // https://developer.apple.com/forums/thread/714598
                    if #available(iOS 16.0, *) {
                        do {
                            debugPrint("[RCTPlayerOperations] Reseting AVAudioSession category to playAndRecord with defaultToSpeaker options.")
                            try audioSession.setCategory(
                                audioOutput == "earpiece" ? AVAudioSession.Category.playAndRecord : AVAudioSession.Category.playback,
                                options: AVAudioSession.CategoryOptions.defaultToSpeaker
                            )
                        } catch {
                            debugPrint("[RCTPlayerOperations] Reseting AVAudioSession category and options problem. Error: \(error).")
                        }
                    }
                #endif
            }
        } else if let category, options == nil {
            do {
                try audioSession.setCategory(category)
            } catch {
                debugPrint("[RCTPlayerOperations] Problem setting up AVAudioSession category. Error: \(error).")
            }
        } else if category == nil, let options {
            do {
                try audioSession.setCategory(audioSession.category, options: options)
            } catch {
                debugPrint("[RCTPlayerOperations] Problem setting up AVAudioSession options. Error: \(error).")
            }
        }
    }
}
