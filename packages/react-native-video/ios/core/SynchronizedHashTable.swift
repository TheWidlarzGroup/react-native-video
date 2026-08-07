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

  /// Removes `object` and reports whether it was present and whether this removal emptied the table.
  /// Callers that tear down on emptiness must use this rather than a second `allObjects` read,
  /// otherwise concurrent removals can both observe an empty table and both tear down.
  func removeReportingEmpty(_ object: T) -> (wasPresent: Bool, isEmpty: Bool) {
    lock.lock()
    defer { lock.unlock() }
    let wasPresent = hashTable.contains(object)
    hashTable.remove(object)
    // `count` includes zeroed-out weak entries; `anyObject` (like `allObjects`) does not, and
    // unlike `allObjects` it doesn't materialize every remaining strong reference under the lock.
    return (wasPresent, hashTable.anyObject == nil)
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
