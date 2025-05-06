public struct CustomMetadata {
    let title: String?
    let subtitle: String?
    let artist: String?
    let description: String?
    let imageUri: String?

    let json: NSDictionary?

    init(_ json: NSDictionary?) {
        guard let json else {
            self.json = nil
            title = nil
            subtitle = nil
            artist = nil
            description = nil
            imageUri = nil
            return
        }

        self.json = json
        title = json["title"] as? String ?? ""
        subtitle = json["subtitle"] as? String ?? ""
        artist = json["artist"] as? String ?? ""
        description = json["description"] as? String ?? ""
        imageUri = json["imageUri"] as? String ?? ""
    }
}
