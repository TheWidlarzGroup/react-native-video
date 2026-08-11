import Foundation

final class ListenerStore<Element> {
  private let lock = NSLock()
  private var elements: [Element] = []

  func append(_ element: Element) {
    lock.lock()
    defer { lock.unlock() }
    elements.append(element)
  }

  func removeAll(where shouldBeRemoved: (Element) throws -> Bool) rethrows {
    lock.lock()
    defer { lock.unlock() }
    try elements.removeAll(where: shouldBeRemoved)
  }

  func removeAll() {
    lock.lock()
    defer { lock.unlock() }
    elements.removeAll()
  }

  func snapshot() -> [Element] {
    lock.lock()
    defer { lock.unlock() }
    return elements
  }
}
