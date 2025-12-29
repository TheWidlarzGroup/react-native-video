// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"
#include "ReactPackageProvider.h"
#include "ReactPackageProvider.g.cpp"

#include "VideoPluginSampleModule.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::VideoPluginSample::implementation {

  void ReactPackageProvider::CreatePackage(IReactPackageBuilder const& packageBuilder) noexcept {
      AddAttributedModules(packageBuilder);
  }

}
