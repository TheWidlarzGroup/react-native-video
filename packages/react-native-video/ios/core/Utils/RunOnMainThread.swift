//
//  RunOnMainThread.swift
//  ReactNativeVideo
//
//  Created by Kamil Moskała on 11/08/2026.
//

import Foundation

private func performOnMainThread<T>(
  _ action: () throws -> T,
  dispatch: () throws -> T
) rethrows -> T {
  guard !Thread.isMainThread else {
    return try action()
  }

  return try dispatch()
}

func runOnMainThread(_ action: @escaping () -> Void) {
  performOnMainThread(action) {
    DispatchQueue.main.async(execute: action)
  }
}

func runOnMainThreadSync<T>(_ action: () throws -> T) rethrows -> T {
  try performOnMainThread(action) {
    try DispatchQueue.main.sync(execute: action)
  }
}
