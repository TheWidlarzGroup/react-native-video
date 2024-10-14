//
//  DRMManager.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 13/08/2024.
//

import AVFoundation

class DRMManager: NSObject {
    static let queue = DispatchQueue(label: "RNVideoContentKeyDelegateQueue")
    let contentKeySession: AVContentKeySession?

    var drmParams: DRMParams?
    var reactTag: NSNumber?
    var onVideoError: RCTDirectEventBlock?
    var onGetLicense: RCTDirectEventBlock?

    // Licenses handled by onGetLicense (from JS side)
    var pendingLicenses: [String: AVContentKeyRequest] = [:]

    override init() {
        #if targetEnvironment(simulator)
            contentKeySession = nil
            super.init()
        #else
            contentKeySession = AVContentKeySession(keySystem: .fairPlayStreaming)
            super.init()

            contentKeySession?.setDelegate(self, queue: DRMManager.queue)
        #endif
    }

    func createContentKeyRequest(
        asset: AVContentKeyRecipient,
        drmParams: DRMParams?,
        reactTag: NSNumber?,
        onVideoError: RCTDirectEventBlock?,
        onGetLicense: RCTDirectEventBlock?
    ) {
        self.reactTag = reactTag
        self.onVideoError = onVideoError
        self.onGetLicense = onGetLicense
        self.drmParams = drmParams

        if drmParams?.type != "fairplay" {
            self.onVideoError?([
                "error": RCTVideoErrorHandler.createError(from: RCTVideoError.unsupportedDRMType),
                "target": self.reactTag as Any,
            ])
            return
        }

        #if targetEnvironment(simulator)
            DebugLog("Simulator is not supported for FairPlay DRM.")
            self.onVideoError?([
                "error": RCTVideoErrorHandler.createError(from: RCTVideoError.simulatorDRMNotSupported),
                "target": self.reactTag as Any,
            ])
        #endif

        contentKeySession?.addContentKeyRecipient(asset)
    }

    // MARK: - Internal

    func handleContentKeyRequest(keyRequest: AVContentKeyRequest) {
        Task {
            do {
                if drmParams?.localSourceEncryptionKeyScheme != nil {
                    #if os(iOS)
                        try keyRequest.respondByRequestingPersistableContentKeyRequestAndReturnError()
                        return
                    #else
                        throw RCTVideoError.offlineDRMNotSupported
                    #endif
                }

                try await processContentKeyRequest(keyRequest: keyRequest)
            } catch {
                handleError(error, for: keyRequest)
            }
        }
    }

    func finishProcessingContentKeyRequest(keyRequest: AVContentKeyRequest, license: Data) throws {
        let keyResponse = AVContentKeyResponse(fairPlayStreamingKeyResponseData: license)
        keyRequest.processContentKeyResponse(keyResponse)
    }

    func handleError(_ error: Error, for keyRequest: AVContentKeyRequest) {
        let rctError: RCTVideoError
        if let videoError = error as? RCTVideoError {
            // handle RCTVideoError errors
            rctError = videoError

            DispatchQueue.main.async { [weak self] in
                self?.onVideoError?([
                    "error": RCTVideoErrorHandler.createError(from: rctError),
                    "target": self?.reactTag as Any,
                ])
            }
        } else {
            let err = error as NSError

            // handle Other errors
            DispatchQueue.main.async { [weak self] in
                self?.onVideoError?([
                    "error": [
                        "code": err.code,
                        "localizedDescription": err.localizedDescription,
                        "localizedFailureReason": err.localizedFailureReason ?? "",
                        "localizedRecoverySuggestion": err.localizedRecoverySuggestion ?? "",
                        "domain": err.domain,
                    ],
                    "target": self?.reactTag as Any,
                ])
            }
        }

        keyRequest.processContentKeyResponseError(error)
        contentKeySession?.expire()
    }

    // MARK: - Private
    
    private func downloadNagra(spcData: Data) async throws -> Data {
        // Safely unwrap the certificateUrl
        guard let licenseUrl = drmParams?.licenseServer, let licenseServerUrl = URL(string: licenseUrl) else {
            throw RCTVideoError.noLicenseServerURL
        }
        var request = URLRequest(url: licenseServerUrl)
        request.httpMethod = "POST"
        // Append headers from drmParams?.headers
            if let headers = drmParams?.headers as? [String: Any] {
                for (key, value) in headers {
                    if let keyString = key as? String, let valueString = value as? String {
                        request.addValue(valueString, forHTTPHeaderField: keyString)
                    }
                }
        }
        request.httpBody = spcData
        

        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw RCTVideoError.licenseRequestFailed(1)
        }

        guard httpResponse.statusCode == 200 else {
            throw RCTVideoError.licenseRequestFailed(1)
        }

