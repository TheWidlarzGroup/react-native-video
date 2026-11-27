package com.twg.video.core.player

import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.LoadControl
import androidx.media3.exoplayer.upstream.DefaultAllocator
import com.margelo.nitro.video.BufferingStrategy
import kotlin.math.floor

/**
 * [DefaultLoadControl] with `bufferConfig.bufferingStrategy` on top, as in v6:
 * - `disableBuffering` loads only what playback needs to start or resume and nothing ahead
 *   of that. v6 refused every load; with this Media3 that ends in "Playback stuck buffering
 *   and not loading" before the first frame, so the buffer is allowed to reach the
 *   `bufferForPlayback…` durations,
 * - `dependingOnMemory` stops loading while the buffer has reached its share of the heap or
 *   the app is short on free memory, and otherwise behaves like the default.
 *
 * Built with the same values `DefaultLoadControl.Builder` would use, so everything except
 * [shouldContinueLoading] is the stock behaviour.
 */
@OptIn(UnstableApi::class)
class BufferingStrategyLoadControl(
  private val bufferAllocator: DefaultAllocator,
  minBufferMs: Int,
  maxBufferMs: Int,
  bufferForPlaybackMs: Int,
  bufferForPlaybackAfterRebufferMs: Int,
  backBufferDurationMs: Int,
  private val strategy: BufferingStrategy,
  maxHeapAllocationPercent: Double,
  private val minBufferMemoryReservePercent: Double,
  memoryClassMb: Int
) : DefaultLoadControl(
  bufferAllocator,
  minBufferMs,
  maxBufferMs,
  bufferForPlaybackMs,
  bufferForPlaybackAfterRebufferMs,
  C.LENGTH_UNSET, // targetBufferBytes
  DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS,
  backBufferDurationMs,
  false // retainBackBufferFromKeyframe
) {
  private val runtime = Runtime.getRuntime()
  private val neededForPlaybackUs =
    maxOf(bufferForPlaybackMs, bufferForPlaybackAfterRebufferMs) * 1000L
  private val availableHeapBytes =
    floor(memoryClassMb * maxHeapAllocationPercent * 1024 * 1024).toLong()

  override fun shouldContinueLoading(parameters: LoadControl.Parameters): Boolean {
    when (strategy) {
      BufferingStrategy.DISABLEBUFFERING ->
        if (parameters.bufferedDurationUs >= neededForPlaybackUs) return false
      // Never stop below what playback needs to start or resume: Media3 fails with
      // "Playback stuck buffering and not loading" when loading stops there.
      BufferingStrategy.DEPENDINGONMEMORY ->
        if (parameters.bufferedDurationUs >= neededForPlaybackUs && isShortOnMemory(parameters)) {
          return false
        }
      BufferingStrategy.DEFAULT -> Unit
    }
    return super.shouldContinueLoading(parameters)
  }

  private fun isShortOnMemory(parameters: LoadControl.Parameters): Boolean {
    val loadedBytes = bufferAllocator.totalBytesAllocated
    if (availableHeapBytes > 0 && loadedBytes >= availableHeapBytes) {
      return true
    }

    val usedMemory = runtime.totalMemory() - runtime.freeMemory()
    val freeMemory = runtime.maxMemory() - usedMemory
    val reserveMemory = (minBufferMemoryReservePercent * runtime.maxMemory()).toLong()
    val bufferedMs = parameters.bufferedDurationUs / 1000
    if (reserveMemory > freeMemory && bufferedMs > 2000) {
      // Not enough memory in reserve: stop buffering so other components can use it.
      return true
    }

    if (runtime.freeMemory() == 0L) {
      runtime.gc()
      return true
    }
    return false
  }

  companion object {
    const val DEFAULT_MAX_HEAP_ALLOCATION_PERCENT = 1.0
    const val DEFAULT_MIN_BUFFER_MEMORY_RESERVE_PERCENT = 0.0
  }
}
