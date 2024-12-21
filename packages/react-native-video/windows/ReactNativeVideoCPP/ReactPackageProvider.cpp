#include "pch.h"
#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include "ReactVideoViewManager.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ReactNativeVideoCPP::implementation {

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept {
  packageBuilder.AddViewManager(L"ReactVideoViewManager", []() { return winrt::make<ReactVideoViewManager>(); });
}

} // namespace winrt::ReactNativeVideoCPP::implementation
