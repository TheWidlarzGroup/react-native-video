#pragma once

#include "winrt/Microsoft.ReactNative.h"

namespace ReactNativeVideo {

REACT_MODULE(VideoManager)
struct VideoManager {
  using ModuleSpec = ReactNativeVideo::VideoManagerSpec;

  REACT_INIT(Initialize)
  void Initialize(winrt::Microsoft::ReactNative::ReactContext const &reactContext) noexcept;

  REACT_METHOD(seekCmd, L"seekCmd")
  winrt::fire_and_forget seekCmd(
      int reactTag,
      double time,
      std::optional<double> tolerance) noexcept;

  REACT_METHOD(setPlayerPauseStateCmd, L"setPlayerPauseStateCmd")
  winrt::fire_and_forget setPlayerPauseStateCmd(int reactTag, bool paused) noexcept;

  REACT_METHOD(setLicenseResultCmd, L"setLicenseResultCmd")
  winrt::fire_and_forget setLicenseResultCmd(
      int reactTag,
      std::string result,
      std::string licenseUrl) noexcept;

  REACT_METHOD(setLicenseResultErrorCmd, L"setLicenseResultErrorCmd")
  winrt::fire_and_forget setLicenseResultErrorCmd(
      int reactTag,
      std::string error,
      std::string licenseUrl) noexcept;

  REACT_METHOD(setFullScreenCmd, L"setFullScreenCmd")
  winrt::fire_and_forget setFullScreenCmd(int reactTag, bool fullScreen) noexcept;

  REACT_METHOD(setSourceCmd, L"setSourceCmd")
  winrt::fire_and_forget setSourceCmd(
      int reactTag,
      winrt::Microsoft::ReactNative::JSValueObject source) noexcept;

  REACT_METHOD(setVolumeCmd, L"setVolumeCmd")
  winrt::fire_and_forget setVolumeCmd(int reactTag, double volume) noexcept;

  REACT_METHOD(enterPictureInPictureCmd, L"enterPictureInPictureCmd")
  winrt::fire_and_forget enterPictureInPictureCmd(int reactTag) noexcept;

  REACT_METHOD(exitPictureInPictureCmd, L"exitPictureInPictureCmd")
  winrt::fire_and_forget exitPictureInPictureCmd(int reactTag) noexcept;

  REACT_METHOD(save, L"save")
  winrt::fire_and_forget save(
      int reactTag,
      winrt::Microsoft::ReactNative::JSValueObject option,
      winrt::Microsoft::ReactNative::ReactPromise<winrt::Microsoft::ReactNative::JSValueObject> promise) noexcept;

  REACT_METHOD(getCurrentPosition, L"getCurrentPosition")
  winrt::fire_and_forget getCurrentPosition(
      int reactTag,
      winrt::Microsoft::ReactNative::ReactPromise<int> promise) noexcept;

 private:
  winrt::Microsoft::ReactNative::ReactContext m_reactContext{nullptr};
};

} // namespace ReactNativeVideo
