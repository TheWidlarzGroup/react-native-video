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
winrt::Microsoft::ReactNative::ConstantProviderDelegate ReactVideoViewManager::ExportedViewConstants() noexcept {
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
  nativeProps.Insert(L"rate", ViewManagerPropertyType::Number);

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
      if (!propertyValue.IsNull()) {
        if (propertyName == "src") {
          auto const &srcMap = propertyValue.AsObject();
          auto const &uri = srcMap.at("uri");
          reactVideoView.Set_UriString(to_hstring(uri.AsString()));
        } else if (propertyName == "resizeMode") {
          reactVideoView.Stretch(static_cast<Stretch>(std::stoul(propertyValue.AsString())));
        } else if (propertyName == "repeat") {
          reactVideoView.Set_IsLoopingEnabled(propertyValue.AsBoolean());
        } else if (propertyName == "paused") {
          m_paused = propertyValue.AsBoolean();
          reactVideoView.Set_Paused(m_paused);
        } else if (propertyName == "muted") {
          reactVideoView.Set_Muted(propertyValue.AsBoolean());
        } else if (propertyName == "volume") {
          reactVideoView.Set_Volume(propertyValue.AsDouble());
        } else if (propertyName == "seek") {
          reactVideoView.Set_Position(propertyValue.AsDouble());
        } else if (propertyName == "controls") {
          reactVideoView.Set_Controls(propertyValue.AsBoolean());
        } else if (propertyName == "fullscreen") {
          reactVideoView.Set_FullScreen(propertyValue.AsBoolean());
        } else if (propertyName == "progressUpdateInterval") {
          reactVideoView.Set_ProgressUpdateInterval(propertyValue.AsInt64());
        } else if (propertyName == "rate") {
          reactVideoView.Set_PlaybackRate(propertyValue.AsDouble());
        }
      }
    }
    reactVideoView.Set_AutoPlay(!m_paused); // auto play on pause false or not set.
  }
}

// IViewManagerWithExportedEventTypeConstants
ConstantProviderDelegate ReactVideoViewManager::ExportedCustomBubblingEventTypeConstants() noexcept {
  return nullptr;
}

ConstantProviderDelegate ReactVideoViewManager::ExportedCustomDirectEventTypeConstants() noexcept {
  return [](winrt::Microsoft::ReactNative::IJSValueWriter const &constantWriter) {
    WriteCustomDirectEventTypeConstant(constantWriter, "Load");
    WriteCustomDirectEventTypeConstant(constantWriter, "End");
    WriteCustomDirectEventTypeConstant(constantWriter, "Seek");
    WriteCustomDirectEventTypeConstant(constantWriter, "Progress");
  };
}

} // namespace winrt::ReactNativeVideoCPP::implementation
