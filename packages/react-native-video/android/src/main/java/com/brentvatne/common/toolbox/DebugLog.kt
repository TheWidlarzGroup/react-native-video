package com.brentvatne.common.toolbox

import android.os.Build
import android.util.Log
import java.lang.Exception

/* log utils
* This class allow defining a log level for the package
* This is useful for debugging real time issue or tricky use cases
*/

object DebugLog {
    // log level to display
    private var level = Log.WARN

    // enable thread display in logs
    private var displayThread = true

    // add a common prefix for easy filtering
    private const val TAG_PREFIX = "RNV"

    @JvmStatic
    fun setConfig(_level: Int, _displayThread: Boolean) {
        level = _level
        displayThread = _displayThread
    }

    @JvmStatic
    private fun getTag(tag: String): String = TAG_PREFIX + tag

    @JvmStatic
    private fun getMsg(msg: String): String =
        if (displayThread) {
            "[" + Thread.currentThread().name + "] " + msg
        } else {
            msg
        }

    @JvmStatic
    fun v(tag: String, msg: String) {
        if (level <= Log.VERBOSE) Log.v(getTag(tag), getMsg(msg))
    }

    @JvmStatic
    fun d(tag: String, msg: String) {
        if (level <= Log.DEBUG) Log.d(getTag(tag), getMsg(msg))
    }

    @JvmStatic
    fun i(tag: String, msg: String) {
        if (level <= Log.INFO) Log.i(getTag(tag), getMsg(msg))
    }

    @JvmStatic
    fun w(tag: String, msg: String) {
        if (level <= Log.WARN) Log.w(getTag(tag), getMsg(msg))
    }

    @JvmStatic
    fun e(tag: String, msg: String) {
        if (level <= Log.ERROR) Log.e(getTag(tag), getMsg(msg))
    }

    @JvmStatic
    fun wtf(tag: String, msg: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.FROYO) {
            Log.wtf(getTag(tag), "--------------->" + getMsg(msg))
        } else {
            Log.e(getTag(tag), "--------------->" + getMsg(msg))
        }
        printCallStack()
    }

    @JvmStatic
    fun printCallStack() {
        if (level <= Log.VERBOSE) {
            val e = Exception()
            e.printStackTrace()
        }
    }

    // Additionnal thread safety checkers
    @JvmStatic
    fun checkUIThread(tag: String, msg: String) {
        if (Thread.currentThread().name != "main") {
            wtf(tag, "------------------------>" + getMsg(msg))
        }
    }

    @JvmStatic
    fun checkNotUIThread(tag: String, msg: String) {
        if (Thread.currentThread().name == "main") {
            wtf(tag, "------------------------>" + getMsg(msg))
        }
    }
}
