
struct VideoSource {
    let type: String?
    let uri: String?
    let isNetwork: Bool
    let isAsset: Bool
    let shouldCache: Bool
    let requestHeaders: Dictionary<String,Any>?
    let startTime: Int64?
    let endTime: Int64?
    let json: NSDictionary?
    let asset: Asset
    
    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.type = nil
            self.uri = nil
            self.isNetwork = false
            self.isAsset = false
            self.shouldCache = false
            self.requestHeaders = nil
            self.startTime = nil
            self.endTime = nil
            self.asset = nil
            return
        }
        self.json = json
        self.type = json["type"] as? String
        self.uri = json["uri"] as? String
        self.isNetwork = json["isNetwork"] as? Bool ?? false
        self.isAsset = json["isAsset"] as? Bool ?? false
        self.shouldCache = true
        self.requestHeaders = json["requestHeaders"] as? Dictionary<String,Any>
        self.startTime = json["startTime"] as? Int64
        self.endTime = json["endTime"] as? Int64
        let stream = Stream(name: self.uri, playlistURL: self.uri)
        self.asset = Asset(stream: stream, urlAsset: AVURLAsset(url: URL(string: self.uri!)!))
    }
}
