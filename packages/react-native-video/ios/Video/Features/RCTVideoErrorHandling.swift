import Foundation

// MARK: - RCTVideoError

enum RCTVideoError: Error, Hashable {
    case fromJSPart(String)
    case noLicenseServerURL
    case licenseRequestFailed(Int)
    case noDataFromLicenseRequest
    case noSPC
    case noCertificateData
    case noCertificateURL
    case noDRMData
    case invalidContentId
    case invalidAppCert
    case keyRequestCreationFailed
    case persistableKeyRequestFailed
    case embeddedKeyExtractionFailed
    case offlineDRMNotSupported
    case unsupportedDRMType
    case simulatorDRMNotSupported

    var errorCode: Int {
        switch self {
        case .fromJSPart:
            return 1000
        case .noLicenseServerURL:
            return 1001
        case .licenseRequestFailed:
            return 1002
        case .noDataFromLicenseRequest:
            return 1003
        case .noSPC:
            return 1004
        case .noCertificateData:
            return 1005
        case .noCertificateURL:
            return 1006
        case .noDRMData:
            return 1007
        case .invalidContentId:
            return 1008
        case .invalidAppCert:
            return 1009
        case .keyRequestCreationFailed:
            return 1010
        case .persistableKeyRequestFailed:
            return 1011
        case .embeddedKeyExtractionFailed:
            return 1012
        case .offlineDRMNotSupported:
            return 1013
        case .unsupportedDRMType:
            return 1014
        case .simulatorDRMNotSupported:
            return 1015
        }
    }
}

// MARK: LocalizedError

