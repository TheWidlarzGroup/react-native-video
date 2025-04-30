//
//  NSObject+PerformIfResponds.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 27/04/2025.
//

import Foundation

extension NSObject {
  // Safe perform methods for Objective-C selectors
  
  func performIfResponds(_ selector: Selector) {
    if self.responds(to: selector) {
      self.perform(selector)
    }
  }
  
  func performIfResponds(_ selector: Selector, with object: Any?) {
    if self.responds(to: selector) {
      self.perform(selector, with: object)
    }
  }
  
  func performIfResponds(_ selector: Selector, with object1: Any?, with object2: Any?) {
    if self.responds(to: selector) {
      self.perform(selector, with: object1, with: object2)
    }
  }
}
