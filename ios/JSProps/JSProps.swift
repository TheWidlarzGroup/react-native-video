//
//  JSProps.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 11.03.2022.
//

import Foundation

class JSProps {
    var partialVideoInformation: Dynamic<PartialVideoInformation?> = Dynamic(nil)
    var translations: Dynamic<Translations?> = Dynamic(nil)
    var buttons: Dynamic<Buttons?> = Dynamic(nil)
    var theme: Dynamic<Theme?> = Dynamic(nil)
    var relatedVideos: Dynamic<RelatedVideos?> = Dynamic(nil)
    var metadata: Dynamic<Metadata?> = Dynamic(nil)
    var overlayConfig: Dynamic<OverlayConfig?> = Dynamic(nil)
    //should be part of source
    var startAt: Dynamic<Double?> = Dynamic(nil)
    var source: Dynamic<Source?> = Dynamic(nil)
    var controls: Dynamic<Bool> = Dynamic(false)
    var isFavourite: Dynamic<Bool> = Dynamic(false)
    var nowPlaying: Dynamic<JSNowPlaying?> = Dynamic(nil)
}

class Dynamic<T> {
    typealias Listener = (T) -> Void
    var listener: Listener?
    var value: T { didSet { listener?(value) } }
    
    init(_ v: T) {
        value = v
    }
    
    func bind(listener: Listener?) {
        self.listener = listener
    }
    
    func bindAndFire(listener: Listener?) {
        self.listener = listener
        listener?(value)
    }
}
