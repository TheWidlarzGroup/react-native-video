package com.video.core.utils

import android.os.Handler
import android.os.Looper
import com.margelo.nitro.NitroModules
import com.video.core.LibraryError
import java.util.concurrent.Callable
import java.util.concurrent.FutureTask

object Threading {
  @JvmStatic
  fun runOnMainThread(action: () -> Unit) {
    // We are already on the main thread, run and return
    if (Looper.myLooper() == Looper.getMainLooper()) {
      action()
      return
    }

    // If application context is null, throw an error
    if (NitroModules.applicationContext == null) {
      throw LibraryError.ApplicationContextNotFound
    }

    // Post the action to the main thread
    Handler(NitroModules.applicationContext!!.mainLooper).post {
      action()
    }
  }

  @JvmStatic
  fun <T> runOnMainThreadSync(action: Callable<T>): T {
    return if (Looper.myLooper() == Looper.getMainLooper()) {
      // Already on the main thread, run and return the result
      action.call()
    } else {
      // Post the action to the main thread and wait for the result
      val futureTask = FutureTask(action)
      Handler(Looper.getMainLooper()).post(futureTask)
      futureTask.get()
    }
  }
}
