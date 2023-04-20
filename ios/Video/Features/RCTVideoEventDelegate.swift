@objc protocol RCTVideoEventDelegate {
    func onVideoProgress(currentTime: NSNumber, playableDuration: NSNumber, seekableDuration: NSNumber);
    func onVideoLoad(currentTime: NSNumber, duration: NSNumber, naturalSize: NSDictionary);
    func onVideoLoadStart(isNetwork: Bool, type: NSString, uri: NSString);
    func onVideoBuffer(isBuffering: Bool);
    func onVideoError(error: NSDictionary);
    func onGetLicense(licenseUrl: NSString, contentId: NSString, spcBase64: NSString);
    func onVideoSeek(currentTime: NSNumber, seekTime: NSNumber);
    func onVideoEnd();
    func onTimedMetadata();
    func onVideoAudioBecomingNoisy();
    func onVideoFullscreenPlayerWillPresent();
    func onVideoFullscreenPlayerDidPresent();
    func onVideoFullscreenPlayerWillDismiss();
    func onVideoFullscreenPlayerDidDismiss();
    func onReadyForDisplay();
    func onRestoreUserInterfaceForPictureInPictureStop();
    func onPictureInPictureStatusChanged(isActive: Bool);
    func onPlaybackRateChange(playbackRate: NSNumber);
    func onVideoExternalPlaybackChange(isExternalPlaybackActive: Bool);
    func onReceiveAdEvent(event: NSString);
}
