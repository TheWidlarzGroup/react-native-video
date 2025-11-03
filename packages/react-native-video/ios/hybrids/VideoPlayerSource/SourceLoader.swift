//
//  SourceLoader.swift
//  ReactNativeVideo
//
//  Created by Krzysztof Moch on 27/01/2025.
//

import Foundation

private class AnyCancellable {
  private let _cancel: () -> Void

  init(_ cancel: @escaping () -> Void) {
    self._cancel = cancel
  }

  func cancel() {
    _cancel()
  }
}

actor SourceLoaderActor {
  private var currentCancellable: AnyCancellable?

  func load<T>(priority: TaskPriority, operation: @escaping () async throws -> T) async throws -> T
  {
    await cancelCurrentTask()

    let cancellableTask = Task(priority: priority) {
      try await operation()
    }

    let cancellable = AnyCancellable {
      cancellableTask.cancel()
    }
    currentCancellable = cancellable

    do {
      let result = try await cancellableTask.value
      if currentCancellable === cancellable {
        currentCancellable = nil
      }
      return result
    } catch {
      if currentCancellable === cancellable {
        currentCancellable = nil
      }
      if error is CancellationError {
        throw error
      }
      throw error
    }
  }

  func cancel() async {
    await cancelCurrentTask()
  }

  private func cancelCurrentTask() async {
    currentCancellable?.cancel()
    currentCancellable = nil
  }
}

class SourceLoader {
  private let actor = SourceLoaderActor()

  func load<T>(priority: TaskPriority = .userInitiated, operation: @escaping () async throws -> T)
    async throws -> T
  {
    return try await actor.load(priority: priority, operation: operation)
  }

  func cancel() async {
    await actor.cancel()
  }

  func cancelSync() {
    Task {
      await actor.cancel()
    }
  }
}
