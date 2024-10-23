//
//  DRMManager+OnGetLicense.swift
//  react-native-video
//
//  Created by Krzysztof Moch on 14/08/2024.
//

import AVFoundation

extension DRMManager {
    func requestLicenseFromJS(spcData: Data, assetId: String, keyRequest: AVContentKeyRequest) async throws {
        guard let onGetLicense else {
            throw RCTVideoError.noDataFromLicenseRequest
        }

        guard let licenseServerUrl = drmParams?.licenseServer, !licenseServerUrl.isEmpty else {
            throw RCTVideoError.noLicenseServerURL
        }

        guard let loadedLicenseUrl = keyRequest.identifier as? String else {
            throw RCTVideoError.invalidContentId
        }

        pendingLicenses[loadedLicenseUrl] = keyRequest

        DispatchQueue.main.async { [weak self] in
            onGetLicense([
                "licenseUrl": licenseServerUrl,
                "loadedLicenseUrl": loadedLicenseUrl,
                "contentId": assetId,
                "spcBase64": spcData.base64EncodedString(),
                "target": self?.reactTag as Any,
            ])
        }
    }

    func setJSLicenseResult(license: String, licenseUrl: String) {
        guard let keyContentRequest = pendingLicenses[licenseUrl] else {
            setJSLicenseError(error: "Loading request for licenseUrl \(licenseUrl) not found", licenseUrl: licenseUrl)
            return
        }

        guard let responseData = Data(base64Encoded: license) else {
            setJSLicenseError(error: "Invalid license data", licenseUrl: licenseUrl)
            return
        }

        do {
            try finishProcessingContentKeyRequest(keyRequest: keyContentRequest, license: responseData)
            pendingLicenses.removeValue(forKey: licenseUrl)
        } catch {
            handleError(error, for: keyContentRequest)
        }
    }

    func setJSLicenseError(error: String, licenseUrl: String) {
        let rctError = RCTVideoError.fromJSPart(error)

        DispatchQueue.main.async { [weak self] in
            self?.onVideoError?([
                "error": RCTVideoErrorHandler.createError(from: rctError),
                "target": self?.reactTag as Any,
            ])
        }

        pendingLicenses.removeValue(forKey: licenseUrl)
    }
}
