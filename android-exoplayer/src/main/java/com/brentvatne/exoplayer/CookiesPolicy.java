package com.brentvatne.exoplayer;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.net.CookiePolicy;

enum CookiesPolicy {
  ALL("all", CookiePolicy.ACCEPT_ALL),
  NONE("none", CookiePolicy.ACCEPT_NONE),
  ORIGINAL("original", CookiePolicy.ACCEPT_ORIGINAL_SERVER),
  SYSTEM_DEFAULT("system_default", null);

  private CookiesPolicy(@NonNull String propertyName, @Nullable CookiePolicy cookiePolicy) {
    this.propertyName = propertyName;
    this.cookiePolicy = cookiePolicy;
  }

  @NonNull
  String propertyName;
  @Nullable
  CookiePolicy cookiePolicy;
}
