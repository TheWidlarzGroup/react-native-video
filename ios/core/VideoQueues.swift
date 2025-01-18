//
//  VideoQueues.swift
//  Pods
//
//  Created by Krzysztof Moch on 16/01/2025.
//

import Foundation

public final class VideoQueues {
  public static let videoAssetQueue = DispatchQueue(label: "RNVideo/videoAssetQueue",
                                                    qos: .utility,
                                                    attributes: [],
                                                    autoreleaseFrequency: .inherit)
}
