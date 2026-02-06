//
//  AVMetadataItem+make.swift
//  ReactNativeVideo
//
//  Created by Kamil Moskała on 06/02/2026.
//

import AVFoundation

extension AVMetadataItem {
  static func make(identifier: AVMetadataIdentifier, value: NSObjectProtocol & NSCopying) -> AVMutableMetadataItem {
    let item = AVMutableMetadataItem()
    item.identifier = identifier
    item.value = value
    item.extendedLanguageTag = "und"
    return item
  }
}
