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
  private var currentReservation: SourceLoader.LoadReservation?

  func load<T>(
    reservation: SourceLoader.LoadReservation,
    isCurrentLoad: @escaping () -> Bool,
    priority: TaskPriority,
    operation: @escaping () async throws -> T
  ) async throws -> T {
    guard isCurrentLoad() else {
      throw CancellationError()
    }
    cancelCurrentTask()

    let cancellableTask = Task(priority: priority) {
      try await operation()
    }

    let cancellable = AnyCancellable {
      cancellableTask.cancel()
    }
    currentCancellable = cancellable
    currentReservation = reservation

    do {
      let result = try await cancellableTask.value
      guard isCurrentLoad(),
        currentReservation === reservation,
        currentCancellable === cancellable
      else {
        throw CancellationError()
      }
      currentCancellable = nil
      return result
    } catch {
      if currentCancellable === cancellable {
        currentCancellable = nil
      }
      throw error
    }
  }

  func cancel(
    reservation: SourceLoader.LoadReservation,
    isCancelled: @escaping () -> Bool
  ) {
    guard isCancelled(), currentReservation === reservation else {
      return
    }
    cancelCurrentTask()
  }

  func cancelCurrent(isCurrentCancellation: @escaping () -> Bool) {
    guard isCurrentCancellation() else {
      return
    }
    cancelCurrentTask()
  }

  private func cancelCurrentTask() {
    currentCancellable?.cancel()
    currentCancellable = nil
    currentReservation = nil
  }
}

class SourceLoader {
  final class LoadReservation {
    private var cancelled = false

    fileprivate init() {}

    fileprivate func cancel() {
      cancelled = true
    }

    fileprivate var isCancelled: Bool {
      cancelled
    }
  }

  private let actor = SourceLoaderActor()
  private let requestLock = NSLock()
  private var currentReservation: LoadReservation?

  func reserveLoad() -> LoadReservation {
    requestLock.lock()
    defer { requestLock.unlock() }
    let reservation = LoadReservation()
    currentReservation = reservation
    return reservation
  }

  func load<T>(
    reservation: LoadReservation,
    isCurrent: @escaping () -> Bool = { true },
    priority: TaskPriority = .userInitiated,
    operation: @escaping () async throws -> T
  ) async throws -> T {
    if Task.isCancelled {
      requestCancellation(for: reservation)
      throw CancellationError()
    }

    let isCurrentLoad = { [self] in
      self.isActive(reservation)
        && isCurrent()
    }

    return try await withTaskCancellationHandler {
      try Task.checkCancellation()
      let result = try await actor.load(
        reservation: reservation,
        isCurrentLoad: isCurrentLoad,
        priority: priority,
        operation: operation
      )
      try Task.checkCancellation()
      return result
    } onCancel: {
      requestCancellation(for: reservation)
    }
  }

  func requestCancellation() {
    let cancellation = reserveCancellation()
    Task {
      await actor.cancelCurrent(
        isCurrentCancellation: { self.isCurrentCancellation(cancellation) }
      )
    }
  }

  private func reserveCancellation() -> LoadReservation {
    requestLock.lock()
    defer { requestLock.unlock() }
    let cancellation = LoadReservation()
    cancellation.cancel()
    currentReservation = cancellation
    return cancellation
  }

  private func isActive(_ reservation: LoadReservation) -> Bool {
    requestLock.lock()
    defer { requestLock.unlock() }
    return currentReservation === reservation && reservation.isCancelled == false
  }

  private func isCurrentCancellation(_ reservation: LoadReservation) -> Bool {
    requestLock.lock()
    defer { requestLock.unlock() }
    return currentReservation === reservation && reservation.isCancelled
  }

  private func requestCancellation(for reservation: LoadReservation) {
    requestLock.lock()
    reservation.cancel()
    requestLock.unlock()

    Task {
      await actor.cancel(
        reservation: reservation,
        isCancelled: { self.isCancelled(reservation) }
      )
    }
  }

  private func isCancelled(_ reservation: LoadReservation) -> Bool {
    requestLock.lock()
    defer { requestLock.unlock() }
    return reservation.isCancelled
  }
}
