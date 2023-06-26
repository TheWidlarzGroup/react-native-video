//
//  Buttons.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 05.03.2021.
//

import Foundation

//MARK: Differs
struct Buttons: SuperCodable {
    //tvOS only
    let watchlist: Bool?
    let epg: Bool?
    let annotations: Bool?
    //both
    let stats: Bool
    let favourite: Bool
    let info: Bool?
    //ios only
    let fullscreen: Bool?
    let zoom: Bool?//ios
    let back: Bool?//ios
    let settings: Bool?//ios
}
