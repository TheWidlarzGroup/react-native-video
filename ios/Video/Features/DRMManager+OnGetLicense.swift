//
//  DRMManager+OnGetLicense.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 14/08/2024.
//

import AVFoundation

extension DRMManager {
    func requestLicneseFromJS(spcData: Data, assetId: String, keyRequest: AVContentKeyRequest) throws {
        guard let onGetLicense else {
            throw RCTVideoErrorHandler.noDataFromLicenseRequest
        }
        
        guard let licenceSeverUrl = drmParams?.licenseServer, licenceSeverUrl.isEmpty else {
            throw RCTVideoErrorHandler.noLicenseServerURL
        }
        
        _pendingLicenses[licenceSeverUrl] = keyRequest
        
        onGetLicense([
            "licenseUrl": licenceSeverUrl,
            "loadedLicenseUrl": keyRequest.identifier as Any,
            "contetId": assetId,
            "spcBase64": spcData.base64EncodedString(),
            "target": reactTag as Any
        ])
    }
    
    public func setJSLicneseResult(license: String, licenseUrl: String) {
        // Check if the loading request exists in _loadingRequests based on licenseUrl
        guard let keyContentRequest = _pendingLicenses[licenseUrl] else {
            setJSLinceseError(error: "Loading request for licenseUrl \(licenseUrl) not found", licenseUrl: licenseUrl)
            return
        }
        
        guard let responseData = Data(base64Encoded: license) else {
            setJSLinceseError(error: "No data from JS license response", licenseUrl: licenseUrl)
            return
        }
        
        do {
            try finishProcessingContentKeyRequest(keyRequest: keyContentRequest, licence: responseData)
        } catch {
            keyContentRequest.processContentKeyResponseError(error)
        }
        
        _pendingLicenses.removeValue(forKey: licenseUrl)
    }
    
    public func setJSLinceseError(error: String, licenseUrl: String) {
        if let onVideoError, let reactTag {
            let err = RCTVideoErrorHandler.fromJSPart(error)
            onVideoError([
                "error": [
                    "code": NSNumber(value: err.code),
                    "localizedDescription": err.localizedDescription,
                    "localizedFailureReason": err.localizedFailureReason ?? "",
                    "localizedRecoverySuggestion": err.localizedRecoverySuggestion ?? "",
                    "domain": err.domain,
                ],
                "target": reactTag,
            ])
        }
        
        // Check if the loading request exists in _loadingRequests based on licenseUrl
        guard _pendingLicenses.contains(where: { url, _ in url == licenseUrl}) else {
           print("Loading request for licenseUrl \(licenseUrl) not found")
           return
        }
        
        _pendingLicenses.removeValue(forKey: licenseUrl)
    }
}
