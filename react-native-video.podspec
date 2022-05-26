require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = 'react-native-video'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = 'https://github.com/brentvatne/react-native-video'
  s.source       = { :git => "https://github.com/brentvatne/react-native-video.git", :tag => "#{s.version}" }
  s.swift_version = "4.2"

  s.ios.deployment_target = "11.2"
  s.tvos.deployment_target = "11.2"

  s.static_framework = true

  s.source_files = "ios/Beacon/HTTP/*.{h,m}", "ios/Video/*.{h,m}", "ios/Beacon/*.{h,m}", "ios/Video/*.swift"
  
  s.dependency 'dice-shield-ios'
  s.dependency 'ReactVideoSubtitleSideloader_tvOS'
  s.dependency 'React'
  s.dependency 'AVDoris'
end
