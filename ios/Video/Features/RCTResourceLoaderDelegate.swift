import AVFoundation

class RCTResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate, URLSessionDelegate {
    private var _loadingRequests: [String: AVAssetResourceLoadingRequest?] = [:]
    private var _requestingCertificate = false
    private var _requestingCertificateErrored = false
    private var _drm: DRMParams?
    private var _localSourceEncryptionKeyScheme: String?
    private var _reactTag: NSNumber?
    private var _onVideoError: RCTDirectEventBlock?
    private var _onGetLicense: RCTDirectEventBlock?

    init(
        asset: AVURLAsset,
        drm: DRMParams?,
        localSourceEncryptionKeyScheme: String?,
        onVideoError: RCTDirectEventBlock?,
        onGetLicense: RCTDirectEventBlock?,
        reactTag: NSNumber
    ) {
        super.init()
        let queue = DispatchQueue(label: "assetQueue")
        asset.resourceLoader.setDelegate(self, queue: queue)
        _reactTag = reactTag
        _onVideoError = onVideoError
        _onGetLicense = onGetLicense
        _drm = drm
        _localSourceEncryptionKeyScheme = localSourceEncryptionKeyScheme
    }

    deinit {
        for request in _loadingRequests.values {
            request?.finishLoading()
        }
    }

    func resourceLoader(_: AVAssetResourceLoader, shouldWaitForRenewalOfRequestedResource renewalRequest: AVAssetResourceRenewalRequest) -> Bool {
        return loadingRequestHandling(renewalRequest)
    }

    func resourceLoader(_: AVAssetResourceLoader, shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        return loadingRequestHandling(loadingRequest)
    }

    func resourceLoader(_: AVAssetResourceLoader, didCancel _: AVAssetResourceLoadingRequest) {
        RCTLog("didCancelLoadingRequest")
    }

    func setLicenseResult(_ license: String!, _ licenseUrl: String!) {
        // Check if the loading request exists in _loadingRequests based on licenseUrl
        guard let loadingRequest = _loadingRequests[licenseUrl] else {
            setLicenseResultError("Loading request for licenseUrl \(licenseUrl) not found", licenseUrl)
            return
        }

        // Check if the license data is valid
        guard let respondData = RCTVideoUtils.base64DataFromBase64String(base64String: license) else {
            setLicenseResultError("No data from JS license response", licenseUrl)
            return
        }

        let dataRequest: AVAssetResourceLoadingDataRequest! = loadingRequest?.dataRequest
        dataRequest.respond(with: respondData)
        loadingRequest!.finishLoading()
        _loadingRequests.removeValue(forKey: licenseUrl)
    }

    func setLicenseResultError(_ error: String!, _ licenseUrl: String!) {
        // Check if the loading request exists in _loadingRequests based on licenseUrl
        guard let loadingRequest = _loadingRequests[licenseUrl] else {
            print("Loading request for licenseUrl \(licenseUrl) not found. Error: \(error)")
            return
        }

        self.finishLoadingWithError(error: RCTVideoErrorHandler.fromJSPart(error), licenseUrl: licenseUrl)
    }

    func finishLoadingWithError(error: Error!, licenseUrl: String!) -> Bool {
        // Check if the loading request exists in _loadingRequests based on licenseUrl
        guard let loadingRequest = _loadingRequests[licenseUrl], let error = error as NSError? else {
            // Handle the case where the loading request is not found or error is nil
            return false
        }

        loadingRequest!.finishLoading(with: error)
        _loadingRequests.removeValue(forKey: licenseUrl)
        _onVideoError?([
            "error": [
                "code": NSNumber(value: error.code),
                "localizedDescription": error.localizedDescription ?? "",
                "localizedFailureReason": error.localizedFailureReason ?? "",
                "localizedRecoverySuggestion": error.localizedRecoverySuggestion ?? "",
                "domain": error.domain,
            ],
            "target": _reactTag,
        ])

        return false
    }

    func loadingRequestHandling(_ loadingRequest: AVAssetResourceLoadingRequest!) -> Bool {
        if handleEmbeddedKey(loadingRequest) {
            return true
        }

        if _drm != nil {
            return handleDrm(loadingRequest)
        }

        return false
    }

    func handleEmbeddedKey(_ loadingRequest: AVAssetResourceLoadingRequest!) -> Bool {
        guard let url = loadingRequest.request.url,
              let _localSourceEncryptionKeyScheme,
              let persistentKeyData = RCTVideoUtils.extractDataFromCustomSchemeUrl(from: url, scheme: _localSourceEncryptionKeyScheme)
        else {
            return false
        }

        loadingRequest.contentInformationRequest?.contentType = AVStreamingKeyDeliveryPersistentContentKeyType
        loadingRequest.contentInformationRequest?.isByteRangeAccessSupported = true
        loadingRequest.contentInformationRequest?.contentLength = Int64(persistentKeyData.count)
        loadingRequest.dataRequest?.respond(with: persistentKeyData)
        loadingRequest.finishLoading()

        return true
    }

    func handleDrm(_ loadingRequest: AVAssetResourceLoadingRequest!) -> Bool {
        if _requestingCertificate {
            return true
        } else if _requestingCertificateErrored {
            return false
        }

        let requestKey: String = loadingRequest.request.url?.absoluteString ?? ""

        _loadingRequests[requestKey] = loadingRequest

        guard let _drm, let drmType = _drm.type, drmType == "fairplay" else {
            return finishLoadingWithError(error: RCTVideoErrorHandler.noDRMData, licenseUrl: requestKey)
        }

        Task {
            do {
                if _onGetLicense != nil {
                    let contentId = _drm.contentId ?? loadingRequest.request.url?.host
                    let spcData = try await RCTVideoDRM.handleWithOnGetLicense(
                        loadingRequest: loadingRequest,
                        contentId: contentId,
                        certificateUrl: _drm.certificateUrl,
                        base64Certificate: _drm.base64Certificate
                    )

                    self._requestingCertificate = true
                    self._onGetLicense?(["licenseUrl": self._drm?.licenseServer ?? "",
                                         "loadedLicenseUrl": loadingRequest.request.url?.absoluteString ?? "",
                                         "contentId": contentId ?? "",
                                         "spcBase64": spcData.base64EncodedString(options: []),
                                         "target": self._reactTag])
                } else {
                    let data = try await RCTVideoDRM.handleInternalGetLicense(
                        loadingRequest: loadingRequest,
                        contentId: _drm.contentId,
                        licenseServer: _drm.licenseServer,
                        certificateUrl: _drm.certificateUrl,
                        base64Certificate: _drm.base64Certificate,
                        headers: _drm.headers
                    )

                    guard let dataRequest = loadingRequest.dataRequest else {
                        throw RCTVideoErrorHandler.noCertificateData
                    }
                    dataRequest.respond(with: data)
                    loadingRequest.finishLoading()
                }
            } catch {
                self.finishLoadingWithError(error: error, licenseUrl: requestKey)
                self._requestingCertificateErrored = true
            }
        }

        return true
    }
}
