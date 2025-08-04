//
//  Weak.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 31/07/2025.
//

import Foundation

/// A generic class for managing weak references to objects.
///
/// The `Weak<T>` class is designed to hold a weak reference to an object of type `T`.
/// This is particularly useful in scenarios where strong references could lead to retain cycles
/// or memory leaks, such as in plugin systems or delegate patterns.
///
/// - Note: The `value` property provides access to the referenced object, or `nil` if the object has been deallocated.
public class Weak<T> {
  private weak var _value: AnyObject?
  public var value: T? {
    return _value as? T
  }

  public init(value: T) {
    _value = value as AnyObject
  }
}
