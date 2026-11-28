//
//  AppDelegate.swift
//  VideoExample
//
//  Created by Krzysztof Moch on 31/01/2025.
//


import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "VideoExample"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    // The window is created per scene in SceneDelegate. iOS 27 stops apps that create their
    // window here without adopting the scene lifecycle.
    self.automaticallyLoadReactNativeWindow = false

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

/// Creates the React Native window for the app's scene (Info.plist: UIApplicationSceneManifest).
/// Does what RCTAppDelegate's loadReactNativeWindow does in React Native 0.77, but attached to a
/// UIWindowScene.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let moduleName = appDelegate.moduleName
    else { return }

    let rootView = appDelegate.rootViewFactory.view(
      withModuleName: moduleName,
      initialProperties: appDelegate.initialProps,
      launchOptions: nil
    )
    let rootViewController = appDelegate.createRootViewController()
    appDelegate.setRootView(rootView, toRootViewController: rootViewController)

    let window = UIWindow(windowScene: windowScene)
    window.rootViewController = rootViewController
    appDelegate.window = window
    self.window = window
    window.makeKeyAndVisible()
  }

  // RCTAppDelegate does this when it is the scene's delegate; Dimensions depend on it.
  func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    NotificationCenter.default.post(
      name: NSNotification.Name("RCTWindowFrameDidChangeNotification"),
      object: UIApplication.shared.delegate
    )
  }
}
