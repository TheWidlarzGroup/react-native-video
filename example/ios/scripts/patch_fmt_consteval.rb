# Durable workaround for the fmt / Xcode 26 `consteval` incompatibility.
#
# Apple clang 21 (Xcode 26.x) is strict about requiring the *call site* of a
# `consteval` function to itself be a constant expression. fmt 11.0.2 - the
# version RCT-Folly pins on React Native 0.77 - calls `FMT_STRING(...)` from
# non-constant-expression contexts inside `fmt/format-inl.h`, so the build dies
# with:
#
#   Pods/fmt/include/fmt/format-inl.h:1394:3: error: call to consteval function
#   'fmt::basic_format_string<...>::basic_format_string<char[N]>' is not a
#   constant expression
#
# Upstream fixed this by bumping fmt to 12.1.0, which only reaches React Native
# >= 0.83.9 / 0.85.x. Until this example app moves to such a version, we force
# fmt onto its non-consteval (plain `constexpr`) code path on Apple clang, which
# is the same fallback fmt already applies to older Apple compilers two lines
# further down.
#
# Pods/ is gitignored, so this has to run as a `post_install` hook to survive a
# fresh `pod install` - see example/ios/Podfile.
#
# See: https://github.com/fmtlib/fmt/issues/4740
#      https://github.com/facebook/react-native/issues/55601

module RNVideoFmtConstevalPatch
  MARKER = "RNVideo: force fmt off its consteval path".freeze

  # The single line in fmt/base.h that opens the FMT_USE_CONSTEVAL detection
  # chain. We prepend an Apple-clang branch in front of it.
  ANCHOR = "#if !defined(__cpp_lib_is_constant_evaluated)\n".freeze

  REPLACEMENT = <<~PATCH.freeze
    #if defined(__apple_build_version__)  // #{MARKER}
    #  define FMT_USE_CONSTEVAL 0
    #elif !defined(__cpp_lib_is_constant_evaluated)
  PATCH

  def self.apply!(installer)
    sandbox_root = installer.sandbox.root
    base_h = File.join(sandbox_root, "fmt", "include", "fmt", "base.h")

    unless File.exist?(base_h)
      Pod::UI.warn "[RNVideo] fmt/base.h not found at #{base_h}; skipping consteval patch."
      return
    end

    contents = File.read(base_h)

    if contents.include?(MARKER)
      Pod::UI.puts "[RNVideo] fmt consteval patch already applied.".green
      return
    end

    unless contents.include?(ANCHOR)
      Pod::UI.warn "[RNVideo] fmt/base.h does not contain the expected " \
                   "FMT_USE_CONSTEVAL detection block - fmt may have been " \
                   "upgraded. If the build succeeds, delete this patch."
      return
    end

    # sub (not gsub): the anchor is unique, but be explicit about it.
    File.write(base_h, contents.sub(ANCHOR, REPLACEMENT))
    Pod::UI.puts "[RNVideo] Patched fmt/base.h for Xcode 26 consteval.".green
  end
end
