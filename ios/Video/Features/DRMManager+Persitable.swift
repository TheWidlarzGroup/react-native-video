//
//  DRMManager+Persitable.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 19/08/2024.
//

import AVFoundation

extension DRMManager {
    func handlePersistableKeyRequest(keyRequest: AVPersistableContentKeyRequest) {
        do {
            if localSourceEncryptionKeyScheme != nil {
                try handleEmbemedKey(keyRequest: keyRequest)
            }
            
            // Offline DRM is not supported yet - if you need it please checkout below issue
            // https://github.com/TheWidlarzGroup/react-native-video/issues/3539
            throw NSError()
        } catch {
            keyRequest.processContentKeyResponseError(error)
        }
    }
    
    func handleEmbemedKey(keyRequest: AVPersistableContentKeyRequest) throws {
        guard let localSourceEncryptionKeyScheme else {
            throw RCTVideoErrorHandler.noDRMData
        }
        
        guard let uri = keyRequest.identifier as? String, let url = URL(string: uri) else {
            throw RCTVideoErrorHandler.noDRMData
        }
        
        guard let persistentKeyData = RCTVideoUtils.extractDataFromCustomSchemeUrl(from: url, scheme: localSourceEncryptionKeyScheme) else {
            throw RCTVideoErrorHandler.noDataFromLicenseRequest
        }
        
        let persistentKey = try keyRequest.persistableContentKey(fromKeyVendorResponse: persistentKeyData)
        
        try finishProcessingContentKeyRequest(keyRequest: keyRequest, licence: persistentKey)
    }
}
