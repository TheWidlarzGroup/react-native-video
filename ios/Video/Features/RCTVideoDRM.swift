import AVFoundation
import Promises

struct RCTVideoDRM {
    @available(*, unavailable) private init() {}

    static func fetchLicense(
        licenseServer: String,
        spcData: Data?,
        contentId: String,
        headers: [String:Any]?
    ) -> Promise<Data> {
        let request = createLicenseRequest(licenseServer:licenseServer, spcData:spcData, contentId:contentId, headers:headers)
        
        return Promise<Data>(on: .global()) { fulfill, reject in
            let postDataTask = URLSession.shared.dataTask(with: request as URLRequest, completionHandler:{ (data:Data!,response:URLResponse!,error:Error!) in
                
                let httpResponse:HTTPURLResponse! = (response as! HTTPURLResponse)

                guard error == nil else {
                    print("Error getting license from \(licenseServer), HTTP status code \(httpResponse.statusCode)")
                    reject(error)
                    return
                }
                guard httpResponse.statusCode == 200 else {
                    print("Error getting license from \(licenseServer), HTTP status code \(httpResponse.statusCode)")
                    reject(RCTVideoErrorHandler.licenseRequestNotOk(httpResponse.statusCode))
                    return
                }
                
                guard data != nil, let decodedData = Data(base64Encoded: data, options: []) else {
                    reject(RCTVideoErrorHandler.noDataFromLicenseRequest)
                    return
                }
                
                fulfill(decodedData)
            })
            postDataTask.resume()
        }
    }
    
    static func createLicenseRequest(
        licenseServer: String,
        spcData: Data?,
        contentId: String,
        headers: [String:Any]?
    ) -> URLRequest {
        var request = URLRequest(url: URL(string: licenseServer)!)
        request.httpMethod = "POST"
        
        if let headers = headers {
            for item in headers {
                guard let key = item.key as? String, let value = item.value as? String else {
                    continue
                }
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        let spcEncoded = spcData?.base64EncodedString(options: [])
        let spcUrlEncoded = CFURLCreateStringByAddingPercentEscapes(kCFAllocatorDefault, spcEncoded as? CFString? as! CFString, nil, "?=&+" as CFString, CFStringBuiltInEncodings.UTF8.rawValue) as? String
        let post = String(format:"spc=%@&%@", spcUrlEncoded as! CVarArg, contentId)
        let postData = post.data(using: String.Encoding.utf8, allowLossyConversion:true)
        request.httpBody = postData
        
        return request
    }
    
    static func fetchSpcData(
        loadingRequest: AVAssetResourceLoadingRequest,
        certificateData: Data,
        contentIdData: Data
    ) -> Promise<Data> {
        return Promise<Data>(on: .global()) { fulfill, reject in
            var spcError:NSError!
            var spcData: Data?
            do {
                spcData = try loadingRequest.streamingContentKeyRequestData(forApp: certificateData, contentIdentifier: contentIdData as Data, options: nil)
            } catch _ {
                print("SPC error")
            }
            
            if spcError != nil {
                reject(spcError)
            }
            
            guard let spcData = spcData else {
                reject(RCTVideoErrorHandler.noSPC)
                return
            }
            
            fulfill(spcData)
        }
    }
    
    static func createCertificateData(certificateStringUrl:String?, base64Certificate:Bool?) -> Promise<Data> {
        return Promise<Data>(on: .global()) { fulfill, reject in

            guard let certificateStringUrl = certificateStringUrl,
                  let certificateURL = URL(string: certificateStringUrl.addingPercentEncoding(withAllowedCharacters: .urlFragmentAllowed) ?? "") else {
                      reject(RCTVideoErrorHandler.noCertificateURL)
                return
            }

            var certificateData:Data?
            do {
               certificateData = try Data(contentsOf: certificateURL)
                if (base64Certificate != nil) {
                    certificateData = Data(base64Encoded: certificateData! as Data, options: .ignoreUnknownCharacters)
                }
            } catch {}
            
            guard let certificateData = certificateData else {
                reject(RCTVideoErrorHandler.noCertificateData)
                return
            }
            
            fulfill(certificateData)
        }
    }
    
    static func handleWithOnGetLicense(loadingRequest: AVAssetResourceLoadingRequest, contentId:String?, certificateUrl:String?, base64Certificate:Bool?) -> Promise<Data> {
        let contentIdData = contentId?.data(using: .utf8)
        
        return RCTVideoDRM.createCertificateData(certificateStringUrl:certificateUrl, base64Certificate:base64Certificate)
            .then{ certificateData -> Promise<Data> in
                guard let contentIdData = contentIdData else {
                    throw RCTVideoError.invalidContentId as! Error
                }
                
                return RCTVideoDRM.fetchSpcData(
                    loadingRequest:loadingRequest,
                    certificateData:certificateData,
                    contentIdData:contentIdData
                )
            }
    }
    
    static func handleInternalGetLicense(loadingRequest: AVAssetResourceLoadingRequest, contentId:String?, licenseServer:String?, certificateUrl:String?, base64Certificate:Bool?, headers: [String:Any]?) -> Promise<Data> {
        let url = loadingRequest.request.url
        
        guard let contentId = contentId ?? url?.absoluteString.replacingOccurrences(of: "skd://", with:"") else {
            return Promise(RCTVideoError.invalidContentId as! Error)
        }
        
        let contentIdData = NSData(bytes: contentId.cString(using: String.Encoding.utf8), length:contentId.lengthOfBytes(using: String.Encoding.utf8)) as Data
        
        return RCTVideoDRM.createCertificateData(certificateStringUrl:certificateUrl, base64Certificate:base64Certificate)
            .then{ certificateData in
                return RCTVideoDRM.fetchSpcData(
                    loadingRequest:loadingRequest,
                    certificateData:certificateData,
                    contentIdData:contentIdData
                )
            }
            .then{ spcData -> Promise<Data> in
                guard let licenseServer = licenseServer else {
                    throw RCTVideoError.noLicenseServerURL as! Error
                }
                return RCTVideoDRM.fetchLicense(
                    licenseServer: licenseServer,
                    spcData: spcData,
                    contentId: contentId,
                    headers: headers
                )
            }
    }
}
