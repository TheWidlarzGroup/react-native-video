#!/usr/bin/env ruby
# Xcode 26's Apple Clang 21 is stricter about consteval call sites, which breaks fmt
# 11.0.2's FMT_STRING(...) usages (fmtlib/fmt#4740, facebook/react-native#55601).
# consteval doesn't exist pre-C++20, so building just the fmt pod as C++17 sidesteps the
# strict check. Run after every `pod install` — react-native-test-app's Podfile already
# uses its own post_install hook (CocoaPods only allows one per Podfile), so this can't
# live there; see `pods` in package.json. Remove once RN bundles an fmt release that
# builds cleanly on Xcode 26.
require "xcodeproj"

project = Xcodeproj::Project.open(File.join(__dir__, "Pods", "Pods.xcodeproj"))
project.targets.each do |target|
  next unless target.name == "fmt"

  target.build_configurations.each do |config|
    config.build_settings["CLANG_CXX_LANGUAGE_STANDARD"] = "c++17"
  end
end
project.save
