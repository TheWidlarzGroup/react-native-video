package com.twg.video.core.utils

import com.twg.video.core.SourceError
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

class SourceLoader {
  private val operationCounter = AtomicInteger(0)
  private val currentOperationRef = AtomicReference<OperationHolder<*>?>(null)

  fun <T> load(operation: () -> T): T {
    cancel()

    val currentOp = operationCounter.incrementAndGet()
    val holder = OperationHolder<T>(currentOp)
    currentOperationRef.set(holder)

    return try {
      val result = operation()
      if (holder.operationId != operationCounter.get()) {
        throw SourceError.Cancelled
      }
      result
    } catch (e: SourceError.Cancelled) {
      throw e
    } catch (e: Exception) {
      if (holder.operationId != operationCounter.get()) {
        throw SourceError.Cancelled
      }
      throw e
    } finally {
      if (holder.operationId == operationCounter.get()) {
        currentOperationRef.set(null)
      }
    }
  }

  fun cancel() {
    val current = currentOperationRef.get()
    if (current != null) {
      operationCounter.incrementAndGet()
      currentOperationRef.set(null)
    }
  }

  private class OperationHolder<T>(val operationId: Int)
}

