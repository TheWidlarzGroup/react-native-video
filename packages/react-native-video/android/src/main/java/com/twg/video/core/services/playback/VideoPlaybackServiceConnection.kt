package com.twg.video.core.services.playback

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.margelo.nitro.video.HybridVideoPlayer
import com.twg.video.core.extensions.startService
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class VideoPlaybackServiceConnection (private val player: WeakReference<HybridVideoPlayer>) :
    ServiceConnection {
  private val bindingLock = Any()
  private var bindingContext: Context? = null
  @Volatile
  var serviceBinder: VideoPlaybackServiceBinder? = null
    private set
  @Volatile
  var isStartDesired = false
    private set
  @Volatile
  var isFinallyDetached = false
    private set

  override fun onServiceConnected(componentName: ComponentName?, binder: IBinder?) {
    try {
      val connectedBinder = binder as? VideoPlaybackServiceBinder
      val context = synchronized(bindingLock) {
        if (bindingContext == null) {
          null
        } else {
          serviceBinder = connectedBinder
          bindingContext
        }
      }
      val player = player.get()

      if (context != null && connectedBinder != null && player != null && isStartDesired &&
        !isFinallyDetached && !player.isReleasedForService) {
        VideoPlaybackService.startService(player, context, this)
        return
      }

      connectedBinder?.service?.stopIfNoPlayers()
      if (connectedBinder == null || player == null || isFinallyDetached ||
        player.isReleasedForService) {
        unbind()
      } else {
        unbindIfStopped()
      }
    } catch (err: Exception) {
      Log.e("VideoPlaybackServiceConnection", "Could not bind to playback service", err)
      unbind()
    }
  }

  override fun onServiceDisconnected(componentName: ComponentName?) {
    serviceBinder = null
  }

  override fun onNullBinding(componentName: ComponentName?) {
    Log.e(
      "VideoPlaybackServiceConnection",
      "Could not bind to playback service - there can be issues with background playback" +
        "and notification controls"
    )
    unbind()
  }

  fun requestStart(): Boolean = synchronized(bindingLock) {
    if (isFinallyDetached) {
      return@synchronized false
    }
    isStartDesired = true
    true
  }

  fun bind(context: Context, intent: Intent, flags: Int) {
    synchronized(bindingLock) {
      if (!isStartDesired || isFinallyDetached || bindingContext != null) {
        return@synchronized
      }

      bindingContext = context
      // ServiceConnection callbacks are asynchronous; keep dispatcher registration atomic with
      // stop/rebind so unbind always uses the exact Context whose bind succeeded.
      val bound = try {
        context.bindService(intent, this, flags)
      } catch (_: Exception) {
        false
      }
      if (!bound) {
        bindingContext = null
      }
    }
  }

  fun unbindIfStopped() = synchronized(bindingLock) {
    if (isStartDesired && !isFinallyDetached) {
      return@synchronized
    }
    unbindLocked()
  }

  fun unbind() = synchronized(bindingLock) {
    unbindLocked()
  }

  private fun unbindLocked() {
    val context = bindingContext
    bindingContext = null
    serviceBinder = null
    if (context != null) {
      try { context.unbindService(this) } catch (_: Exception) {}
    }
  }

  fun stopPlayer(player: HybridVideoPlayer) {
    val service = synchronized(bindingLock) {
      isStartDesired = false
      serviceBinder?.service
    }
    try {
      service?.unregisterPlayer(player)
    } catch (_: Exception) {}
  }

  fun detachPlayer(player: HybridVideoPlayer) {
    val service = synchronized(bindingLock) {
      isStartDesired = false
      isFinallyDetached = true
      serviceBinder?.service
    }
    try {
      service?.detachPlayer(player)
    } catch (_: Exception) {}
  }
}
