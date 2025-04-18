import AVFoundation

// MARK: - OverridePlayerAssetType

public enum OverridePlayerAssetType {
    // Return partially modified asset, that will go through the default prepare process
    case partial
    // Return fully modified asset, that will skip the default prepare process
    case full
}

public typealias OverridePlayerAsset = (VideoSource, AVAsset) async -> OverridePlayerAssetResult

// MARK: - OverridePlayerAssetResult

public struct OverridePlayerAssetResult {
    public let type: OverridePlayerAssetType
    public let asset: AVAsset

    public init(type: OverridePlayerAssetType, asset: AVAsset) {
        self.type = type
        self.asset = asset
    }
}
