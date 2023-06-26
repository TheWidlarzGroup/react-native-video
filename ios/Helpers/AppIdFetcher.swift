//
//  AppIdFetcher.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 02.12.2020.
//

import Foundation

class AppIdFetcher {
    static let shared = AppIdFetcher()
    private var appID: Int?
    
    func fetchAppId(completion: @escaping (String?) -> Void) {
        completion(Bundle.main.bundleIdentifier)
    }
}
