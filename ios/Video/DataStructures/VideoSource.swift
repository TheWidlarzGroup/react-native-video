struct VideoSource {
    let type: String?
    let uri: String?
    let isNetwork: Bool
    let isAsset: Bool
    let shouldCache: Bool
    let requestHeaders: [String: Any]?
    let startPosition: Int64?
    let cropStart: Int64?
    let cropEnd: Int64?
    // Custom Metadata
    let title: String?
    let subtitle: String?
    let description: String?
    let customImageUri: String?

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
            self.startPosition = nil
            self.cropStart = nil
            self.cropEnd = nil
            self.title = nil
            self.subtitle = nil
            self.description = nil
            self.customImageUri = nil
            return
        }
        self.json = json
        self.type = json["type"] as? String
        self.uri = json["uri"] as? String
        self.isNetwork = json["isNetwork"] as? Bool ?? false
        self.isAsset = json["isAsset"] as? Bool ?? false
        self.shouldCache = json["shouldCache"] as? Bool ?? false
        self.requestHeaders = json["requestHeaders"] as? [String: Any]
        self.startPosition = json["startPosition"] as? Int64
        self.cropStart = json["cropStart"] as? Int64
        self.cropEnd = json["cropEnd"] as? Int64
        self.title = json["title"] as? String
        self.subtitle = json["subtitle"] as? String
        self.description = json["description"] as? String
        self.customImageUri = json["customImageUri"] as? String
    }
}
