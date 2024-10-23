struct SelectedTrackCriteria {
    let type: String
    let value: String?

    let json: NSDictionary?

    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.type = ""
            self.value = nil
            return
        }
        self.json = json
        self.type = json["type"] as? String ?? ""
        self.value = json["value"] as? String
    }

    static func none() -> SelectedTrackCriteria {
        return SelectedTrackCriteria(["type": "none", "value": ""])
    }
}
