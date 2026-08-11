//
//  RunOnMainThread.swift
//  ReactNativeVideo
//
//  Created by Kamil Moskała on 11/08/2026.
//

import Foundation

func runOnMainThread(_ action: @escaping () -> Void) {
  guard !Thread.isMainThread else {
    action()
    return
  }

  DispatchQueue.main.async(execute: action)
}

func runOnMainThreadSync<T>(_ action: () throws -> T) rethrows -> T {
  if Thread.isMainThread {
    return try action()
  }

  return try DispatchQueue.main.sync(execute: action)
}
