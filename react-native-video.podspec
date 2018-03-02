require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "@n1ru4l/react-native-video"
  s.version      = package["version"]
  s.summary      = "A <Video /> element for react-native"
  s.author       = "Laurin Quast <laurinquast@googlemail.com> (https://github.com/n1ru4l)"

  s.homepage     = "https://github.com/n1ru4l/react-native-video"

  s.license      = "MIT"

  s.ios.deployment_target = "8.0"
  s.tvos.deployment_target = "9.0"

  s.source       = { :git => "https://github.com/n1ru4l/react-native-video.git", :tag => "#{s.version}" }

  s.source_files  = "ios/*.{h,m}"

  s.dependency "React"
  s.dependency "SPTPersistentCache", "~> 1.1.1"
  s.dependency "DVAssetLoaderDelegate", "~> 0.3.1"
end
