#pragma once

#include "winrt/Microsoft.ReactNative.h"

using namespace winrt;
using namespace Windows::Foundation;
using namespace Windows::Foundation::Collections;

using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Media;
using namespace Windows::UI::Xaml::Controls;
using namespace Windows::Media::Core;

namespace winrt::ReactNativeVideoCPP::implementation {

struct ReactVideoViewManager : winrt::implements<
                                   ReactVideoViewManager,
                                   winrt::Microsoft::ReactNative::IViewManager,
                                   winrt::Microsoft::ReactNative::IViewManagerWithReactContext,
                                   winrt::Microsoft::ReactNative::IViewManagerWithExportedViewConstants,
                                   winrt::Microsoft::ReactNative::IViewManagerWithNativeProperties,
                                   winrt::Microsoft::ReactNative::IViewManagerWithExportedEventTypeConstants> {
 public:
  ReactVideoViewManager();
  // IViewManager
  winrt::hstring Name() noexcept;
  FrameworkElement CreateView() noexcept;

  // IViewManagerWithReactContext
  winrt::Microsoft::ReactNative::IReactContext ReactContext() noexcept;
  void ReactContext(winrt::Microsoft::ReactNative::IReactContext reactContext) noexcept;

  // IViewManagerWithNativeProperties
  winrt::Windows::Foundation::Collections::
      IMapView<winrt::hstring, winrt::Microsoft::ReactNative::ViewManagerPropertyType>
      NativeProps() noexcept;

  void UpdateProperties(
      winrt::Windows::UI::Xaml::FrameworkElement const &view,
      winrt::Microsoft::ReactNative::IJSValueReader const &propertyMapReader) noexcept;

  // IViewManagerWithExportedViewConstants
  winrt::Microsoft::ReactNative::ConstantProviderDelegate ExportedViewConstants() noexcept;

  // IViewManagerWithExportedEventTypeConstants
  winrt::Microsoft::ReactNative::ConstantProviderDelegate ExportedCustomBubblingEventTypeConstants() noexcept;

  winrt::Microsoft::ReactNative::ConstantProviderDelegate ExportedCustomDirectEventTypeConstants() noexcept;

 private:
  winrt::Microsoft::ReactNative::IReactContext m_reactContext{nullptr};
  bool m_paused = false;
};

} // namespace winrt::ReactNativeVideoCPP::implementation
