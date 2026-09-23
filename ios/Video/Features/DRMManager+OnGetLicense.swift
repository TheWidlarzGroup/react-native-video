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

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.pendingLicenses[loadedLicenseUrl, default: []].append(keyRequest)
            onGetLicense([
                "licenseUrl": licenseServerUrl,
                "loadedLicenseUrl": loadedLicenseUrl,
                "contentId": assetId,
                "spcBase64": spcData.base64EncodedString(),
                "target": self.reactTag as Any,
            ])
        }
    }

    func setJSLicenseResult(license: String, licenseUrl: String) {
        guard let keyContentRequest = pendingLicenses[licenseUrl]?.first else {
            setJSLicenseError(error: "Loading request for licenseUrl \(licenseUrl) not found", licenseUrl: licenseUrl)
            return
        }

        guard let responseData = Data(base64Encoded: license) else {
            setJSLicenseError(error: "Invalid license data", licenseUrl: licenseUrl)
            return
        }

        takePendingLicense(for: licenseUrl)
        do {
            try finishProcessingContentKeyRequest(keyRequest: keyContentRequest, license: responseData)
        } catch {
            handleError(error, for: keyContentRequest)
        }
    }

    func setJSLicenseError(error: String, licenseUrl: String) {
        let rctError = RCTVideoError.fromJSPart(error)

        guard let keyContentRequest = takePendingLicense(for: licenseUrl) else {
            onVideoError?([
                "error": RCTVideoErrorHandler.createError(from: rctError),
                "target": reactTag as Any,
            ])
            return
        }

        handleError(rctError, for: keyContentRequest)
    }

    @discardableResult
    private func takePendingLicense(for licenseUrl: String) -> AVContentKeyRequest? {
        guard var requests = pendingLicenses[licenseUrl], !requests.isEmpty else { return nil }

        let request = requests.removeFirst()
        if requests.isEmpty {
            pendingLicenses.removeValue(forKey: licenseUrl)
        } else {
            pendingLicenses[licenseUrl] = requests
        }
        return request
    }
}
