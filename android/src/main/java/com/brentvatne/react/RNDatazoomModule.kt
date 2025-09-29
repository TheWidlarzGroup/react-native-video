package com.brentvatne.react

import android.content.pm.PackageManager
import android.util.Log
import com.facebook.react.bridge.*
import com.brentvatne.datazoom.DatazoomManager

private object InitGuard {
  @Volatile private var initialized = false

  fun initIfNeeded(context: ReactApplicationContext, opts: ReadableMap? = null) {
    if(opts == null) {
      Log.w("RNDatazoom", "No options provided to initialize Datazoom SDK") 
      return
    }
    if (initialized) return
    synchronized(this) {
      if (initialized) return

      val app = context.applicationContext

      // JS overrides
      val apiKey = opts?.getString("apiKey") ?: ""

      DatazoomManager.init(apiKey)
      Log.i("RNDatazoom", "Initialized: key=${if (apiKey.isEmpty()) "Why its empty" else "***"}")

      initialized = true
    }
  }
}

class RNDatazoomModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "RNDatazoom"

  init {
    InitGuard.initIfNeeded(reactContext, null)
  }

  @ReactMethod
  fun initialize(options: ReadableMap?, promise: Promise) {
    InitGuard.initIfNeeded(reactContext, options)
    promise.resolve(null)
  }
}
