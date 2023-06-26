//
//  AdTagParameters.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 09.06.2021.
//

import Foundation

struct AdTagParameters {
    var adTagParameters: [String: Any]?
    var startDate: Date?
    var endDate: Date?
}

extension AdTagParameters {
    init(payload: NSDictionary) {
        if let adTagParametersPayload = payload.value(forKey: "adTagParameters") as? [String: Any] {
            adTagParameters = adTagParametersPayload
        }
        
        if let startDateInterval = payload.value(forKey: "startDate") as? Double {
            startDate = Date(timeIntervalSince1970: startDateInterval)
        }
        
        if let endDateInterval = payload.value(forKey: "endDate") as? Double {
            endDate = Date(timeIntervalSince1970: endDateInterval)
        }
    }
}
