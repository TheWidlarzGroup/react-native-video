//
//  AdTagParametersModifier.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 08.03.2021.
//

import Foundation
import AppTrackingTransparency

struct AdTagParametersModifierInfo {
    let viewWidth: CGFloat
    let viewHeight: CGFloat
}

class AdTagParametersModifier {
    func prepareAdTagParameters(adTagParameters: [String : Any]?, info: AdTagParametersModifierInfo, completion: @escaping ([String : Any]?) -> Void) {
        var newAdTagParameters = adTagParameters
        
        AppIdFetcher.shared.fetchAppId { appID in
            newAdTagParameters?.updateValue(appID ?? "", forKey: "msid")
            
            if #available(tvOS 14, *) {
                ATTrackingManager.requestTrackingAuthorization { status in
                    DispatchQueue.main.async {
                        if var customParams = newAdTagParameters?["cust_params"] as? String {
                            customParams.append("&pw=\(Int(info.viewWidth))")
                            customParams.append("&ph=\(Int(info.viewHeight))")
                            
                            newAdTagParameters?.updateValue(customParams, forKey: "cust_params")
                        }
                        
                        newAdTagParameters?.updateValue("\(status == .authorized ? 1 : 0)", forKey: "is_lat")
                        completion(newAdTagParameters)
                    }
                }
            } else {
                DispatchQueue.main.async {
                    if var customParams = newAdTagParameters?["cust_params"] as? String {
                        customParams.append("&pw=\(info.viewWidth)")
                        customParams.append("&ph=\(info.viewHeight)")
                        
                        newAdTagParameters?.updateValue(customParams, forKey: "cust_params")
                    }
                    
                    newAdTagParameters?.updateValue("\(0)", forKey: "is_lat")
                    completion(newAdTagParameters)
                }
            }
        }
    }
}
