//
//  String+Extentions.swift
//  RNDReactNativeDiceVideo
//
//  Created by Lukasz on 11/04/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
extension String {
    func fromBase64() -> String
    {
        let data = Data(base64Encoded: self, options: NSData.Base64DecodingOptions(rawValue: 0))
        return String(data: data!, encoding: String.Encoding.utf8)!
    }
    
    func toBase64() -> String
    {
        let data = self.data(using: String.Encoding.utf8)
        return data!.base64EncodedString(options: NSData.Base64EncodingOptions(rawValue: 0))
    }
    
    func jsonDictionary() -> NSDictionary? {
        guard let data = self.data(using: .utf8) else {
            return nil
        }
        do {
            let object = try JSONSerialization.jsonObject(with: data, options: JSONSerialization.ReadingOptions.mutableContainers)
            if let dict = object as? NSDictionary {
                return dict
            }
        } catch {
            return nil
        }
        return nil
    }
    
    func safeForLogger() -> String {
        return self.replacingOccurrences(of: "%", with: "‰")
    }
}
