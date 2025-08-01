//
//  Weak.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 31/07/2025.
//

import Foundation

public class Weak<T> {
  private weak var _value: AnyObject?
  public var value: T? {
    return _value as? T
  }

  public init(value: T) {
    _value = value as AnyObject
  }
}
