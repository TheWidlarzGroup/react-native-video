package com.video.utils

import android.os.Handler
import android.os.Looper
import com.margelo.nitro.NitroModules
import java.util.concurrent.Callable
import java.util.concurrent.FutureTask

class Threading {
  companion object {
    @JvmStatic
    fun runOnMainThread(action: () -> Unit) {
      if (NitroModules.applicationContext == null) {
        throw IllegalStateException("Application context is null")
      }

      if (Looper.myLooper() == Looper.getMainLooper()) {
        action()
      }

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
        futureTask.get() // This will block until the result is returned
      }
    }
  }
}
