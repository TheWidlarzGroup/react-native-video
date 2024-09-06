//
//  DRMManager+AVContentKeySessionDelegate.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 14/08/2024.
//

import AVFoundation

extension DRMManager: AVContentKeySessionDelegate {
    func contentKeySession(_: AVContentKeySession, didProvide keyRequest: AVContentKeyRequest) {
        handleContentKeyRequest(keyRequest: keyRequest)
    }

    func contentKeySession(_: AVContentKeySession, didProvideRenewingContentKeyRequest keyRequest: AVContentKeyRequest) {
        handleContentKeyRequest(keyRequest: keyRequest)
    }

    func contentKeySession(_: AVContentKeySession, shouldRetry _: AVContentKeyRequest, reason retryReason: AVContentKeyRequest.RetryReason) -> Bool {
        let retryReasons: [AVContentKeyRequest.RetryReason] = [
            .timedOut,
            .receivedResponseWithExpiredLease,
            .receivedObsoleteContentKey,
        ]
        return retryReasons.contains(retryReason)
    }

    func contentKeySession(_: AVContentKeySession, didProvide keyRequest: AVPersistableContentKeyRequest) {
        Task {
            do {
                try await handlePersistableKeyRequest(keyRequest: keyRequest)
            } catch {
                handleError(error, for: keyRequest)
            }
        }
    }

    func contentKeySession(_: AVContentKeySession, contentKeyRequest _: AVContentKeyRequest, didFailWithError error: Error) {
        DebugLog(String(describing: error))
    }
}
