struct DRMParams {
    let type: String?
    let licenseServer: String?
    let headers: Dictionary<String,Any>?
    let contentId: String?
    let certificateUrl: String?
    let base64Certificate: Bool?
    let useExternalGetLicense: Bool?
    
    let json: NSDictionary?
    
    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.type = nil
            self.licenseServer = nil
            self.contentId = nil
            self.certificateUrl = nil
            self.base64Certificate = nil
            self.headers = nil
            self.useExternalGetLicense = nil
            return
        }
        
        
        self.json = json
        self.type = json["drmType"] as? String
        self.licenseServer = json["licenseServer"] as? String
        self.contentId = json["contentId"] as? String
        self.certificateUrl = json["certificateUrl"] as? String
        self.base64Certificate = json["base64Certificate"] as? Bool
        self.useExternalGetLicense = json["useExternalGetLicense"] as? Bool
        
        if let headersArray = json["headers"] as? NSArray {
            var headersDictionary: [String: Any] = [:]
            for dict in headersArray {
                if let dictionary = dict as? NSDictionary,
                    let key = dictionary["key"] as? String,
                    let value = dictionary["value"] {
                    headersDictionary[key] = value
                }
            }
            self.headers = headersDictionary
        } else {
            self.headers = nil
        }
    }
}
