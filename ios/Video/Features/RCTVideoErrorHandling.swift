enum RCTVideoError : Int {
    case fromJSPart
    case licenseRequestNotOk
    case noDataFromLicenseRequest
    case noSPC
    case noDataRequest
    case noCertificateData
    case noCertificateURL
    case noFairplayDRM
    case noDRMData
}

enum RCTVideoErrorHandler {
    
    static let noDRMData: NSError = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noDRMData.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No drm object found.",
            NSLocalizedRecoverySuggestionErrorKey: "Have you specified the 'drm' prop?"
        ])
    
    static let noCertificateURL: NSError = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noCertificateURL.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM License.",
            NSLocalizedFailureReasonErrorKey: "No certificate URL has been found.",
            NSLocalizedRecoverySuggestionErrorKey: "Did you specified the prop certificateUrl?"
        ])
    
    static let noCertificateData: NSError = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noCertificateData.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No certificate data obtained from the specificied url.",
            NSLocalizedRecoverySuggestionErrorKey: "Have you specified a valid 'certificateUrl'?"
        ])
    
    static let noSPC:NSError! = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noSPC.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining license.",
            NSLocalizedFailureReasonErrorKey: "No spc received.",
            NSLocalizedRecoverySuggestionErrorKey: "Check your DRM config."
        ])
    
    static let noDataFromLicenseRequest:NSError! = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noDataFromLicenseRequest.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No data received from the license server.",
            NSLocalizedRecoverySuggestionErrorKey: "Is the licenseServer ok?."
        ])
    
    static func licenseRequestNotOk(_ statusCode: Int) -> NSError {
        return NSError(
            domain: "RCTVideo",
            code: RCTVideoError.licenseRequestNotOk.rawValue,
            userInfo: [
                NSLocalizedDescriptionKey: "Error obtaining license.",
                NSLocalizedFailureReasonErrorKey: String(
                    format:"License server responded with status code %li",
                    (statusCode)
                ),
                NSLocalizedRecoverySuggestionErrorKey: "Did you send the correct data to the license Server? Is the server ok?"
            ])
    }

    static func fromJSPart(_ error: String) -> NSError {
        return NSError(domain: "RCTVideo",
            code: RCTVideoError.fromJSPart.rawValue,
            userInfo: [
                NSLocalizedDescriptionKey: error,
                NSLocalizedFailureReasonErrorKey: error,
                NSLocalizedRecoverySuggestionErrorKey: error
            ])
    }
}
