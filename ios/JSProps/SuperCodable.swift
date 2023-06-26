//
//  SuperCodable.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 05.03.2021.
//

import Foundation

protocol SuperCodable: Codable {
    init(dict: NSDictionary?) throws
}

extension SuperCodable {
    init(dict: NSDictionary?) throws {
        do {
            let myData: Data = try JSONSerialization.data(withJSONObject: dict ?? [:], options: .fragmentsAllowed)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            self = try decoder.decode(Self.self, from: myData)
        } catch {
            print(error)
            throw error
        }
    }
}
