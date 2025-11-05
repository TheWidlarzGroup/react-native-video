import Foundation

@objc
public class PublicAudioSessionManager: NSObject {
    @objc
    public static func setIsAudioSessionManagementDisabled(_ disabled: Bool) {
        AudioSessionManager.shared.setIsAudioSessionManagementForcedDisabled(disabled: disabled)
    }
}
