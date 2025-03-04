//
//  DRMManager.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 13/08/2024.
//

import AVFoundation

class DRMManager: NSObject, DRMManagerSpec {
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

    private func processContentKeyRequest(keyRequest: AVContentKeyRequest) async throws {
        guard let assetId = getAssetId(keyRequest: keyRequest),
              let assetIdData = assetId.data(using: .utf8) else {
            throw RCTVideoError.invalidContentId
        }

        let appCertificate = try await requestApplicationCertificate()
        let spcData = try await keyRequest.makeStreamingContentKeyRequestData(forApp: appCertificate, contentIdentifier: assetIdData)

        if onGetLicense != nil {
            try await requestLicenseFromJS(spcData: spcData, assetId: assetId, keyRequest: keyRequest)
        } else {
            let license = try await requestLicense(spcData: spcData)
            try finishProcessingContentKeyRequest(keyRequest: keyRequest, license: license)
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
            return url.replacingOccurrences(of: "skd://", with: "")
        }

        return nil
    }
}
