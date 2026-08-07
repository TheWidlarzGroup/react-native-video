//
//  SynchronizedHashTable.swift
//  ReactNativeVideo
//

import Foundation

/// Thread-safe `NSHashTable`. Registries are written from the JS thread and read from main,
/// and `allObjects` enumerates internally — unguarded that is a data race. The snapshot it
/// returns holds strong refs, and the lock is dropped before returning; `NSLock` is not recursive.
final class SynchronizedHashTable<T: AnyObject> {
  private let lock = NSLock()
  private let hashTable: NSHashTable<T>

  init(weakObjects: Bool = false) {
    hashTable = weakObjects ? NSHashTable<T>.weakObjects() : NSHashTable<T>()
  }

  var allObjects: [T] {
    lock.lock()
    defer { lock.unlock() }
    return Array(hashTable.allObjects)
  }

  func add(_ object: T) {
    lock.lock()
    defer { lock.unlock() }
    hashTable.add(object)
  }

  func remove(_ object: T) {
    lock.lock()
    defer { lock.unlock() }
    hashTable.remove(object)
  }

  func contains(_ object: T?) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    return hashTable.contains(object)
  }

  func removeAllObjects() {
    lock.lock()
    defer { lock.unlock() }
    hashTable.removeAllObjects()
  }
}
