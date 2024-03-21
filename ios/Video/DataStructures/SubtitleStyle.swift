struct SubtitleStyle {
    // Extend with more style properties as needed.
    private(set) var opacity: CGFloat

    enum SubtitleStyleKeys {
        static let opacity = "opacity"
    }

    init(opacity: CGFloat = 1) {
        self.opacity = opacity
    }

    static func parse(from dictionary: [String: Any]?) -> SubtitleStyle {
        let opacity = dictionary?[SubtitleStyleKeys.opacity] as? CGFloat ?? 1
        return SubtitleStyle(opacity: opacity)
    }
}
