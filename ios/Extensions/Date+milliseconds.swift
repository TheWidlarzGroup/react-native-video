//
//  Date+milliseconds.swift
//  AVDoris
//
//  Created by Yaroslav Lvov on 07.06.2023.
//

import Foundation

extension Date {
    init?(timeIntervalSince1970InMilliseconds: Double?) {
        if let timestamp = timeIntervalSince1970InMilliseconds {
            self = Date(timeIntervalSince1970: timestamp / 1000)
        } else {
            return nil
        }
    }
}
