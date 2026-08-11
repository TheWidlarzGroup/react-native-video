//
//  SourceLoader.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 27/01/2025.
//

import Foundation

private final class CurrentOperation: @unchecked Sendable {
  private let cancelOperation: () -> Void

  init(cancel: @escaping () -> Void) {
    cancelOperation = cancel
  }

  func cancel() {
    cancelOperation()
  }
}

final class SourceLoader {
  final class Token: @unchecked Sendable {}

  private enum State {
    case open(token: Token?, operation: CurrentOperation?)
    case closed
  }

  private let lock = NSLock()
  private var state: State = .open(token: nil, operation: nil)

  func begin(
    if shouldBegin: () -> Bool = { true },
    onBegin: () -> Void = {}
  ) throws -> Token? {
    let token: Token
    let previousOperation: CurrentOperation?

    lock.lock()
    switch state {
    case .closed:
      lock.unlock()
      throw CancellationError()
    case .open(_, let operation):
      guard shouldBegin() else {
        lock.unlock()
        return nil
      }
      token = Token()
      previousOperation = operation
      state = .open(token: token, operation: nil)
      onBegin()
      lock.unlock()
    }

    previousOperation?.cancel()
    return token
  }

  func withState<T>(_ operation: () throws -> T) rethrows -> T {
    lock.lock()
    defer { lock.unlock() }
    return try operation()
  }

  func isCurrent(_ token: Token) -> Bool {
    withState {
      guard case .open(let current, _) = state else { return false }
      return current === token
    }
  }

  var isClosed: Bool {
    withState {
      if case .closed = state { return true }
      return false
    }
  }

  func commit<T>(_ token: Token, update: () throws -> T) throws -> T {
    try withState {
      guard case .open(let current, _) = state, current === token else {
        throw CancellationError()
      }
      return try update()
    }
  }

  @discardableResult
  func cancel<T>(
    _ token: Token? = nil,
    update: () -> T
  ) -> T? {
    let operation: CurrentOperation?
    let result: T

    lock.lock()
    guard case .open(let current, let currentOperation) = state,
          token == nil || current === token else {
      lock.unlock()
      return nil
    }
    operation = currentOperation
    state = .open(token: nil, operation: nil)
    result = update()
    lock.unlock()

    operation?.cancel()
    return result
  }

  @discardableResult
  func close<T>(update: () -> T) -> T? {
    let operation: CurrentOperation?
    let result: T

    lock.lock()
    guard case .open(_, let currentOperation) = state else {
      lock.unlock()
      return nil
    }
    operation = currentOperation
    state = .closed
    result = update()
    lock.unlock()

    operation?.cancel()
    return result
  }

  func load<T>(
    token: Token,
    isCurrent: @escaping () -> Bool = { true },
    priority: TaskPriority = .userInitiated,
    operation: @escaping () async throws -> T
  ) async throws -> T {
    guard isCurrent() else { throw CancellationError() }

    let task = Task(priority: priority) {
      try await operation()
    }
    let currentOperation = CurrentOperation {
      task.cancel()
    }

    let previousOperation: CurrentOperation?
    lock.lock()
    guard case .open(let current, let previous) = state, current === token else {
      lock.unlock()
      task.cancel()
      throw CancellationError()
    }
    previousOperation = previous
    state = .open(token: token, operation: currentOperation)
    lock.unlock()
    previousOperation?.cancel()

    return try await withTaskCancellationHandler {
      do {
        let result = try await task.value
        try Task.checkCancellation()
        guard isCurrent() else { throw CancellationError() }
        try finish(currentOperation)
        return result
      } catch {
        clear(currentOperation)
        throw error
      }
    } onCancel: {
      self.cancel(currentOperation)
    }
  }

  private func finish(_ operation: CurrentOperation) throws {
    lock.lock()
    defer { lock.unlock() }
    guard case .open(let token, let current) = state,
          current === operation else {
      throw CancellationError()
    }
    state = .open(token: token, operation: nil)
  }

  private func clear(_ operation: CurrentOperation) {
    lock.lock()
    defer { lock.unlock() }
    guard case .open(let token, let current) = state,
          current === operation else { return }
    state = .open(token: token, operation: nil)
  }

  private func cancel(_ operation: CurrentOperation) {
    lock.lock()
    guard case .open(_, let current) = state,
          current === operation else {
      lock.unlock()
      return
    }
    state = .open(token: nil, operation: nil)
    lock.unlock()
    operation.cancel()
  }
}
