
struct VideoSource {
    let type: String?
    let uri: String?
    let isNetwork: Bool
    let isAsset: Bool
    let shouldCache: Bool
    let requestHeaders: Dictionary<String,Any>?
    
    let json: NSDictionary?
    
    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.type = nil
            self.uri = nil
            self.isNetwork = false
            self.isAsset = false
            self.shouldCache = false
            self.requestHeaders = nil
            return
        }
        self.json = json
        self.type = json["type"] as? String
        self.uri = json["uri"] as? String
        self.isNetwork = json["isNetwork"] as? Bool ?? false
        self.isAsset = json["isAsset"] as? Bool ?? false
        self.shouldCache = json["shouldCache"] as? Bool ?? false
        self.requestHeaders = json["requestHeaders"] as? Dictionary<String,Any>
    }
}
