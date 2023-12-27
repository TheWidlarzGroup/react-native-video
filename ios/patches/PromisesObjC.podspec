Pod::Spec.new do |s|
  s.name        = 'PromisesObjC'
  s.version     = '2.3.1.1'
  s.authors     = 'Google Inc.'
  s.license     = { :type => 'Apache-2.0', :file => 'LICENSE' }
  s.homepage    = 'https://github.com/google/promises'
  s.source      = { :git => 'https://github.com/google/promises.git', :tag => s.version }
  s.summary     = 'Synchronization construct for Objective-C'
  s.description = <<-DESC

  Promises is a modern framework that provides a synchronization construct for
  Objective-C to facilitate writing asynchronous code.
                     DESC
                     
  s.platforms = { :ios => '9.0', :osx => '10.11', :tvos => '9.0', :watchos => '2.0', :visionos => '1.0' }

  s.module_name = 'FBLPromises'
  s.prefix_header_file = false
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end