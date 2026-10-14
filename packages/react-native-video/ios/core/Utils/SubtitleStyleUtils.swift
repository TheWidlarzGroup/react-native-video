import AVFoundation
import CoreMedia

enum SubtitleStyleUtils {
  /// Builds the `AVTextStyleRule` that reproduces `style`, or `nil` when every field is unset
  /// (meaning the system/embedded default styling should be left untouched).
  static func buildTextStyleRules(from style: SubtitleStyle) -> [AVTextStyleRule]? {
    var attributes: [String: Any] = [:]

    if let fontScale = style.fontScale {
      attributes[kCMTextMarkupAttribute_RelativeFontSize as String] = NSNumber(value: fontScale * 100)
    }
    if let foregroundColor = style.foregroundColor, let argb = argbComponents(from: foregroundColor) {
      attributes[kCMTextMarkupAttribute_ForegroundColorARGB as String] = argb
    }
    if let backgroundColor = style.backgroundColor, let argb = argbComponents(from: backgroundColor) {
      attributes[kCMTextMarkupAttribute_BackgroundColorARGB as String] = argb
    }
    if let edgeType = style.edgeType, let edgeStyle = characterEdgeStyle(for: edgeType) {
      attributes[kCMTextMarkupAttribute_CharacterEdgeStyle as String] = edgeStyle
    }
    // There's no additive-padding primitive on iOS, so this pins the cue's absolute vertical
    // line position instead (0% = top, 100% = bottom of the frame) - an explicit override of
    // the system's own placement, not padding around a position it still controls.
    if let bottomPadding = style.bottomPadding {
      let linePosition = max(0, min(1, 1 - bottomPadding)) * 100
      attributes[kCMTextMarkupAttribute_OrthogonalLinePositionPercentageRelativeToWritingDirection as String] =
        NSNumber(value: linePosition)
    }

    guard !attributes.isEmpty else { return nil }
    guard let rule = AVTextStyleRule(textMarkupAttributes: attributes) else { return nil }
    return [rule]
  }

  /// `windowColor`/`edgeColor` have no equivalent `kCMTextMarkupAttribute_*` key - Core Media only
  /// controls the edge *style*, not its color - so they're left Android-only, matching the docs.
  private static func characterEdgeStyle(for edgeType: SubtitleEdgeType) -> String? {
    switch edgeType {
    case .none: return kCMTextMarkupCharacterEdgeStyle_None as String
    case .outline: return kCMTextMarkupCharacterEdgeStyle_Uniform as String
    case .dropshadow: return kCMTextMarkupCharacterEdgeStyle_DropShadow as String
    case .raised: return kCMTextMarkupCharacterEdgeStyle_Raised as String
    case .depressed: return kCMTextMarkupCharacterEdgeStyle_Depressed as String
    @unknown default: return nil
    }
  }

  /// Parses `#RRGGBB` or `#AARRGGBB` (alpha-first, matching Android's `Color.parseColor`) into the
  /// `[alpha, red, green, blue]` (0.0-1.0) array the `kCMTextMarkupAttribute_*ColorARGB` keys expect.
  private static func argbComponents(from hex: String) -> [CGFloat]? {
    var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hexString.hasPrefix("#") { hexString.removeFirst() }

    guard hexString.count == 6 || hexString.count == 8 else { return nil }

    var hexValue: UInt64 = 0
    guard Scanner(string: hexString).scanHexInt64(&hexValue) else { return nil }

    let hasAlpha = hexString.count == 8
    let alpha = hasAlpha ? (hexValue >> 24) & 0xFF : 0xFF
    let red = (hexValue >> 16) & 0xFF
    let green = (hexValue >> 8) & 0xFF
    let blue = hexValue & 0xFF

    return [
      CGFloat(alpha) / 255.0,
      CGFloat(red) / 255.0,
      CGFloat(green) / 255.0,
      CGFloat(blue) / 255.0,
    ]
  }
}