extension RCTVideoError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case let .fromJSPart(error):
            return NSLocalizedString("Error from JavaScript: \(error)", comment: "")
        case .noLicenseServerURL:
            return NSLocalizedString("No license server URL provided", comment: "")
        case let .licenseRequestFailed(statusCode):
            return NSLocalizedString("License request failed with status code: \(statusCode)", comment: "")
        case .noDataFromLicenseRequest:
            return NSLocalizedString("No data received from license server", comment: "")
        case .noSPC:
            return NSLocalizedString("Failed to create Server Playback Context (SPC)", comment: "")
        case .noCertificateData:
            return NSLocalizedString("No certificate data obtained", comment: "")
        case .noCertificateURL:
            return NSLocalizedString("No certificate URL provided", comment: "")
        case .noDRMData:
            return NSLocalizedString("No DRM data available", comment: "")
        case .invalidContentId:
            return NSLocalizedString("Invalid content ID", comment: "")
        case .invalidAppCert:
            return NSLocalizedString("Invalid application certificate", comment: "")
        case .keyRequestCreationFailed:
            return NSLocalizedString("Failed to create content key request", comment: "")
        case .persistableKeyRequestFailed:
            return NSLocalizedString("Failed to create persistable content key request", comment: "")
        case .embeddedKeyExtractionFailed:
            return NSLocalizedString("Failed to extract embedded key", comment: "")
        case .offlineDRMNotSupported:
            return NSLocalizedString("Offline DRM is not supported, see https://github.com/TheWidlarzGroup/react-native-video/issues/3539", comment: "")
        case .unsupportedDRMType:
            return NSLocalizedString("Unsupported DRM type", comment: "")
        case .simulatorDRMNotSupported:
            return NSLocalizedString("DRM on simulators is not supported", comment: "")
        }
    }

    var failureReason: String? {
        switch self {
        case .fromJSPart:
            return NSLocalizedString("An error occurred in the JavaScript part of the application.", comment: "")
        case .noLicenseServerURL:
            return NSLocalizedString("The license server URL is missing in the DRM configuration.", comment: "")
        case .licenseRequestFailed:
            return NSLocalizedString("The license server responded with an error status code.", comment: "")
        case .noDataFromLicenseRequest:
            return NSLocalizedString("The license server did not return any data.", comment: "")
        case .noSPC:
            return NSLocalizedString("Failed to generate the Server Playback Context (SPC) for the content.", comment: "")
        case .noCertificateData:
            return NSLocalizedString("Unable to retrieve certificate data from the specified URL.", comment: "")
        case .noCertificateURL:
            return NSLocalizedString("The certificate URL is missing in the DRM configuration.", comment: "")
        case .noDRMData:
            return NSLocalizedString("The required DRM data is not available or is invalid.", comment: "")
        case .invalidContentId:
            return NSLocalizedString("The content ID provided is not valid or recognized.", comment: "")
        case .invalidAppCert:
            return NSLocalizedString("The application certificate is invalid or not recognized.", comment: "")
        case .keyRequestCreationFailed:
            return NSLocalizedString("Unable to create a content key request for DRM.", comment: "")
        case .persistableKeyRequestFailed:
            return NSLocalizedString("Failed to create a persistable content key request for offline playback.", comment: "")
        case .embeddedKeyExtractionFailed:
            return NSLocalizedString("Unable to extract the embedded key from the custom scheme URL.", comment: "")
        case .offlineDRMNotSupported:
            return NSLocalizedString("You tried to use Offline DRM but it is not supported yet", comment: "")
        case .unsupportedDRMType:
            return NSLocalizedString("You tried to use unsupported DRM type", comment: "")
        case .simulatorDRMNotSupported:
            return NSLocalizedString("You tried to DRM on a simulator", comment: "")
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .fromJSPart:
            return NSLocalizedString("Check the JavaScript logs for more details and fix any issues in the JS code.", comment: "")
        case .noLicenseServerURL:
            return NSLocalizedString("Ensure that you have specified the 'licenseServer' property in the DRM configuration.", comment: "")
        case .licenseRequestFailed:
            return NSLocalizedString("Verify that the license server is functioning correctly and that you're sending the correct data.", comment: "")
        case .noDataFromLicenseRequest:
            return NSLocalizedString("Check if the license server is operational and responding with the expected data.", comment: "")
        case .noSPC:
            return NSLocalizedString("Verify that the content key request is properly configured and that the DRM setup is correct.", comment: "")
        case .noCertificateData:
            return NSLocalizedString("Check if the certificate URL is correct and accessible, and that it returns valid certificate data.", comment: "")
        case .noCertificateURL:
            return NSLocalizedString("Make sure you have specified the 'certificateUrl' property in the DRM configuration.", comment: "")
        case .noDRMData:
            return NSLocalizedString("Ensure that you have provided all necessary DRM-related data in the configuration.", comment: "")
        case .invalidContentId:
            return NSLocalizedString("Verify that the content ID is correct and matches the expected format for your DRM system.", comment: "")
        case .invalidAppCert:
            return NSLocalizedString("Check if the application certificate is valid and properly formatted for your DRM system.", comment: "")
        case .keyRequestCreationFailed:
            return NSLocalizedString("Review your DRM configuration and ensure all required parameters are correctly set.", comment: "")
        case .persistableKeyRequestFailed:
            return NSLocalizedString("Verify that offline playback is supported and properly configured for your content.", comment: "")
        case .embeddedKeyExtractionFailed:
            return NSLocalizedString("Check if the embedded key is present in the URL and the custom scheme is correctly implemented.", comment: "")
        case .offlineDRMNotSupported:
            return NSLocalizedString("Check if localSourceEncryptionKeyScheme is set", comment: "")
        case .unsupportedDRMType:
            return NSLocalizedString("Verify that you are using fairplay (on Apple devices)", comment: "")
        case .simulatorDRMNotSupported:
            return NSLocalizedString("You need to test DRM content on real device", comment: "")
        }
    }
}

// MARK: - RCTVideoErrorHandler

enum RCTVideoErrorHandler {
    static func createError(from error: RCTVideoError) -> [String: Any] {
        return [
            "code": error.errorCode,
            "localizedDescription": error.localizedDescription,
            "localizedFailureReason": error.failureReason ?? "",
            "localizedRecoverySuggestion": error.recoverySuggestion ?? "",
            "domain": "RCTVideo",
        ]
    }
}
