Pod::Spec.new do |s|
  s.name        = 'PromisesObjC'
  s.version     = '2.3.1.1'
  s.authors     = 'Google Inc.'
  s.license     = { :type => 'Apache-2.0', :file => 'LICENSE' }
  s.homepage    = 'https://github.com/google/promises'
  s.source      = { :git => 'https://github.com/google/promises.git', :tag => '2.3.1' }
  s.summary     = 'Synchronization construct for Objective-C'
  s.description = <<-DESC

  Promises is a modern framework that provides a synchronization construct for
  Objective-C to facilitate writing asynchronous code.
                     DESC
                     
  s.platforms = { :ios => '9.0', :osx => '10.11', :tvos => '9.0', :watchos => '2.0', :visionos => '1.0' }

  s.module_name = 'FBLPromises'
  s.prefix_header_file = false
  s.header_dir = "./"
  s.public_header_files = "Sources/#{s.module_name}/include/**/*.h"
  s.private_header_files = "Sources/#{s.module_name}/include/FBLPromisePrivate.h"
  s.source_files = "Sources/#{s.module_name}/**/*.{h,m}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.test_spec 'Tests' do |ts|
    # Note: Omits watchOS as a workaround since XCTest is not available to watchOS for now.
    # Reference: https://github.com/CocoaPods/CocoaPods/issues/8283, https://github.com/CocoaPods/CocoaPods/issues/4185.
    ts.platforms = {:ios => nil, :osx => nil, :tvos => nil}
    ts.source_files = "Tests/#{s.module_name}Tests/*.m",
                      "Sources/#{s.module_name}TestHelpers/include/#{s.module_name}TestHelpers.h"
  end
  s.test_spec 'PerformanceTests' do |ts|
    # Note: Omits watchOS as a workaround since XCTest is not available to watchOS for now.
    # Reference: https://github.com/CocoaPods/CocoaPods/issues/8283, https://github.com/CocoaPods/CocoaPods/issues/4185.
    ts.platforms = {:ios => nil, :osx => nil, :tvos => nil}
    ts.source_files = "Tests/#{s.module_name}PerformanceTests/*.m",
                      "Sources/#{s.module_name}TestHelpers/include/#{s.module_name}TestHelpers.h"
  end
end