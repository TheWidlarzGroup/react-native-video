struct Chapter {
    let title: String
    let uri: String?
    let startTime: Double
    let endTime: Double

    let json: NSDictionary?

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.title = ""
            self.uri = nil
            self.startTime = 0
            self.endTime = 0
            return
        }
        self.json = json
        self.title = json["title"] as? String ?? ""
        self.uri = json["uri"] as? String
        self.startTime = json["startTime"] as? Double ?? 0
        self.endTime = json["endTime"] as? Double ?? 0
    }
}
