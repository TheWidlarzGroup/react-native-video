import Foundation
import UIKit
#if USE_DZ_ADAPTERS
    import DzAVPlayerAdapter
    import DzBase
#endif

@objc(RNDatazoom)
class RNDatazoom: NSObject {
  private static var initialized = false

  @objc static func requiresMainQueueSetup() -> Bool { true } // if SDK needs main thread

  override init() {
    super.init()
  }

#if USE_DZ_ADAPTERS
  private static func initIfNeeded(options: NSDictionary?) {
    guard !initialized else { return }
    initialized = true

    let configId = options?["apiKey"] as? String
    
    guard let configId = configId, !configId.isEmpty else {
      print("Initializing Datazoom failed due to no configid provided")
     return
    }
    
    let isProduction = true
    
    debugPrint("🎯 Initializing Datazoom with settings:")
    debugPrint("   - configId: \(configId)")
    debugPrint("   - isProduction: \(isProduction)")
    
    let configBuilder = Config.Builder(configurationId: configId)
    configBuilder.logLevel(logLevel: LogLevel.verbose)
    configBuilder.isProduction(isProduction: isProduction)
    
    Datazoom.shared.doInit(config: configBuilder.build())
    
    Datazoom.shared.sdkEvents.watch { event in
      guard let eventDescription = event?.description as? String else { return }
      if eventDescription.contains("SdkInit") {
        debugPrint("✅ DZ initialized successfully with settings")
      }
    }
  }
#endif

  @objc(initialize:resolver:rejecter:)
  func initialize(options: NSDictionary?,
                  resolve: @escaping RCTPromiseResolveBlock,
                  reject: @escaping RCTPromiseRejectBlock) {
#if USE_DZ_ADAPTERS
    RNDatazoom.initIfNeeded(options: options)
#endif
    resolve(nil)
  }
}
