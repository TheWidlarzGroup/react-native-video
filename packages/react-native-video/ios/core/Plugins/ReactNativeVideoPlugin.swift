//
//  ReactNativeVideoPlugin.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 22/07/2025.
//

import Foundation
import AVFoundation

open class ReactNativeVideoPlugin {
  public init() {
    PluginsRegistry.shared.register(plugin: self)
  }
  
  deinit {
    PluginsRegistry.shared.unregister(plugin: self)
  }
  
  open func onPlayerCreated(player: Weak<NativeVideoPlayer>) { /* no-op */ }
  open func onPlayerDestroyed(player: Weak<NativeVideoPlayer>) { /* no-op */ }
  
  open func onVideoViewCreated(view: Weak<VideoComponentView>) { /* no-op */ }
  open func onVideoViewDestroyed(view: Weak<VideoComponentView>) { /* no-op */ }
  
  open func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource {
    return source
  }
}
