#include "pch.h"
#include "ReactPackageProvider.h"
#include "NativeModules.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif


#ifdef RNV_USE_XAML
#include "ReactVideoViewManager.h"
#include "VideoManagerModule.h"
#endif

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ReactNativeVideoCPP::implementation {

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept {
  AddAttributedModules(packageBuilder, true);
  
#ifdef RNV_USE_XAML
  // Register XAML-based view manager for UWP
  packageBuilder.AddViewManager(L"ReactVideoViewManager", []() { return winrt::make<ReactVideoViewManager>(); });
#else
  // Win32/Composition mode - video playback not yet implemented
  // TODO: Implement Fabric-based video component for Win32
#endif
}

} // namespace winrt::ReactNativeVideoCPP::implementation

// Export function for Win32 apps to get the package provider without WinRT activation
extern "C" __declspec(dllexport) void* __cdecl CreateReactPackageProvider() {
  auto provider = winrt::make<winrt::ReactNativeVideoCPP::implementation::ReactPackageProvider>();
  void* abi = nullptr;
  winrt::copy_to_abi(provider, abi);
  return abi;
}
