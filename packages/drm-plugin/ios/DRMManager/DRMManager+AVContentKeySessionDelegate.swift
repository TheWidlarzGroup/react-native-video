//
//  DRMManager+AVContentKeySessionDelegate.swift
//  ReactNativeVideoDrm
//
//  Created by Krzysztof Moch on 07/08/2025.
//

import AVFoundation
import Foundation
import NitroModules

extension DRMManager: AVContentKeySessionDelegate {
  func contentKeySession(
    _: AVContentKeySession,
    didProvide keyRequest: AVContentKeyRequest
  ) {
    handleContentKeyRequest(keyRequest: keyRequest)
  }

  func contentKeySession(
    _: AVContentKeySession,
    didProvideRenewingContentKeyRequest keyRequest: AVContentKeyRequest
  ) {
    handleContentKeyRequest(keyRequest: keyRequest)
  }

  func contentKeySession(
    _: AVContentKeySession,
    shouldRetry _: AVContentKeyRequest,
    reason retryReason: AVContentKeyRequest.RetryReason
  ) -> Bool {
    let retryReasons: [AVContentKeyRequest.RetryReason] = [
      .timedOut,
      .receivedResponseWithExpiredLease,
      .receivedObsoleteContentKey,
    ]
    return retryReasons.contains(retryReason)
  }

  func contentKeySession(
    _: AVContentKeySession,
    didProvide keyRequest: AVPersistableContentKeyRequest
  ) {
    handleError(
      error: RuntimeError.error(
        withMessage:
          "Persistable content key requests are not supported in This Plugin. Please see Offline Video SDK if you need this functionality."
      ),
      for: keyRequest
    )
  }

  func contentKeySession(
    _: AVContentKeySession,
    contentKeyRequest _: AVContentKeyRequest,
    didFailWithError error: Error
  ) {
    // TODO: Handle error appropriately
    print(
      "[ReactNativeVideo] DRMManager: Content key request failed with error: \(error.localizedDescription)"
    )
  }
}
