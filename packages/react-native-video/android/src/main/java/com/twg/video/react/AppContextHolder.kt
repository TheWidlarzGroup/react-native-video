package com.twg.video.react

import android.content.Context

object AppContextHolder {
    lateinit var appContext: Context
    fun init(context: Context) {
        appContext = context.applicationContext
    }
}