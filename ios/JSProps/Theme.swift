//
//  Theme.swift
//  RNDReactNativeDiceVideo
//
//  Created by Yaroslav Lvov on 05.03.2021.
//

import Foundation

struct Theme: SuperCodable {
    let fonts: Fonts
    let colors: Colors
}

extension Theme {
    //MARK: Differs
    struct Fonts: SuperCodable {
        let secondary: String
        let primary: String
    }
    
    //MARK: Differs
    struct Colors: SuperCodable {
        let secondary: String
        let primary: String
    }
}
