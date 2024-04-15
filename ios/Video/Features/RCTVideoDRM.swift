import AVFoundation

enum RCTVideoDRM {
    static func fetchLicense(
        licenseServer: String,
        spcData: Data?,
        contentId: String,
        headers: [String: Any]?
    ) async throws -> Data {
        let request = createLicenseRequest(licenseServer: licenseServer, spcData: spcData, contentId: contentId, headers: headers)

        let (data, response) = try await URLSession.shared.data(from: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw RCTVideoErrorHandler.noDataFromLicenseRequest
        }

        if httpResponse.statusCode != 200 {
            print("Error getting license from \(licenseServer), HTTP status code \(httpResponse.statusCode)")
            throw RCTVideoErrorHandler.licenseRequestNotOk(httpResponse.statusCode)
        }

        guard let decodedData = Data(base64Encoded: data, options: []) else {
            throw RCTVideoErrorHandler.noDataFromLicenseRequest
        }

        return decodedData
    }

    static func createLicenseRequest(
        licenseServer: String,
        spcData: Data?,
        contentId: String,
        headers: [String: Any]?
    ) -> URLRequest {
        var request = URLRequest(url: URL(string: licenseServer)!)
        request.httpMethod = "POST"

        if let headers {
            for item in headers {
                guard let key = item.key as? String, let value = item.value as? String else {
                    continue
                }
                request.setValue(value, forHTTPHeaderField: key)
            }
        }

        let spcEncoded = spcData?.base64EncodedString(options: [])
        let spcUrlEncoded = CFURLCreateStringByAddingPercentEscapes(
            kCFAllocatorDefault,
            spcEncoded as? CFString? as! CFString,
            nil,
            "?=&+" as CFString,
            CFStringBuiltInEncodings.UTF8.rawValue
        ) as? String
        let post = String(format: "spc=%@&%@", spcUrlEncoded as! CVarArg, contentId)
        let postData = post.data(using: String.Encoding.utf8, allowLossyConversion: true)
        request.httpBody = postData

        return request
    }

    static func fetchSpcData(
        loadingRequest: AVAssetResourceLoadingRequest,
        certificateData: Data,
        contentIdData: Data
    ) throws -> Data {
        #if os(visionOS)
            // TODO: DRM is not supported yet on visionOS. See #3467
            throw NSError(domain: "DRM is not supported yet on visionOS", code: 0, userInfo: nil)
        #else
            guard let spcData = try? loadingRequest.streamingContentKeyRequestData(
                forApp: certificateData,
                contentIdentifier: contentIdData as Data,
                options: nil
            ) else {
                throw RCTVideoErrorHandler.noSPC
            }

            return spcData
        #endif
    }

    static func createCertificateData(certificateStringUrl: String?, base64Certificate: Bool?) throws -> Data {
        guard let certificateStringUrl,
              let certificateURL = URL(string: certificateStringUrl.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed) ?? "") else {
            throw RCTVideoErrorHandler.noCertificateURL
        }

        var certificateData: Data?
        do {
            certificateData = try Data(contentsOf: certificateURL)
            if base64Certificate != nil {
                certificateData = Data(base64Encoded: certificateData! as Data, options: .ignoreUnknownCharacters)
            }
        } catch {}

        guard let certificateData else {
            throw RCTVideoErrorHandler.noCertificateData
        }

        return certificateData
    }

    static func handleWithOnGetLicense(loadingRequest: AVAssetResourceLoadingRequest, contentId: String?, certificateUrl: String?,
                                       base64Certificate: Bool?) throws -> Data {
        let contentIdData = contentId?.data(using: .utf8)

        let certificateData = try? RCTVideoDRM.createCertificateData(certificateStringUrl: certificateUrl, base64Certificate: base64Certificate)

        guard let contentIdData else {
            throw RCTVideoError.invalidContentId as! Error
        }

        guard let certificateData else {
            throw RCTVideoError.noCertificateData as! Error
        }

        return try RCTVideoDRM.fetchSpcData(
            loadingRequest: loadingRequest,
            certificateData: certificateData,
            contentIdData: contentIdData
        )
    }

    static func handleInternalGetLicense(
        loadingRequest: AVAssetResourceLoadingRequest,
        contentId: String?,
        licenseServer: String?,
        certificateUrl: String?,
        base64Certificate: Bool?,
        headers: [String: Any]?
    ) async throws -> Data {
        let url = loadingRequest.request.url

        let parsedContentId = contentId != nil && !contentId!.isEmpty ? contentId : nil

        guard let contentId = parsedContentId ?? url?.absoluteString.replacingOccurrences(of: "skd://", with: "") else {
            throw RCTVideoError.invalidContentId as! Error
        }

        let contentIdData = NSData(bytes: contentId.cString(using: String.Encoding.utf8), length: contentId.lengthOfBytes(using: String.Encoding.utf8)) as Data
        let certificateData = try RCTVideoDRM.createCertificateData(certificateStringUrl: certificateUrl, base64Certificate: base64Certificate)
        let spcData = try RCTVideoDRM.fetchSpcData(
            loadingRequest: loadingRequest,
            certificateData: certificateData,
            contentIdData: contentIdData
        )

        guard let licenseServer else {
            throw RCTVideoError.noLicenseServerURL as! Error
        }

        return try await RCTVideoDRM.fetchLicense(
            licenseServer: licenseServer,
            spcData: spcData,
            contentId: contentId,
            headers: headers
        )
    }
}
