import Foundation
import UIKit
// import DatazoomSDK // <-- your real SDK import

@objc(RNDatazoom)
class RNDatazoom: NSObject {
  private static var initialized = false

  @objc static func requiresMainQueueSetup() -> Bool { true } // if SDK needs main thread

  override init() {
    super.init()
    Self.initIfNeeded(options: nil)
  }

  private static func initIfNeeded(options: NSDictionary?) {
    guard !initialized else { return }
    initialized = true

    let apiKey = options?["apiKey"] as? String

    // TODO: real SDK call:
    // DatazoomSDK.start(apiKey: apiKey, endpoint: endpoint, debug: debug)

    NSLog("[RNDatazoom] Initialized: key=\(apiKey.isEmpty ? "<empty>" : "***")")
  }

  @objc(initialize:resolver:rejecter:)
  func initialize(options: NSDictionary?,
                  resolve: @escaping RCTPromiseResolveBlock,
                  reject: @escaping RCTPromiseRejectBlock) {
    RNDatazoom.initIfNeeded(options: options)
    resolve(nil)
  }
}
