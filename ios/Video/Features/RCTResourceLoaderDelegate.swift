import AVFoundation
import Promises

class RCTResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate, URLSessionDelegate {
    
    private var _loadingRequest:AVAssetResourceLoadingRequest?
    private var _requestingCertificate:Bool = false
    private var _requestingCertificateErrored:Bool = false
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
        _loadingRequest?.finishLoading()
    }
    
    func resourceLoader(_ resourceLoader:AVAssetResourceLoader, shouldWaitForRenewalOfRequestedResource renewalRequest:AVAssetResourceRenewalRequest) -> Bool {
        return loadingRequestHandling(renewalRequest)
    }
    
    func resourceLoader(_ resourceLoader:AVAssetResourceLoader, shouldWaitForLoadingOfRequestedResource loadingRequest:AVAssetResourceLoadingRequest) -> Bool {
        return loadingRequestHandling(loadingRequest)
    }
    
    func resourceLoader(_ resourceLoader:AVAssetResourceLoader, didCancel loadingRequest:AVAssetResourceLoadingRequest) {
        NSLog("didCancelLoadingRequest")
    }

    func setLicenseResult(_ license:String!) {
        guard let respondData = RCTVideoUtils.base64DataFromBase64String(base64String: license),
              let _loadingRequest = _loadingRequest else {
                  setLicenseResultError("No data from JS license response")
                  return
              }
        let dataRequest:AVAssetResourceLoadingDataRequest! = _loadingRequest.dataRequest
        dataRequest.respond(with: respondData)
        _loadingRequest.finishLoading()
    }
    
    func setLicenseResultError(_ error:String!) {
        if _loadingRequest != nil {
            self.finishLoadingWithError(error: RCTVideoErrorHandler.fromJSPart(error))
        }
    }
    
    func finishLoadingWithError(error:Error!) -> Bool {
        if let _loadingRequest = _loadingRequest, let error = error {
            _loadingRequest.finishLoading(with: error as! NSError)
            
            _onVideoError?([
                "error": [
                    "code": NSNumber(value: (error as NSError).code),
                    "localizedDescription": error.localizedDescription == nil ? "" : error.localizedDescription,
                    "localizedFailureReason": ((error as NSError).localizedFailureReason == nil ? "" : (error as NSError).localizedFailureReason) ?? "",
                    "localizedRecoverySuggestion": ((error as NSError).localizedRecoverySuggestion == nil ? "" : (error as NSError).localizedRecoverySuggestion) ?? "",
                    "domain": (error as NSError).domain
                ],
                "target": _reactTag
            ])
            
        }
        return false
    }
    
    func loadingRequestHandling(_ loadingRequest:AVAssetResourceLoadingRequest!) -> Bool {
        if handleEmbeddedKey(loadingRequest) {
            return true
        }
        
        if _drm != nil {
            return handleDrm(loadingRequest)
        }
        
       return false
    }
    
    func handleEmbeddedKey(_ loadingRequest:AVAssetResourceLoadingRequest!) -> Bool {
        guard let url = loadingRequest.request.url,
              let _localSourceEncryptionKeyScheme = _localSourceEncryptionKeyScheme,
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
    
    func handleDrm(_ loadingRequest:AVAssetResourceLoadingRequest!) -> Bool {
        if _requestingCertificate {
            return true
        } else if _requestingCertificateErrored {
            return false
        }
        _loadingRequest = loadingRequest
        
        guard let _drm = _drm, let drmType = _drm.type, drmType == "fairplay" else {
            return finishLoadingWithError(error: RCTVideoErrorHandler.noDRMData)
        }
        
        var promise: Promise<Data>
        if _onGetLicense != nil {
            let contentId = _drm.contentId ?? loadingRequest.request.url?.host
            promise = RCTVideoDRM.handleWithOnGetLicense(
                loadingRequest:loadingRequest,
                contentId:contentId,
                certificateUrl:_drm.certificateUrl,
                base64Certificate:_drm.base64Certificate
            ) .then{ spcData -> Void in
                self._requestingCertificate = true
                self._onGetLicense?(["licenseUrl": self._drm?.licenseServer ?? "",
                                     "contentId": contentId,
                                     "spcBase64": spcData.base64EncodedString(options: []),
                                     "target": self._reactTag])
            }
        } else {
            promise = RCTVideoDRM.handleInternalGetLicense(
                loadingRequest:loadingRequest,
                contentId:_drm.contentId,
                licenseServer:_drm.licenseServer,
                certificateUrl:_drm.certificateUrl,
                base64Certificate:_drm.base64Certificate,
                headers:_drm.headers
            ) .then{ data -> Void in
                    guard let dataRequest = loadingRequest.dataRequest else {
                        throw RCTVideoErrorHandler.noCertificateData
                    }
                    dataRequest.respond(with:data)
                    loadingRequest.finishLoading()
                }
        }
        
        
        promise.catch{ error in
            self.finishLoadingWithError(error:error)
            self._requestingCertificateErrored = true
        }
        
        return true
    }
}
