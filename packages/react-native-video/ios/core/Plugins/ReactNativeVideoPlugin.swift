//
//  ReactNativeVideoPlugin.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 22/07/2025.
//

import Foundation
import AVFoundation

public class ReactNativeVideoPlugin {
  public func onPlayerCreated(player: Weak<NativeVideoPlayer>) { /* no-op */ }
  public func onPlayerDestroyed(player: Weak<NativeVideoPlayer>) { /* no-op */ }
  
  public func onVideoViewCreated(view: Weak<VideoComponentView>) { /* no-op */ }
  public func onVideoViewDestroyed(view: Weak<VideoComponentView>) { /* no-op */ }
  
  public func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource {
    return source
  }
}
