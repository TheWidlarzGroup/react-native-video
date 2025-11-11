package com.twg.video.core.utils

import android.os.Handler
import android.os.Looper
import com.margelo.nitro.NitroModules
import com.twg.video.core.LibraryError
import java.util.concurrent.Callable
import java.util.concurrent.FutureTask
import kotlin.reflect.KProperty

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

  class MainThreadProperty<Reference, Type>(
    private val get: Reference.() -> Type,
    private val set: (Reference.(Type) -> Unit)? = null
  ) {
    operator fun getValue(thisRef: Reference, property: KProperty<*>): Type {
      return runOnMainThreadSync { thisRef.get() }
    }

    operator fun setValue(thisRef: Reference, property: KProperty<*>, value: Type) {
      val setter = set ?: throw IllegalStateException("Property ${property.name} is read-only")
      runOnMainThread { thisRef.setter(value) }
    }
  }

  /**
   * Read-only property that runs on main thread
   * @param get The getter function that runs synchronously on the main thread.
   *
   * @throws [IllegalStateException] if there will be a write operation
   */
  fun <Reference, T> Reference.mainThreadProperty(get: Reference.() -> T) = MainThreadProperty(get)

  /**
   * Read-only property that runs on main thread
   * @param get The getter function that runs synchronously on the main thread
   * @param set The setter function that runs asynchronously on the main thread
   */
  fun <Reference, T> Reference.mainThreadProperty(
    get: Reference.() -> T,
    set: Reference.(T) -> Unit
  ) = MainThreadProperty(get, set)
}
