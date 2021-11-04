struct DRMParams {
    let type: String?
    let licenseServer: String?
    let headers: Dictionary<String,Any>?
    let contentId: String?
    let certificateUrl: String?
    let base64Certificate: Bool?
    
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
            return
        }
        self.json = json
        self.type = json["type"] as? String
        self.licenseServer = json["licenseServer"] as? String
        self.contentId = json["contentId"] as? String
        self.certificateUrl = json["certificateUrl"] as? String
        self.base64Certificate = json["base64Certificate"] as? Bool
        self.headers = json["headers"] as? Dictionary<String,Any>
    }
}
