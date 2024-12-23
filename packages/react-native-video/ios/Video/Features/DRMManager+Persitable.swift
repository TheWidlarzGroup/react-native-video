//
//  DRMManager+Persitable.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 19/08/2024.
//

import AVFoundation

extension DRMManager {
    func handlePersistableKeyRequest(keyRequest: AVPersistableContentKeyRequest) async throws {
        if let localSourceEncryptionKeyScheme = drmParams?.localSourceEncryptionKeyScheme {
            try handleEmbeddedKey(keyRequest: keyRequest, scheme: localSourceEncryptionKeyScheme)
        } else {
            // Offline DRM is not supported yet - if you need it please check out the following issue:
            // https://github.com/TheWidlarzGroup/react-native-video/issues/3539
            throw RCTVideoError.offlineDRMNotSupported
        }
    }

    private func handleEmbeddedKey(keyRequest: AVPersistableContentKeyRequest, scheme: String) throws {
        guard let uri = keyRequest.identifier as? String,
              let url = URL(string: uri) else {
            throw RCTVideoError.invalidContentId
        }

        guard let persistentKeyData = RCTVideoUtils.extractDataFromCustomSchemeUrl(from: url, scheme: scheme) else {
            throw RCTVideoError.embeddedKeyExtractionFailed
        }

        let persistentKey = try keyRequest.persistableContentKey(fromKeyVendorResponse: persistentKeyData)
        try finishProcessingContentKeyRequest(keyRequest: keyRequest, license: persistentKey)
    }
}
