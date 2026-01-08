public struct AdParams {
    let type: String?
    let adTagUrl: String?
    let adLanguage: String?
    let contentSourceId: String?
    let videoId: String?
    let assetKey: String?
    let format: String?
    let adTagParameters: [String: String]?
    let fallbackUri: String?

    let json: NSDictionary?

    var isCSAI: Bool { type == "csai" && adTagUrl != nil }
    var isDAI: Bool { type == "dai" && ((contentSourceId != nil && videoId != nil) || assetKey != nil) }
    var isDAIVod: Bool { type == "dai" && contentSourceId != nil && videoId != nil }
    var isDAILive: Bool { type == "dai" && assetKey != nil }

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            type = nil
            adTagUrl = nil
            adLanguage = nil
            contentSourceId = nil
            videoId = nil
            assetKey = nil
            format = nil
            adTagParameters = nil
            fallbackUri = nil
            return
        }
        self.json = json
        type = json["type"] as? String
        adTagUrl = json["adTagUrl"] as? String
        adLanguage = json["adLanguage"] as? String
        contentSourceId = json["contentSourceId"] as? String
        videoId = json["videoId"] as? String
        assetKey = json["assetKey"] as? String
        format = json["format"] as? String
        fallbackUri = json["fallbackUri"] as? String

        if let adTagParamsDict = json["adTagParameters"] as? [String: String] {
            adTagParameters = adTagParamsDict
        } else if let adTagParamsDict = json["adTagParameters"] as? NSDictionary {
            var params: [String: String] = [:]
            adTagParamsDict.enumerateKeysAndObjects { key, value, _ in
                if let keyString = key as? String, let valueString = value as? String {
                    params[keyString] = valueString
                }
            }
            adTagParameters = params.isEmpty ? nil : params
        } else {
            adTagParameters = nil
        }
    }
}
