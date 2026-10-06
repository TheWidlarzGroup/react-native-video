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

  private struct Request {
    let token: Token
    let operation: CurrentOperation?
  }

  private enum State {
    case open(Request?)
    case closed
  }

  private let lock = NSLock()
  private var state: State = .open(nil)

  func begin(
    if shouldBegin: () -> Bool = { true },
    onBegin: () -> Void = {}
  ) throws -> Token? {
    let request: (token: Token, previousOperation: CurrentOperation?)? = try withState {
      guard case .open(let currentRequest) = state else {
        throw CancellationError()
      }
      guard shouldBegin() else {
        return nil
      }

      let token = Token()
      state = .open(Request(token: token, operation: nil))
      onBegin()
      return (token, currentRequest?.operation)
    }

    request?.previousOperation?.cancel()
    return request?.token
  }

  func withState<T>(_ operation: () throws -> T) rethrows -> T {
    lock.lock()
    defer { lock.unlock() }
    return try operation()
  }

  func isCurrent(_ token: Token) -> Bool {
    withState {
      guard case .open(let request) = state else { return false }
      return request?.token === token
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
      guard case .open(let request) = state, request?.token === token else {
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
    let cancellation: (result: T, operation: CurrentOperation?)? = withState {
      guard case .open(let request) = state,
            token == nil || request?.token === token else {
        return nil
      }

      state = .open(nil)
      return (update(), request?.operation)
    }

    cancellation?.operation?.cancel()
    return cancellation?.result
  }

  @discardableResult
  func close<T>(update: () -> T) -> T? {
    let cancellation: (result: T, operation: CurrentOperation?)? = withState {
      guard case .open(let request) = state else { return nil }

      state = .closed
      return (update(), request?.operation)
    }

    cancellation?.operation?.cancel()
    return cancellation?.result
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
    do {
      previousOperation = try withState {
        guard case .open(let request) = state, request?.token === token else {
          throw CancellationError()
        }

        state = .open(Request(token: token, operation: currentOperation))
        return request?.operation
      }
    } catch {
      task.cancel()
      throw error
    }
    previousOperation?.cancel()

    return try await withTaskCancellationHandler {
      do {
        let result = try await task.value
        try Task.checkCancellation()
        guard isCurrent() else { throw CancellationError() }
        guard clear(currentOperation) else { throw CancellationError() }
        return result
      } catch {
        clear(currentOperation)
        throw error
      }
    } onCancel: {
      self.cancel(currentOperation)
    }
  }

  @discardableResult
  private func clear(_ operation: CurrentOperation) -> Bool {
    withState {
      guard case .open(let request) = state,
            let request,
            request.operation === operation else {
        return false
      }

      state = .open(Request(token: request.token, operation: nil))
      return true
    }
  }

  private func cancel(_ operation: CurrentOperation) {
    let operationToCancel: CurrentOperation? = withState {
      guard case .open(let request) = state,
            request?.operation === operation else {
        return nil
      }

      state = .open(nil)
      return operation
    }

    operationToCancel?.cancel()
  }
}
