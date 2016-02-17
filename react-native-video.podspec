Pod::Spec.new do |s|
  s.name         = "react-native-video"
  s.version      = "0.7.1"
  s.summary      = "A <Video /> element for react-native"

  s.homepage     = "https://github.com:brentvatne/react-native-video"

  s.license      = "MIT"
  s.platform     = :ios, "8.0"

  s.source       = { :git => "https://github.com:brentvatne/react-native-video" }

  s.source_files  = "*.{h,m}"

  s.dependency 'React'
end
