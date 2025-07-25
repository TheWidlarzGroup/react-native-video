public struct AdParams {
    let adTagUrl: String?
    let adLanguage: String?
    let midRollAdTagUrl: String?
    let postRollAdTagUrl: String?
    var cuePoints: [NSNumber]?

    let json: NSDictionary?

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            adTagUrl = nil
            adLanguage = nil
            midRollAdTagUrl = nil
            postRollAdTagUrl = nil
            cuePoints = nil
            return
        }
        self.json = json
        adTagUrl = json["adTagUrl"] as? String
        adLanguage = json["adLanguage"] as? String
        midRollAdTagUrl = json["midRollAdTagUrl"] as? String
        postRollAdTagUrl = json["postRollAdTagUrl"] as? String
        cuePoints = json["cuePoints"] as? [NSNumber]
    }
}

// MARK: - Extension for helper methods
extension AdParams {
    var hasAnyAds: Bool {
        return adTagUrl != nil || midRollAdTagUrl != nil || postRollAdTagUrl != nil
    }
}
