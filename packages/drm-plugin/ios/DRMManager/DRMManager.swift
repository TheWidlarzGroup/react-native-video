//
//  DRMManager.swift
//  ReactNativeVideoDrm
//
//  Created by Krzysztof Moch on 07/08/2025.
//

import AVFoundation
import Foundation
import NitroModules
import ReactNativeVideo

class DRMManager: NSObject, DRMManagerSpec {
  static let queue = DispatchQueue(
    label: "ReactNativeVideoDrmContentKeyDelegateQueue"
  )

  let contentKeySession: AVContentKeySession
  weak var source: NativeVideoPlayerSource?
  
  var drmParams: NativeDrmParams? {
    return source?.config.drm
  }

  init(source: NativeVideoPlayerSource) {
    contentKeySession = AVContentKeySession(keySystem: .fairPlayStreaming)
    self.source = source

    super.init()
    contentKeySession.setDelegate(self, queue: DRMManager.queue)
  }

  func createContentKeyRequest(
    for asset: AVURLAsset,
    drmParams: NativeDrmParams
  ) throws {
    if drmParams.type != "fairplay" {
      throw RuntimeError.error(
        withMessage:
          "Unsupported DRM type: \(String(describing: drmParams.type))"
      )
    }

    contentKeySession.addContentKeyRecipient(asset)
  }

  // MARK: - Internal Methods
  internal func handleError(error: Error, for keyRequest: AVContentKeyRequest) {
    print(
      "[ReactNativeVideo] DRM Error: \(error.localizedDescription) for source \(source?.uri ?? "unknown source")"
      )
    
    keyRequest.processContentKeyResponseError(error)
  }
  
  internal func handleContentKeyRequest(keyRequest: AVContentKeyRequest) {
    Task {
      do {
        try await processContentKeyRequest(keyRequest: keyRequest)
      } catch {
        handleError(error: error, for: keyRequest)
      }
    }
  }

  internal func finishProcessingContentKeyRequest(
    keyRequest: AVContentKeyRequest,
    license: Data
  ) throws {
    let keyResponse = AVContentKeyResponse(
      fairPlayStreamingKeyResponseData: license
    )
    keyRequest.processContentKeyResponse(keyResponse)
  }

  // MARK: - Private Methods

  private func processContentKeyRequest(keyRequest: AVContentKeyRequest)
    async throws
  {
    guard let assetId = getAssetId(keyRequest: keyRequest),
      let assetIdData = assetId.data(using: .utf8)
    else {
      throw RuntimeError.error(
        withMessage:
          "No asset ID found for content key request (For \(source?.uri ?? "unknown source"))"
      )
    }

    let appCertificate = try await requestApplicationCertificate()
    let spcData = try await keyRequest.makeStreamingContentKeyRequestData(
      forApp: appCertificate,
      contentIdentifier: assetIdData
    )

    if let getLicense = drmParams?.getLicense {
      
      guard let licenseUrl = drmParams?.licenseUrl,
        let keyUrl = keyRequest.identifier as? String
      else {
        throw RuntimeError.error(
          withMessage:
            "Missing required parameters for getLicense (For \(source?.uri ?? "unknown source"))"
        )
      }

      let payload = OnGetLicensePayload(
        contentId: assetId,
        licenseUrl: licenseUrl,
        keyUrl: keyUrl,
        spc: spcData.base64EncodedString()
      )
      
      // Get Promise from JavaScript
      let getLicenseJS = try await getLicense(payload).await()
      
      // Resolve Promise from JavaScript
      let license = try await getLicenseJS.await()
      
      guard let licenseData = Data(base64Encoded: license) else {
        throw RuntimeError.error(
          withMessage:
            "Invalid license data received from getLicense (For \(source?.uri ?? "unknown source"))"
        )
      }
      
      try finishProcessingContentKeyRequest(
        keyRequest: keyRequest,
        license: licenseData
      )
    } else {
      
      // Try "Default" License Request
      let license = try await requestLicense(spcData: spcData)
      try finishProcessingContentKeyRequest(
        keyRequest: keyRequest,
        license: license
      )
    }
  }

  private func requestApplicationCertificate() async throws -> Data {
    guard let urlString = drmParams?.certificateUrl,
      let url = URL(string: urlString)
    else {
      throw RuntimeError.error(
        withMessage:
          "No certificate URL provided (For \(source?.uri ?? "unknown source"))"
      )
    }

    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
      httpResponse.statusCode == 200
    else {
      throw RuntimeError.error(
        withMessage: "Failed to fetch certificate from \(urlString)"
      )
    }

    if let base64EncodedData = String(data: data, encoding: .utf8),
      let certData = Data(base64Encoded: base64EncodedData)
    {
      return certData
    }

    return data
  }

  private func requestLicense(spcData: Data) async throws -> Data {
    guard let licenseServerUrlString = drmParams?.licenseUrl,
      let licenseServerUrl = URL(string: licenseServerUrlString)
    else {
      throw RuntimeError.error(
        withMessage:
          "No license URL provided (For \(source?.uri ?? "unknown source"))"
      )
    }

    var request = URLRequest(url: licenseServerUrl)
    request.httpMethod = "POST"
    request.httpBody = spcData

    // Use source headers for now, there was some issues with headers in the DRM params
    if let headers = source?.config.headers {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
      throw RuntimeError.error(
        withMessage:
          "Invalid response from license server (For \(source?.uri ?? "unknown source")) - \(String(describing: response))"
      )
    }

    guard httpResponse.statusCode == 200 else {
      throw RuntimeError.error(
        withMessage:
          "License request failed with status code \(httpResponse.statusCode) (For \(source?.uri ?? "unknown source"))"
      )
    }

    guard !data.isEmpty else {
      throw RuntimeError.error(
        withMessage:
          "License response is empty (For \(source?.uri ?? "unknown source"))"
      )
    }

    return data
  }

  private func getAssetId(keyRequest: AVContentKeyRequest) -> String? {
    if let assetId = drmParams?.contentId {
      return assetId
    }

    if let url = keyRequest.identifier as? String {
      return url.replacingOccurrences(of: "skd://", with: "")
    }

    return nil
  }
}
