public struct TextTrack {
    let type: String
    let language: String
    let title: String
    let uri: String

    let json: NSDictionary?

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.type = ""
            self.language = ""
            self.title = ""
            self.uri = ""
            return
        }
        self.json = json
        self.type = json["type"] as? String ?? ""
        self.language = json["language"] as? String ?? ""
        self.title = json["title"] as? String ?? ""
        self.uri = json["uri"] as? String ?? ""
    }
}
