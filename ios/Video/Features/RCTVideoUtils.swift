import AVFoundation
import Photos

// MARK: - RCTVideoAssetsUtils

enum RCTVideoAssetsUtils {
    static func getMediaSelectionGroup(
        asset: AVAsset?,
        for mediaCharacteristic: AVMediaCharacteristic
    ) async -> AVMediaSelectionGroup? {
        if #available(iOS 15, tvOS 15, visionOS 1.0, *) {
            do {
                guard let asset else {
                    return nil
                }

                return try await asset.loadMediaSelectionGroup(for: mediaCharacteristic)
            } catch {
                return nil
            }
        } else {
            #if !os(visionOS)
                return asset?.mediaSelectionGroup(forMediaCharacteristic: mediaCharacteristic)
            #endif
        }
    }

    static func getTracks(asset: AVAsset, withMediaType: AVMediaType) async -> [AVAssetTrack]? {
        if #available(iOS 15, tvOS 15, visionOS 1.0, *) {
            return try? await asset.loadTracks(withMediaType: withMediaType)
        } else {
            #if !os(visionOS)
                return asset.tracks(withMediaType: withMediaType)
            #endif
        }
    }
}

// MARK: - RCTVideoUtils

/*!
 * Collection of pure functions
 */
enum RCTVideoUtils {
    /*!
     * Calculates and returns the playable duration of the current player item using its loaded time ranges.
     *
     * \returns The playable duration of the current player item in seconds.
     */
    static func calculatePlayableDuration(_ player: AVPlayer?, withSource source: VideoSource?) -> NSNumber {
        guard let player,
              let video: AVPlayerItem = player.currentItem,
              video.status == AVPlayerItem.Status.readyToPlay else {
            return 0
        }

        if source?.cropStart != nil && source?.cropEnd != nil {
            return NSNumber(value: (Float64(source?.cropEnd ?? 0) - Float64(source?.cropStart ?? 0)) / 1000)
        }

        var effectiveTimeRange: CMTimeRange?
        for value in video.loadedTimeRanges {
            let timeRange: CMTimeRange = value.timeRangeValue
            if CMTimeRangeContainsTime(timeRange, time: video.currentTime()) {
                effectiveTimeRange = timeRange
                break
            }
        }

        if let effectiveTimeRange {
            let playableDuration: Float64 = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange))
            if playableDuration > 0 {
                if source?.cropStart != nil {
                    return NSNumber(value: playableDuration - Float64(source?.cropStart ?? 0) / 1000)
                }

                return playableDuration as NSNumber
            }
        }

        return 0
    }

    static func urlFilePath(filepath: NSString?, searchPath: FileManager.SearchPathDirectory) -> NSURL! {
        guard let _filepath = filepath else { return nil }

        if _filepath.contains("file://") {
            return NSURL(string: _filepath as String)
        }

        // if no file found, check if the file exists in the Document directory
        let paths: [String] = NSSearchPathForDirectoriesInDomains(searchPath, .userDomainMask, true)
        var relativeFilePath: String = _filepath.lastPathComponent
        // the file may be multiple levels below the documents directory
        let directoryString: String = searchPath == .cachesDirectory ? "Library/Caches/" : "Documents"
        let fileComponents: [String] = _filepath.components(separatedBy: directoryString)
        if fileComponents.count > 1 {
            relativeFilePath = fileComponents[1]
        }

        guard let _pathFirst = paths.first else { return nil }
        let path: String = (_pathFirst as NSString).appendingPathComponent(relativeFilePath)
        if FileManager.default.fileExists(atPath: path) {
            return NSURL.fileURL(withPath: path) as NSURL
        }
        return nil
    }

    static func playerItemSeekableTimeRange(_ player: AVPlayer?) -> CMTimeRange {
        if let playerItem = player?.currentItem,
           playerItem.status == .readyToPlay,
           let firstItem = playerItem.seekableTimeRanges.first {
            return firstItem.timeRangeValue
        }

        return CMTimeRange.zero
    }

    static func playerItemDuration(_ player: AVPlayer?) -> CMTime {
        if let playerItem = player?.currentItem,
           playerItem.status == .readyToPlay {
            return playerItem.duration
        }

        return CMTime.invalid
    }

    static func calculateSeekableDuration(_ player: AVPlayer?) -> NSNumber {
        let timeRange: CMTimeRange = RCTVideoUtils.playerItemSeekableTimeRange(player)
        if CMTIME_IS_NUMERIC(timeRange.duration) {
            return NSNumber(value: CMTimeGetSeconds(timeRange.duration))
        }
        return 0
    }

    static func getAudioTrackInfo(_ player: AVPlayer?) async -> [AnyObject] {
        guard let player, let asset = player.currentItem?.asset else {
            return []
        }

        let audioTracks = NSMutableArray()

        let group = await RCTVideoAssetsUtils.getMediaSelectionGroup(asset: asset, for: .audible)

        for i in 0 ..< (group?.options.count ?? 0) {
            let currentOption = group?.options[i]
            var title = ""
            let values = currentOption?.commonMetadata.map(\.value)
            if (values?.count ?? 0) > 0, let value = values?[0] {
                title = value as! String
            }
            let language: String = currentOption?.extendedLanguageTag ?? ""

            let selectedOption: AVMediaSelectionOption? = player.currentItem?.currentMediaSelection.selectedMediaOption(in: group!)

            let audioTrack = [
                "index": NSNumber(value: i),
                "title": title,
                "language": language,
                "selected": currentOption?.displayName == selectedOption?.displayName,
            ] as [String: Any]
            audioTracks.add(audioTrack)
        }

        return audioTracks as [AnyObject]
    }

    static func getTextTrackInfo(_ player: AVPlayer?) async -> [TextTrack] {
        guard let player, let asset = player.currentItem?.asset else {
            return []
        }

        // if streaming video, we extract the text tracks
        var textTracks: [TextTrack] = []
        let group = await RCTVideoAssetsUtils.getMediaSelectionGroup(asset: asset, for: .legible)

        for i in 0 ..< (group?.options.count ?? 0) {
            let currentOption = group?.options[i]
            var title = ""
            let values = currentOption?.commonMetadata.map(\.value)
            if (values?.count ?? 0) > 0, let value = values?[0] {
                title = value as! String
            }
            let language: String = currentOption?.extendedLanguageTag ?? ""
            let selectedOption: AVMediaSelectionOption? = player.currentItem?.currentMediaSelection.selectedMediaOption(in: group!)
            let textTrack = TextTrack([
                "index": NSNumber(value: i),
                "title": title,
                "language": language as Any,
                "selected": currentOption?.displayName == selectedOption?.displayName,
            ])
            textTracks.append(textTrack)
        }

        return textTracks
    }

    // UNUSED
    static func getCurrentTime(playerItem: AVPlayerItem?) -> Float {
        return Float(CMTimeGetSeconds(playerItem?.currentTime() ?? .zero))
    }

    static func base64DataFromBase64String(base64String: String?) -> Data? {
        if let base64String {
            return Data(base64Encoded: base64String)
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
              let adoptURL = RCTVideoUtils.replaceURLScheme(url: url, scheme: nil) else { return nil }

        return Data(base64Encoded: adoptURL.absoluteString)
    }

    static func generateMixComposition(_ asset: AVAsset) async -> AVMutableComposition {
        let videoTracks = await RCTVideoAssetsUtils.getTracks(asset: asset, withMediaType: .video)
        let audioTracks = await RCTVideoAssetsUtils.getTracks(asset: asset, withMediaType: .audio)

        let mixComposition = AVMutableComposition()

        if let videoAsset = videoTracks?.first, let audioAsset = audioTracks?.first {
            let videoCompTrack: AVMutableCompositionTrack! = mixComposition.addMutableTrack(
                withMediaType: AVMediaType.video,
                preferredTrackID: kCMPersistentTrackID_Invalid
            )
            try? videoCompTrack.insertTimeRange(
                CMTimeRangeMake(start: .zero, duration: videoAsset.timeRange.duration),
                of: videoAsset,
                at: .zero
            )

            let audioCompTrack: AVMutableCompositionTrack! = mixComposition.addMutableTrack(
                withMediaType: AVMediaType.audio,
                preferredTrackID: kCMPersistentTrackID_Invalid
            )

            try? audioCompTrack.insertTimeRange(
                CMTimeRangeMake(start: .zero, duration: audioAsset.timeRange.duration),
                of: audioAsset,
                at: .zero
            )
        }

        return mixComposition
    }

    static func getValidTextTracks(asset: AVAsset, assetOptions: NSDictionary?, mixComposition: AVMutableComposition,
                                   textTracks: [TextTrack]?) async -> [TextTrack] {
        var validTextTracks: [TextTrack] = []
        var tracks: [([AVAssetTrack], AVURLAsset)] = []

        let videoTracks = await RCTVideoAssetsUtils.getTracks(asset: asset, withMediaType: .video)
        guard let videoAsset = videoTracks?.first else { return validTextTracks }

        if let textTracks, !textTracks.isEmpty {
            for textTrack in textTracks {
                var textURLAsset: AVURLAsset!
                let textUri: String = textTrack.uri

                if textUri.lowercased().hasPrefix("http") {
                    textURLAsset = AVURLAsset(url: NSURL(string: textUri)! as URL, options: (assetOptions as! [String: Any]))
                } else {
                    let isDisabledTrack: Bool! = textTrack.type == "disabled"
                    let searchPath: FileManager.SearchPathDirectory = isDisabledTrack ? .cachesDirectory : .documentDirectory
                    textURLAsset = AVURLAsset(
                        url: RCTVideoUtils.urlFilePath(filepath: textUri as NSString?, searchPath: searchPath) as URL,
                        options: nil
                    )
                }

                if let track = await RCTVideoAssetsUtils.getTracks(asset: textURLAsset, withMediaType: .text) {
                    tracks.append((track, textURLAsset))
                }
            }

            for (index, tracksPair) in tracks.enumerated() {
                let (tracks, trackAsset) = tracksPair
                guard let track = tracks.first else { continue } // fix when there's no textTrackAsset

                let textCompTrack: AVMutableCompositionTrack! = mixComposition.addMutableTrack(withMediaType: AVMediaType.text,
                                                                                               preferredTrackID: kCMPersistentTrackID_Invalid)

                do {
                    try textCompTrack.insertTimeRange(CMTimeRangeMake(start: .zero, duration: trackAsset.duration), of: track, at: .zero)
                    validTextTracks.append(textTracks[index])
                } catch {
                    // TODO: upgrade error by call some props callback to better inform user
                    print("Error occurred on textTrack insert attempt: \(error.localizedDescription)")
                    continue
                }
            }
        }

        if !validTextTracks.isEmpty {
            let emptyVttFile: TextTrack? = self.createEmptyVttFile()
            if emptyVttFile != nil {
                validTextTracks.append(emptyVttFile!)
            }
        }

        return validTextTracks
    }

    /*
     * Create an useless/almost empty VTT file in the list with available tracks.
     * This track gets selected when you give type: "disabled" as the selectedTextTrack
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

    static func delay(seconds: Int = 0, completion: @escaping () async throws -> Void) {
        return DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(seconds)) {
            Task.detached(priority: .userInitiated) {
                try await completion()
            }
        }
    }

    static func preparePHAsset(uri: String) async -> AVAsset? {
        let assetId = String(uri[uri.index(uri.startIndex, offsetBy: "ph://".count)...])
        guard let phAsset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: nil).firstObject else {
            return nil
        }

        let options = PHVideoRequestOptions()
        options.isNetworkAccessAllowed = true

        return await withCheckedContinuation { continuation in
            PHCachingImageManager().requestAVAsset(forVideo: phAsset, options: options) { data, _, _ in
                continuation.resume(returning: data)
            }
        }
    }

    static func prepareAsset(source: VideoSource) -> (asset: AVURLAsset?, assetOptions: NSMutableDictionary?)? {
        guard let sourceUri = source.uri, sourceUri != "" else { return nil }
        var asset: AVURLAsset!
        let bundlePath = Bundle.main.path(forResource: sourceUri, ofType: source.type) ?? ""
        guard let url = source.isNetwork || source.isAsset
            ? URL(string: sourceUri)
            : URL(fileURLWithPath: bundlePath) else { return nil }

        let assetOptions: NSMutableDictionary! = NSMutableDictionary()

        if source.isNetwork {
            if let headers = source.requestHeaders, !headers.isEmpty {
                assetOptions.setObject(headers, forKey: "AVURLAssetHTTPHeaderFieldsKey" as NSCopying)
            }
            let cookies: [AnyObject]! = HTTPCookieStorage.shared.cookies
            assetOptions.setObject(cookies as Any, forKey: AVURLAssetHTTPCookiesKey as NSCopying)
            asset = AVURLAsset(url: url, options: assetOptions as? [String: Any])
        } else {
            asset = AVURLAsset(url: url)
        }
        return (asset, assetOptions)
    }

    static func createMetadataItems(for mapping: [AVMetadataIdentifier: Any]) -> [AVMetadataItem] {
        return mapping.compactMap { createMetadataItem(for: $0, value: $1) }
    }

    static func createMetadataItem(for identifier: AVMetadataIdentifier,
                                   value: Any) -> AVMetadataItem {
        let item = AVMutableMetadataItem()
        item.identifier = identifier
        item.value = value as? NSCopying & NSObjectProtocol
        // Specify "und" to indicate an undefined language.
        item.extendedLanguageTag = "und"
        return item.copy() as! AVMetadataItem
    }

    static func createImageMetadataItem(imageUri: String) async -> Data? {
        guard let url = URL(string: imageUri) else {
            return nil
        }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data), let pngData = image.pngData() else {
                return nil
            }
            return pngData
        } catch {
            print("Error fetching image data: \(error.localizedDescription)")
            return nil
        }
    }

    static func getCurrentWindow() -> UIWindow? {
        if #available(iOS 13.0, tvOS 13, *) {
            return UIApplication.shared.connectedScenes
                .flatMap { ($0 as? UIWindowScene)?.windows ?? [] }
                .last { $0.isKeyWindow }
        } else {
            #if !os(visionOS)
                return UIApplication.shared.keyWindow
            #endif
        }
    }

    static func generateVideoComposition(asset: AVAsset, filter: CIFilter) async -> AVVideoComposition? {
        if #available(iOS 16, tvOS 16, visionOS 1.0, *) {
            return try? await AVVideoComposition.videoComposition(
                with: asset,
                applyingCIFiltersWithHandler: { (request: AVAsynchronousCIImageFilteringRequest) in
                    let image: CIImage! = request.sourceImage.clampedToExtent()
                    filter.setValue(image, forKey: kCIInputImageKey)
                    let output: CIImage! = filter.outputImage?.cropped(to: request.sourceImage.extent)
                    request.finish(with: output, context: nil)
                }
            )
        } else {
            #if !os(visionOS)
                return AVVideoComposition(
                    asset: asset,
                    applyingCIFiltersWithHandler: { (request: AVAsynchronousCIImageFilteringRequest) in
                        let image: CIImage! = request.sourceImage.clampedToExtent()
                        filter.setValue(image, forKey: kCIInputImageKey)
                        let output: CIImage! = filter.outputImage?.cropped(to: request.sourceImage.extent)
                        request.finish(with: output, context: nil)
                    }
                )
            #endif
        }
    }
}
