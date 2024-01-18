Pod::Spec.new do |s|
  s.name        = 'PromisesSwift'
  s.version     = '2.3.1.1'
  s.authors     = 'Google Inc.'
  s.license     = { :type => 'Apache-2.0', :file => 'LICENSE' }
  s.homepage    = 'https://github.com/google/promises'
  s.source      = { :git => 'https://github.com/google/promises.git', :tag => '2.3.1' }
  s.summary     = 'Synchronization construct for Swift'
  s.description = <<-DESC

  Promises is a modern framework that provides a synchronization construct for
  Swift to facilitate writing asynchronous code.
                     DESC
                     
  s.platforms = { :ios => '9.0', :osx => '10.11', :tvos => '9.0', :watchos => '2.0', :visionos => '1.0' }
  s.swift_versions = ['5.0', '5.2']

  s.module_name = 'Promises'
  s.source_files = "Sources/#{s.module_name}/*.{swift}"
  s.dependency 'PromisesObjC', "#{s.version}"
end