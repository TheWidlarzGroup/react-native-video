public struct AdParams {
    let adTagUrl: String?
    let adLanguage: String?

    let json: NSDictionary?

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            adTagUrl = nil
            adLanguage = nil
            return
        }
        self.json = json
        adTagUrl = json["adTagUrl"] as? String
        adLanguage = json["adLanguage"] as? String
    }
}
