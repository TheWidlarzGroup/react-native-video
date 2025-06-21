// Big thanks to https://github.com/erikbdev

import AVFoundation
import AVKit
import Foundation

// MARK: - MetaPayload

@dynamicMemberLookup
struct MetaPayload {
    let modifiedLink: URL
    let payload: VideoSource

    subscript<Value>(dynamicMember keyPath: KeyPath<VideoSource, Value>) -> Value {
        payload[keyPath: keyPath]
    }
}

// MARK: - PlayerItem

final class PlayerItem: AVPlayerItem {
    var payload: MetaPayload

    private let resourceQueue: DispatchQueue

    enum ResourceLoaderError: Swift.Error {
        case responseError
        case emptyData
        case failedToCreateM3U8
    }

    init(source: VideoSource, uri: String) throws {
        guard let url = URL(string: uri) else {
            DebugLog("Could not find video URL in source '\(String(describing: source))'")
            throw NSError(domain: "", code: 0, userInfo: nil)
        }
        self.resourceQueue = DispatchQueue(label: "playeritem-\(url.absoluteString)", qos: .utility)

        if source.textTracks.isEmpty || url.isFileURL {
            self.payload = .init(modifiedLink: url, payload: source)
        } else {
            self.payload = .init(modifiedLink: url.change(scheme: Self.hlsCommonScheme), payload: source)
        }

        guard let assetResult = RCTVideoUtils.prepareAsset(source: source),
              let asset = assetResult.asset,
              let assetOptions = assetResult.assetOptions else {
            DebugLog("Could not find video URL in source '\(String(describing: source))'")
            throw NSError(domain: "", code: 0, userInfo: nil)
        }

        super.init(asset: asset)

        asset.resourceLoader.setDelegate(self, queue: resourceQueue)
    }
}

// MARK: AVAssetResourceLoaderDelegate

extension PlayerItem: AVAssetResourceLoaderDelegate {
    func resourceLoader(
        _: AVAssetResourceLoader,
        shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest
    ) -> Bool {
        handleHLSRequest(loadingRequest: loadingRequest)
    }
}

extension URL {
    func change(scheme: String) -> URL {
        var component = URLComponents(url: self, resolvingAgainstBaseURL: false)
        component?.scheme = scheme
        return component?.url ?? self
    }

    var recoveryScheme: URL {
        var component = URLComponents(url: self, resolvingAgainstBaseURL: false)
        let isDataScheme = component?.path.starts(with: "application/x-mpegURL") ?? false
        component?.scheme = isDataScheme ? "data" : "https"
        return component?.url ?? self
    }
}
