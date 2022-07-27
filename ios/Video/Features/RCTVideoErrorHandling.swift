enum RCTVideoError : Int {
    case fromJSPart
    case noLicenseServerURL
    case licenseRequestNotOk
    case noDataFromLicenseRequest
    case noSPC
    case noDataRequest
    case noCertificateData
    case noCertificateURL
    case noFairplayDRM
    case noDRMData
    case invalidContentId
}

enum RCTVideoErrorHandler {
    
    static let noDRMData = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noDRMData.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No drm object found.",
            NSLocalizedRecoverySuggestionErrorKey: "Have you specified the 'drm' prop?"
        ])
    
    static let noCertificateURL = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noCertificateURL.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM License.",
            NSLocalizedFailureReasonErrorKey: "No certificate URL has been found.",
            NSLocalizedRecoverySuggestionErrorKey: "Did you specified the prop certificateUrl?"
        ])
    
    static let noCertificateData = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noCertificateData.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No certificate data obtained from the specificied url.",
            NSLocalizedRecoverySuggestionErrorKey: "Have you specified a valid 'certificateUrl'?"
        ])
    
    static let noSPC = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noSPC.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining license.",
            NSLocalizedFailureReasonErrorKey: "No spc received.",
            NSLocalizedRecoverySuggestionErrorKey: "Check your DRM config."
        ])
    
    static let noLicenseServerURL = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noLicenseServerURL.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM License.",
            NSLocalizedFailureReasonErrorKey: "No license server URL has been found.",
            NSLocalizedRecoverySuggestionErrorKey: "Did you specified the prop licenseServer?"
        ])
    
    static let noDataFromLicenseRequest = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.noDataFromLicenseRequest.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No data received from the license server.",
            NSLocalizedRecoverySuggestionErrorKey: "Is the licenseServer ok?"
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
    
    static let invalidContentId = NSError(
        domain: "RCTVideo",
        code: RCTVideoError.invalidContentId.rawValue,
        userInfo: [
            NSLocalizedDescriptionKey: "Error obtaining DRM license.",
            NSLocalizedFailureReasonErrorKey: "No valide content Id received",
            NSLocalizedRecoverySuggestionErrorKey: "Is the contentId and url ok?"
        ])
}
