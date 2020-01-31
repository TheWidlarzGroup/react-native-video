// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"
#include "ReactVideoViewManager.h"
#include "NativeModules.h"
#include "ReactVideoView.h"

namespace winrt::ReactNativeVideoCPP::implementation {

ReactVideoViewManager::ReactVideoViewManager() {}

// IViewManager
hstring ReactVideoViewManager::Name() noexcept {
  return L"RCTVideo";
}

FrameworkElement ReactVideoViewManager::CreateView() noexcept {
  auto reactVideoView = winrt::ReactNativeVideoCPP::ReactVideoView(m_reactContext);
  return reactVideoView;
}

// IViewManagerWithReactContext
IReactContext ReactVideoViewManager::ReactContext() noexcept {
  return m_reactContext;
}

void ReactVideoViewManager::ReactContext(IReactContext reactContext) noexcept {
  m_reactContext = reactContext;
}

// IViewManagerWithExportedViewConstants
winrt::Microsoft::ReactNative::ConstantProvider ReactVideoViewManager::ExportedViewConstants() noexcept {
  return [](winrt::Microsoft::ReactNative::IJSValueWriter const &constantWriter) {
    WriteProperty(constantWriter, L"ScaleNone", to_hstring(std::to_string((int)Stretch::None)));
    WriteProperty(constantWriter, L"ScaleToFill", to_hstring(std::to_string((int)Stretch::UniformToFill)));
    WriteProperty(constantWriter, L"ScaleAspectFit", to_hstring(std::to_string((int)Stretch::Uniform)));
    WriteProperty(constantWriter, L"ScaleAspectFill", to_hstring(std::to_string((int)Stretch::Fill)));
  };
}

// IViewManagerWithNativeProperties
IMapView<hstring, ViewManagerPropertyType> ReactVideoViewManager::NativeProps() noexcept {
  auto nativeProps = winrt::single_threaded_map<hstring, ViewManagerPropertyType>();
  nativeProps.Insert(L"src", ViewManagerPropertyType::Map);
  nativeProps.Insert(L"resizeMode", ViewManagerPropertyType::String);
  nativeProps.Insert(L"repeat", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"paused", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"muted", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"volume", ViewManagerPropertyType::Number);
  nativeProps.Insert(L"seek", ViewManagerPropertyType::Number);
  nativeProps.Insert(L"controls", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"fullscreen", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"progressUpdateInterval", ViewManagerPropertyType::Number);

  return nativeProps.GetView();
}

void ReactVideoViewManager::UpdateProperties(
    FrameworkElement const &view,
    IJSValueReader const &propertyMapReader) noexcept {
  if (auto reactVideoView = view.try_as<winrt::ReactNativeVideoCPP::ReactVideoView>()) {
    const JSValueObject &propertyMap = JSValue::ReadObjectFrom(propertyMapReader);

    for (auto const &pair : propertyMap) {
      auto const &propertyName = pair.first;
      auto const &propertyValue = pair.second;
      if (propertyName == "src") {
        if (!propertyValue.IsNull()) {
          auto const &srcMap = propertyValue.Object();
          auto const &uri = srcMap.at("uri");
          reactVideoView.Set_UriString(to_hstring(uri.String()));
        }
      } else if (propertyName == "resizeMode") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Stretch(static_cast<Stretch>(std::stoul(propertyValue.String())));
        }
      } else if (propertyName == "repeat") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_IsLoopingEnabled(propertyValue.Boolean());
        }
      } else if (propertyName == "paused") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_Paused(propertyValue.Boolean());
        }
      } else if (propertyName == "muted") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_Muted(propertyValue.Boolean());
        }
      } else if (propertyName == "volume") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_Volume(propertyValue.Double());
        }
      } else if (propertyName == "seek") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_Position(propertyValue.Double());
        }
      } else if (propertyName == "controls") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_Controls(propertyValue.Boolean());
        }
      } else if (propertyName == "fullscreen") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_FullScreen(propertyValue.Boolean());
        }
      } else if (propertyName == "progressUpdateInterval") {
        if (!propertyValue.IsNull()) {
          reactVideoView.Set_progressUpdateInterval(propertyValue.Int64());
        }
      }
    }
  }
}

// IViewManagerWithExportedEventTypeConstants
ConstantProvider ReactVideoViewManager::ExportedCustomBubblingEventTypeConstants() noexcept {
  return nullptr;
}

ConstantProvider ReactVideoViewManager::ExportedCustomDirectEventTypeConstants() noexcept {
  return [](winrt::Microsoft::ReactNative::IJSValueWriter const &constantWriter) {
    WriteCustomDirectEventTypeConstant(constantWriter, "Load");
    WriteCustomDirectEventTypeConstant(constantWriter, "End");
    WriteCustomDirectEventTypeConstant(constantWriter, "Seek");
    WriteCustomDirectEventTypeConstant(constantWriter, "Progress");
  };
}

} // namespace winrt::ReactNativeVideoCPP::implementation
