// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"
#include "ReactPackageProvider.h"
#include "ReactPackageProvider.g.cpp"

#include "BareExampleModule.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::BareExample::implementation {

  void ReactPackageProvider::CreatePackage(IReactPackageBuilder const& packageBuilder) noexcept {
      // Note: This bare example uses the Video component from react-native-video package.
      // The video view component is registered by react-native-video's own package provider,
      // so we don't need to register it here. This package can be extended to add custom
      // video-related native modules or view managers as needed.
      AddAttributedModules(packageBuilder);
  }

}
