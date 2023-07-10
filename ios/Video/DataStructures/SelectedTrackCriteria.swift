struct SelectedTrackCriteria {
    let type: String
    let value: Any?
    
    let json: NSDictionary?
    
    init(_ json: NSDictionary!) {
        guard json != nil else {
            self.json = nil
            self.type = ""
            self.value = nil
            return
        }
        self.json = json
        #if RCT_NEW_ARCH_ENABLED
        self.type = json["type"] as? String ?? ""
        #else
        self.type = json["selectedAudioType"] as? String ?? json["selectedTextType"] as? String ?? ""
        #endif
        self.value = json["value"]
    }
}
