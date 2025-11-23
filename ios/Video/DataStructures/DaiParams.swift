public struct DaiParams {
    let contentSourceId: String?
    let videoId: String?
    let assetKey: String?
    let adTagParameters: [String: String]?
    let backupStreamUri: String?

    let json: NSDictionary?

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            contentSourceId = nil
            videoId = nil
            assetKey = nil
            adTagParameters = nil
            backupStreamUri = nil
            return
        }
        self.json = json
        contentSourceId = json["contentSourceId"] as? String
        videoId = json["videoId"] as? String
        assetKey = json["assetKey"] as? String
        backupStreamUri = json["backupStreamUri"] as? String

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
