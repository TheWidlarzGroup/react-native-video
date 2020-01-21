require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = 'ReactVideoSubtitleSideloader_tvOS'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = 'https://github.com/brentvatne/react-native-video/ios/ReactVideoSubtitleSideloader_tvOS'
  s.source       = { :path => "." }
  s.swift_version = "4.2"

  s.ios.deployment_target = "8.0"
  s.tvos.deployment_target = "9.0"

  s.source_files = "**/*.{h,swift}"
end
