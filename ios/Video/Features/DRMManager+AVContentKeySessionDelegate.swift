//
//  DRMManager+AVContentKeySessionDelegate.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 14/08/2024.
//

import AVFoundation

extension DRMManager: AVContentKeySessionDelegate {
    
    func contentKeySession(_ session: AVContentKeySession, didProvide keyRequest: AVContentKeyRequest) {
        handleContentKeyRequest(keyRequest: keyRequest)
    }
    
    func contentKeySession(_ session: AVContentKeySession, didProvideRenewingContentKeyRequest keyRequest: AVContentKeyRequest) {
        handleContentKeyRequest(keyRequest: keyRequest)
    }
    
    func contentKeySession(_ session: AVContentKeySession, shouldRetry keyRequest: AVContentKeyRequest, reason retryReason: AVContentKeyRequest.RetryReason) -> Bool {
        let reasons = [
            AVContentKeyRequest.RetryReason.timedOut,
            AVContentKeyRequest.RetryReason.receivedResponseWithExpiredLease,
            AVContentKeyRequest.RetryReason.receivedObsoleteContentKey
        ]
        
        // Check if we should retry
        return reasons.contains(where: { r in r == retryReason })
    }
    
    func contentKeySession(_ session: AVContentKeySession, didProvide keyRequest: AVPersistableContentKeyRequest) {
        handlePersistableKeyRequest(keyRequest: keyRequest)
    }
    
    func contentKeySession(_ session: AVContentKeySession, contentKeyRequest keyRequest: AVContentKeyRequest, didFailWithError err: any Error) {
        guard let onVideoError, let reactTag else {
            return
        }
        
        let error = err as NSError
        
        onVideoError([
            "error": [
                "code": NSNumber(value: error.code),
                "localizedDescription": error.localizedDescription,
                "localizedFailureReason": error.localizedFailureReason ?? "",
                "localizedRecoverySuggestion": error.localizedRecoverySuggestion ?? "",
                "domain": error.domain,
            ],
            "target": reactTag
        ])
    }
}
