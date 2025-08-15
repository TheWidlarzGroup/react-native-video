//
//  ReactNativeVideoPlugin.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 22/07/2025.
//

import AVFoundation
import Foundation

public protocol ReactNativeVideoPluginSpec {
  /**
   * The ID of the plugin.
   */
  var id: String { get }

  /**
   * The name of the plugin.
   */
  var name: String { get }

  /**
   * Called when a player is created.
   *
   * @param player The weak reference to the player instance.
   */
  func onPlayerCreated(player: Weak<NativeVideoPlayer>)

  /**
   * Called when a player is destroyed.
   *
   * @param player The weak reference to the player instance.
   */
  func onPlayerDestroyed(player: Weak<NativeVideoPlayer>)

  /**
   * Called when a video view is created.
   *
   * @param view The weak reference to the video view instance.
   */
  func onVideoViewCreated(view: Weak<VideoComponentView>)

  /**
   * Called when a video view is destroyed.
   *
   * @param view The weak reference to the video view instance.
   */
  func onVideoViewDestroyed(view: Weak<VideoComponentView>)

  /**
   * Called when a source is overridden.
   *
   * @param source The source instance.
   * @return The overridden source instance.
   */
  func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource

  /**
   * Called when a DRM manager is requested.
   *
   * @param source The source instance.
   * @return The DRM manager instance.
   */
  func getDRMManager(source: NativeVideoPlayerSource) -> DRMManagerSpec?
}

open class ReactNativeVideoPlugin: ReactNativeVideoPluginSpec {
  public let id: String
  public let name: String

  public init(name: String) {
    self.name = name
    self.id = "RNV_Plugin_\(name)"

    PluginsRegistry.shared.register(plugin: self)
  }

  open func onPlayerCreated(player: Weak<NativeVideoPlayer>) { /* no-op */  }
  open func onPlayerDestroyed(player: Weak<NativeVideoPlayer>) { /* no-op */  }

  open func onVideoViewCreated(view: Weak<VideoComponentView>) { /* no-op */  }
  open func onVideoViewDestroyed(view: Weak<VideoComponentView>) { /* no-op */  }

  open func overrideSource(source: NativeVideoPlayerSource) async -> NativeVideoPlayerSource {
    return source
  }

  open func getDRMManager(source: NativeVideoPlayerSource) -> DRMManagerSpec? {
    return nil
  }
}
