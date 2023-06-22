require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

fabric_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'

Pod::Spec.new do |s|
  s.name           = 'react-native-video'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = 'https://github.com/react-native-video/react-native-video'
  s.source       = { :git => "https://github.com/react-native-video/react-native-video.git", :tag => "v#{s.version}" }

  s.ios.deployment_target = "9.0"
  s.tvos.deployment_target = "9.0"

  s.dependency "React-Core"

  s.static_framework = true

  if fabric_enabled
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }

    s.dependency "React-RCTFabric"
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
    s.ios.deployment_target = "12.4"
  end

  if fabric_enabled
    s.subspec "Fabric" do |ss|
      ss.source_files = "ios/Fabric/**/*.{h,mm}"
    end
  end

  s.subspec "Video" do |ss|
    ss.source_files = "ios/Video/**/*.{h,m,swift,mm}"

    ss.dependency "PromisesSwift"
    if fabric_enabled
      ss.dependency "react-native-video/Fabric"
    end

    if defined?($RNVideoUseGoogleIMA)
      Pod::UI.puts "RNVideo: enable IMA SDK"

      ss.ios.dependency 'GoogleAds-IMA-iOS-SDK', '~> 3.18.1'
      ss.tvos.dependency 'GoogleAds-IMA-tvOS-SDK', '~> 4.2'
      ss.pod_target_xcconfig = {
        'OTHER_SWIFT_FLAGS' => '$(inherited) -D USE_GOOGLE_IMA'
      }
    end
  end

  s.subspec "VideoCaching" do |ss|
    ss.dependency "react-native-video/Video"
    ss.dependency "SPTPersistentCache", "~> 1.1.0"
    ss.dependency "DVAssetLoaderDelegate", "~> 0.3.1"

    ss.source_files = "ios/VideoCaching/**/*.{h,m,swift,mm}"
  end

  s.default_subspec = "Video"

  s.xcconfig = {
    'OTHER_LDFLAGS': '-ObjC',
  }
end
