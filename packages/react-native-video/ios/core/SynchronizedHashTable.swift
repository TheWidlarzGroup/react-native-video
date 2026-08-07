//
//  SynchronizedHashTable.swift
//  ReactNativeVideo
//

import Foundation

/// Thread-safe `NSHashTable`. `allObjects` enumerates the table internally, so calling it
/// while another thread adds, removes, or deallocates a member is a data race — players are
/// registered from the JS thread and released from whichever thread drops the last
/// reference, while the audio session is refreshed from main.
///
/// `allObjects` returns a strong-referencing snapshot and releases the lock before
/// returning, so callers iterate outside the lock. `NSLock` is not recursive — never call
/// back into this type from within it.
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