        guard let jsonBody = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
            throw RCTVideoError.licenseRequestFailed(1)
        }

        guard let ckcMessage = jsonBody["CkcMessage"] as? String, let ckcData = Data(base64Encoded: ckcMessage) else {
            throw RCTVideoError.licenseRequestFailed(1)
        }

        return ckcData
    }

    private func processContentKeyRequest(keyRequest: AVContentKeyRequest) async throws {
        guard let assetId = getAssetId(keyRequest: keyRequest),
              let assetIdData = generateAssetIdData(contentKeyIdentifier: assetId) else {
            throw RCTVideoError.invalidContentId
        }

        let appCertificate = try await requestApplicationCertificate()
//        print("Certificate data retrieved, assetData: \(assetIdData), assetId: \(assetId)")
        do {
            let spcData = try await keyRequest.makeStreamingContentKeyRequestData(forApp: appCertificate, contentIdentifier: assetIdData)
            
            if onGetLicense != nil {
                try await requestLicenseFromJS(spcData: spcData, assetId: assetId, keyRequest: keyRequest)
            } else {
                let ckcData = try await downloadNagra(spcData: spcData)
//                print("License data retrieved: \(ckcData)")
                let keyResponse = AVContentKeyResponse(fairPlayStreamingKeyResponseData: ckcData)
//                print("Key response: \(keyResponse)")
                keyRequest.processContentKeyResponse(keyResponse)
            }
            
            // Proceed with using the spcData, like sending it to a server, etc.
        } catch let nsError as NSError {
            print("Failed to make streaming request: \(nsError.localizedDescription)")
            print("Error code: \(nsError.code)")
            print("Error domain: \(nsError.domain)")
            if let underlyingError = nsError.userInfo[NSUnderlyingErrorKey] as? NSError {
                print("Underlying error: \(underlyingError.localizedDescription)")
            }
        }
    }

    private func requestApplicationCertificate() async throws -> Data {
        guard let urlString = drmParams?.certificateUrl,
              let url = URL(string: urlString) else {
            throw RCTVideoError.noCertificateURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw RCTVideoError.noCertificateData
        }

        if drmParams?.base64Certificate == true {
            guard let certData = Data(base64Encoded: data) else {
                throw RCTVideoError.noCertificateData
            }
            return certData
        }

        return data
    }

    private func requestLicense(spcData: Data) async throws -> Data {
        guard let licenseServerUrlString = drmParams?.licenseServer,
              let licenseServerUrl = URL(string: licenseServerUrlString) else {
            throw RCTVideoError.noLicenseServerURL
        }

        var request = URLRequest(url: licenseServerUrl)
        request.httpMethod = "POST"
        request.httpBody = spcData

        if let headers = drmParams?.headers {
            for (key, value) in headers {
                if let stringValue = value as? String {
                    request.setValue(stringValue, forHTTPHeaderField: key)
                }
            }
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw RCTVideoError.licenseRequestFailed(0)
        }

        guard httpResponse.statusCode == 200 else {
            throw RCTVideoError.licenseRequestFailed(httpResponse.statusCode)
        }

        guard !data.isEmpty else {
            throw RCTVideoError.noDataFromLicenseRequest
        }

        return data
    }

    private func getAssetId(keyRequest: AVContentKeyRequest) -> String? {
        if let assetId = drmParams?.contentId {
            return assetId
        }

        if let url = keyRequest.identifier as? String {
            return url.replacingOccurrences(of: "skd", with: "https")
        }

        return nil
    }
    
    private func generateAssetIdData(contentKeyIdentifier: String) -> Data? {
        guard let contentKeyIdentifierURL = URL(string: contentKeyIdentifier) else {
            return nil
        }
        let (contentId, keyId, iVString) =  self.parseSSPLoadingRequest(url: contentKeyIdentifierURL)
        let assetIdDict = ["ContentId": contentId, "KeyId": keyId, "IV": iVString]
        
        return try? JSONSerialization.data(withJSONObject: assetIdDict, options: [])
    }
    
    
    private func parseSSPLoadingRequest(url: URL) -> (String, String, String) {
      if let jsonResults = jsonFromURL(url: url),
        let contentId = jsonResults["ContentId"] as? String,
        let keyId = jsonResults["KeyId"] as? String,
        let ivString = jsonResults["IV"] as? String {
        
        return (contentId, keyId, ivString)
      }
      
      return ("", "", "")
    }
    
    private func jsonFromURL(url: URL) -> [String: Any]? {
      guard let host = url.host,
        let decodedUrlData = Data(base64Encoded: host, options: NSData.Base64DecodingOptions(rawValue: 0)) else {
          return nil
      }
      
      do {
        let jsonResults = try JSONSerialization.jsonObject(with: decodedUrlData, options: []) as? [String: Any]
        return jsonResults
      } catch {
        return nil
      }
    }

}



