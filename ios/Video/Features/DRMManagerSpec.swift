import AVFoundation

public protocol DRMManagerSpec: NSObject, AVContentKeySessionDelegate {
    func createContentKeyRequest(
        asset: AVContentKeyRecipient,
        drmParams: DRMParams?,
        reactTag: NSNumber?,
        onVideoError: RCTDirectEventBlock?,
        onGetLicense: RCTDirectEventBlock?
    )

    func handleContentKeyRequest(keyRequest: AVContentKeyRequest)
    func finishProcessingContentKeyRequest(keyRequest: AVContentKeyRequest, license: Data) throws
    func handleError(_ error: Error, for keyRequest: AVContentKeyRequest)
    func setJSLicenseResult(license: String, licenseUrl: String)
    func setJSLicenseError(error: String, licenseUrl: String)
}
