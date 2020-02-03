#pragma once
#include "ReactVideoView.g.h"
#include <functional>
using namespace winrt;
using namespace Microsoft::ReactNative;

namespace winrt::ReactNativeVideoCPP::implementation {
struct ReactVideoView : ReactVideoViewT<ReactVideoView> {
 public:
  ReactVideoView(winrt::Microsoft::ReactNative::IReactContext const &reactContext);
  void Set_UriString(hstring const &value);
  void Set_IsLoopingEnabled(bool value);
  void Set_Paused(bool isPaused);
  void Set_Muted(bool isMuted);
  void Set_Volume(double volume);
  void Set_Position(double position);
  void Set_Controls(bool useControls);
  void Set_FullScreen(bool fullScreen);
  void Set_progressUpdateInterval(int64_t interval);

 private:
  hstring m_uriString;
  bool m_isLoopingEnabled = false;
  bool m_isPaused = true;
  bool m_isMuted = false;
  bool m_useControls = false;
  bool m_fullScreen = false;
  double m_volume = 0;
  double m_position = 0;
  Windows::UI::Xaml::DispatcherTimer m_timer;
  winrt::Windows::Media::Playback::MediaPlayer m_player = nullptr;
  winrt::Windows::UI::Core::CoreDispatcher m_uiDispatcher = nullptr;
  winrt::Microsoft::ReactNative::IReactContext m_reactContext{nullptr};

  bool IsPlaying(Windows::Media::Playback::MediaPlaybackState currentState);
  void OnMediaOpened(IInspectable const &sender, IInspectable const &args);
  void OnMediaFailed(IInspectable const &sender, IInspectable const &args);
  void OnMediaEnded(IInspectable const &sender, IInspectable const &);
  void OnBufferingStarted(IInspectable const &sender, IInspectable const &);
  void OnBufferingEnded(IInspectable const &sender, IInspectable const &);
  void OnSeekCompleted(IInspectable const &sender, IInspectable const &);

  void runOnQueue(std::function<void()> &&func);
};
} // namespace winrt::ReactNativeVideoCPP::implementation
namespace winrt::ReactNativeVideoCPP::factory_implementation {
struct ReactVideoView : ReactVideoViewT<ReactVideoView, implementation::ReactVideoView> {};
} // namespace winrt::ReactNativeVideoCPP::factory_implementation
