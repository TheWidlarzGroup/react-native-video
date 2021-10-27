import AVFoundation

class RCTResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate, URLSessionDelegate {
    
    private var _loadingRequest:AVAssetResourceLoadingRequest?
    private var _requestingCertificate:Bool = false
    private var _requestingCertificateErrored:Bool = false
    private var _drm: DRMParams?
    private var _reactTag: NSNumber?
    private var _onVideoError: RCTDirectEventBlock?
    private var _onGetLicense: RCTDirectEventBlock?
    
    
    init(
        asset: AVURLAsset,
        drm: DRMParams?,
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
    
    func base64DataFromBase64String(base64String:String?) -> Data? {
        if let base64String = base64String {
            return Data(base64Encoded:base64String)
        }
        return nil
    }
    
    func setLicenseResult(_ license:String!) {
        guard let respondData = self.base64DataFromBase64String(base64String: license),
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
    
    func finishLoadingWithError(error:NSError!) -> Bool {
        if let _loadingRequest = _loadingRequest, let error = error {
            let licenseError:NSError! = error
            _loadingRequest.finishLoading(with: licenseError)
            
            _onVideoError?([
                "error": [
                    "code": NSNumber(value: error.code),
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
        if _requestingCertificate {
            return true
        } else if _requestingCertificateErrored {
            return false
        }
        _loadingRequest = loadingRequest
        
        let url = loadingRequest.request.url
        guard let _drm = _drm else {
            return finishLoadingWithError(error: RCTVideoErrorHandler.noDRMData)
        }
        
        var contentId:String!
        let contentIdOverride:String! = _drm.contentId
        if contentIdOverride != nil {
            contentId = contentIdOverride
        } else if (_onGetLicense != nil) {
            contentId = url?.host
        } else {
            contentId = url?.absoluteString.replacingOccurrences(of: "skd://", with:"")
        }
        
        let drmType:String! = _drm.type
        guard drmType == "fairplay" else {
            return finishLoadingWithError(error: RCTVideoErrorHandler.noDRMData)
        }
        
        let certificateStringUrl:String! = _drm.certificateUrl
        guard let certificateStringUrl = certificateStringUrl, let certificateURL = URL(string: certificateStringUrl.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed) ?? "") else {
            return finishLoadingWithError(error: RCTVideoErrorHandler.noCertificateURL)
        }
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }
            var certificateData:Data?
            if (_drm.base64Certificate != nil) {
                certificateData = Data(base64Encoded: certificateData! as Data, options: .ignoreUnknownCharacters)
            } else {
                do {
                   certificateData = try Data(contentsOf: certificateURL)
                } catch {}
            }

            guard let certificateData = certificateData else {
                self.finishLoadingWithError(error: RCTVideoErrorHandler.noCertificateData)
                self._requestingCertificateErrored = true
                return
            }
            
            var contentIdData:NSData!
            if self._onGetLicense != nil {
                contentIdData = contentId.data(using: .utf8) as NSData?
            } else {
               contentIdData = NSData(bytes: contentId.cString(using: String.Encoding.utf8), length:contentId.lengthOfBytes(using: String.Encoding.utf8))
            }
            
            let dataRequest:AVAssetResourceLoadingDataRequest! = loadingRequest.dataRequest
            guard dataRequest != nil else {
                self.finishLoadingWithError(error: RCTVideoErrorHandler.noCertificateData)
                self._requestingCertificateErrored = true
                return
            }
            
            var spcError:NSError!
            var spcData: Data?
            do {
                spcData = try loadingRequest.streamingContentKeyRequestData(forApp: certificateData, contentIdentifier: contentIdData as Data, options: nil)
            } catch let spcError {
                print("SPC error")
            }
            // Request CKC to the server
            var licenseServer:String! = _drm.licenseServer
            if spcError != nil {
                self.finishLoadingWithError(error: spcError)
                self._requestingCertificateErrored = true
            }
            
            guard spcData != nil else {
                self.finishLoadingWithError(error: RCTVideoErrorHandler.noSPC)
                self._requestingCertificateErrored = true
                return
            }
            
            // js client has a onGetLicense callback and will handle license fetching
            if let _onGetLicense = self._onGetLicense {
                let base64Encoded = spcData?.base64EncodedString(options: [])
                self._requestingCertificate = true
                if licenseServer == nil {
                    licenseServer = ""
                }
                _onGetLicense(["licenseUrl": licenseServer,
                               "contentId": contentId,
                               "spcBase64": base64Encoded,
                               "target": self._reactTag])
                
                
            } else if licenseServer != nil {
                self.fetchLicense(
                    licenseServer: licenseServer,
                    spcData: spcData,
                    contentId: contentId,
                    dataRequest: dataRequest
                )
            }
        }
        return true
    }
    
    func fetchLicense(
        licenseServer: String,
        spcData: Data?,
        contentId: String,
        dataRequest: AVAssetResourceLoadingDataRequest!
    ) {
        var request = URLRequest(url: URL(string: licenseServer)!)
        request.httpMethod = "POST"
        
        // HEADERS
        if let headers = _drm?.headers {
            for item in headers {
                guard let key = item.key as? String, let value = item.value as? String else {
                    continue
                }
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        if (_onGetLicense != nil) {
            request.httpBody = spcData
        } else {
            let spcEncoded = spcData?.base64EncodedString(options: [])
            let spcUrlEncoded = CFURLCreateStringByAddingPercentEscapes(kCFAllocatorDefault, spcEncoded as? CFString? as! CFString, nil, "?=&+" as CFString, CFStringBuiltInEncodings.UTF8.rawValue) as? String
            let post = String(format:"spc=%@&%@", spcUrlEncoded as! CVarArg, contentId)
            let postData = post.data(using: String.Encoding.utf8, allowLossyConversion:true)
            request.httpBody = postData
        }
        
        let postDataTask = URLSession.shared.dataTask(with: request as URLRequest, completionHandler:{ [weak self] (data:Data!,response:URLResponse!,error:Error!) in
            guard let self = self else { return }
            let httpResponse:HTTPURLResponse! = response as! HTTPURLResponse
            guard error == nil else {
                print("Error getting license from \(licenseServer), HTTP status code \(httpResponse.statusCode)")
                self.finishLoadingWithError(error: error as NSError?)
                self._requestingCertificateErrored = true
                return
            }
            guard httpResponse.statusCode == 200 else {
                print("Error getting license from \(licenseServer), HTTP status code \(httpResponse.statusCode)")
                self.finishLoadingWithError(error: RCTVideoErrorHandler.licenseRequestNotOk(httpResponse.statusCode))
                self._requestingCertificateErrored = true
                return
            }
            
            guard data != nil else {
                self.finishLoadingWithError(error: RCTVideoErrorHandler.noDataFromLicenseRequest)
                self._requestingCertificateErrored = true
                return
            }
            
            if (self._onGetLicense != nil) {
                dataRequest.respond(with: data)
            } else if let decodedData = Data(base64Encoded: data, options: []) {
                dataRequest.respond(with: decodedData)
            }
            self._loadingRequest?.finishLoading()
        })
        postDataTask.resume()
    }
}
