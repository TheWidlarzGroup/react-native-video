//
//  DRMManager.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 13/08/2024.
//

import AVFoundation

class DRMManager: NSObject {
    static let queue = DispatchQueue(label: "RNVideoContentKeyDelegateQueue")
    let contentKeySession: AVContentKeySession
    
    var drmParams: DRMParams?
    var reactTag: NSNumber?
    var onVideoError: RCTDirectEventBlock?
    var onGetLicense: RCTDirectEventBlock?
    
    // Licneses handled by onGetLicense
    var _pendingLicenses: [String: AVContentKeyRequest] = [:]
    
    override init() {
        contentKeySession = AVContentKeySession(keySystem: .fairPlayStreaming)
        super.init()
        
        contentKeySession.setDelegate(self, queue: DRMManager.queue)
    }
    
    public func createContentKeyRequest(asset: AVContentKeyRecipient, drmParams: DRMParams?, reactTag: NSNumber?, onVideoError: RCTDirectEventBlock?, onGetLicense: RCTDirectEventBlock?) {
        self.reactTag = reactTag
        self.onVideoError = onVideoError
        self.onGetLicense = onGetLicense
        self.drmParams = drmParams
        
        contentKeySession.addContentKeyRecipient(asset)
    }
    
    func handleContentKeyRequest(keyRequest: AVContentKeyRequest) {
        Task {
            do {
                try await processContentKeyRequest(keyRequest: keyRequest)
            } catch {
                keyRequest.processContentKeyResponseError(error)
            }
        }
    }
    
    func finishProcessingContentKeyRequest(keyRequest: AVContentKeyRequest, licence: Data) throws {
        let keyResponse = AVContentKeyResponse(fairPlayStreamingKeyResponseData: licence)
        keyRequest.processContentKeyResponse(keyResponse)
    }
    
    private func processContentKeyRequest(keyRequest: AVContentKeyRequest) async throws {
        guard let assetId = drmParams?.contentId, let assetIdData = assetId.data(using: .utf8) else {
            throw RCTVideoErrorHandler.invalidContentId
        }
        
        let appCertificte = try await self.requestApplicationCertificate(keyRequest: keyRequest)
        let spcData = try await keyRequest.makeStreamingContentKeyRequestData(forApp: appCertificte, contentIdentifier: assetIdData)
        
        if onGetLicense == nil {
            let licence = try await self.requestLicence(spcData: spcData, keyRequest: keyRequest)
            try finishProcessingContentKeyRequest(keyRequest: keyRequest, licence: licence)
        } else {
            try requestLicneseFromJS(spcData: spcData, assetId: assetId, keyRequest: keyRequest)
        }
    }
    
    private func requestApplicationCertificate(keyRequest: AVContentKeyRequest) async throws -> Data {
        guard let urlString = drmParams?.certificateUrl, let url = URL(string: urlString) else {
            throw RCTVideoErrorHandler.noCertificateURL
        }
        
        let urlRequest = URLRequest(url: url)
        let (data, response) = try await URLSession.shared.data(from: urlRequest)
        
        if let httpsResponse = response as? HTTPURLResponse {
            if httpsResponse.statusCode != 200 {
                throw RCTVideoErrorHandler.noCertificateData
            }
        }
        
        guard let certData = (drmParams?.base64Certificate != nil ? Data(base64Encoded: data) : data) else {
            throw RCTVideoErrorHandler.noCertificateData
        }
        
        return data
    }
    
    private func requestLicence(spcData: Data, keyRequest: AVContentKeyRequest) async throws -> Data {
        let licence: Data? = nil
        
        guard let licenceSeverUrlString = drmParams?.licenseServer else {
            throw RCTVideoErrorHandler.noLicenseServerURL
        }
        
        guard let licenceSeverUrl = URL(string: licenceSeverUrlString) else {
            throw RCTVideoErrorHandler.noLicenseServerURL
        }
        
        var urlRequest = URLRequest(url: licenceSeverUrl)
        urlRequest.httpMethod = "POST"

        if let headers = drmParams?.headers {
            for item in headers {
                guard let value = item.value as? String else {
                    continue
                }
                urlRequest.setValue(value, forHTTPHeaderField: item.key)
            }
        }
        
        urlRequest.httpBody = spcData
        
        let (data, response) = try await URLSession.shared.data(from: urlRequest)
        
        if let httpsResponse = response as? HTTPURLResponse {
            if httpsResponse.statusCode != 200 {
                throw RCTVideoErrorHandler.licenseRequestNotOk(httpsResponse.statusCode)
            }
        }
        
        if data.isEmpty {
            throw RCTVideoErrorHandler.noDataFromLicenseRequest
        }
        
        return data
    }
}
