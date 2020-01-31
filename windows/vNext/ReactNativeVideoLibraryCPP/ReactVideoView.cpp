// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"
#include "ReactVideoView.h"
#include "ReactVideoView.g.cpp"
#include "NativeModules.h"

using namespace winrt;
using namespace Windows::Foundation;
using namespace Windows::Foundation::Collections;

using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Media;
using namespace Windows::UI::Xaml::Controls;
using namespace Windows::UI::Core;
using namespace Windows::Media::Core;
using namespace Windows::Media::Playback;

namespace winrt::ReactNativeVideoCPP::implementation {
ReactVideoView::ReactVideoView(winrt::Microsoft::ReactNative::IReactContext const &reactContext)
    : m_reactContext(reactContext) {
  // always create and set the player here instead of depending on auto-create logic
  // in the MediaPlayerElement (only when auto play is on or URI is set)
  m_player = winrt::Windows::Media::Playback::MediaPlayer();
  SetMediaPlayer(m_player);
  m_uiDispatcher = CoreWindow::GetForCurrentThread().Dispatcher();
  auto mediaOpenedToken = m_player.MediaOpened([ref = get_weak()](auto const &sender, auto const &args) {
    auto self = ref.get();
    if (self) {
      self->OnMediaOpened(sender, args);
    }
  });

  auto mediaFailedToken = m_player.MediaFailed([ref = get_weak()](auto const &sender, auto const &args) {
    auto self = ref.get();
    if (self) {
      self->OnMediaFailed(sender, args);
    }
  });

  auto mediaEndedToken = m_player.MediaEnded([ref = get_weak()](auto const &sender, auto const &args) {
    auto self = ref.get();
    if (self) {
      self->OnMediaEnded(sender, args);
    }
  });

  auto bufferingStartedToken =
      m_player.PlaybackSession().BufferingStarted([ref = get_weak()](auto const &sender, auto const &args) {
        auto self = ref.get();
        if (self) {
          self->OnBufferingStarted(sender, args);
        }
      });

  auto bufferingEndedToken =
      m_player.PlaybackSession().BufferingEnded([ref = get_weak()](auto const &sender, auto const &args) {
        auto self = ref.get();
        if (self) {
          self->OnBufferingEnded(sender, args);
        }
      });

  auto seekCompletedToken =
      m_player.PlaybackSession().SeekCompleted([ref = get_weak()](auto const &sender, auto const &args) {
        auto self = ref.get();
        if (self) {
          self->OnSeekCompleted(sender, args);
        }
      });

  m_timer = Windows::UI::Xaml::DispatcherTimer();
  m_timer.Interval(std::chrono::milliseconds{250});
  m_timer.Start();
  auto token = m_timer.Tick([ref = get_weak()](auto const &, auto const &) {
    auto self = ref.get();
    if (self) {
      if (auto mediaPlayer = self->m_player) {
        if (mediaPlayer.PlaybackSession().PlaybackState() ==
            winrt::Windows::Media::Playback::MediaPlaybackState::Playing) {
          auto currentTimeInSeconds = mediaPlayer.PlaybackSession().Position().count() / 10000000;
          self->m_reactContext.DispatchEvent(
              *self,
              L"topProgress",
              [&](winrt::Microsoft::ReactNative::IJSValueWriter const &eventDataWriter) noexcept {
                eventDataWriter.WriteObjectBegin();
                {
                  WriteProperty(eventDataWriter, L"currentTime", currentTimeInSeconds);
                  WriteProperty(eventDataWriter, L"playableDuration", 0.0);
                }
                eventDataWriter.WriteObjectEnd();
              });
        }
      }
    }
  });
}

void ReactVideoView::OnMediaOpened(IInspectable const &, IInspectable const &) {
  runOnQueue([weak_this{get_weak()}]() {
    if (auto strong_this{weak_this.get()}) {
      if (auto mediaPlayer = strong_this->m_player) {
        auto width = mediaPlayer.PlaybackSession().NaturalVideoWidth();
        auto height = mediaPlayer.PlaybackSession().NaturalVideoHeight();
        auto orientation = (width > height) ? L"landscape" : L"portrait";
        auto durationInSeconds = mediaPlayer.PlaybackSession().NaturalDuration().count() / 10000000;
        auto currentTimeInSeconds = mediaPlayer.PlaybackSession().Position().count() / 10000000;

        strong_this->m_reactContext.DispatchEvent(
            *strong_this,
            L"topLoad",
            [&](winrt::Microsoft::ReactNative::IJSValueWriter const &eventDataWriter) noexcept {
              eventDataWriter.WriteObjectBegin();
              {
                WriteProperty(eventDataWriter, L"duration", durationInSeconds);
                WriteProperty(eventDataWriter, L"currentTime", currentTimeInSeconds);

                eventDataWriter.WritePropertyName(L"naturalSize");
                {
                  eventDataWriter.WriteObjectBegin();
                  WriteProperty(eventDataWriter, L"width", width);
                  WriteProperty(eventDataWriter, L"height", height);
                  WriteProperty(eventDataWriter, L"orientation", orientation);
                  WriteProperty(eventDataWriter, L"orientation", orientation);
                  eventDataWriter.WriteObjectEnd();
                }

                WriteProperty(eventDataWriter, L"canPlayFastForward", false);
                WriteProperty(eventDataWriter, L"canPlaySlowForward", false);
                WriteProperty(eventDataWriter, L"canPlaySlow", false);
                WriteProperty(eventDataWriter, L"canStepBackward", false);
                WriteProperty(eventDataWriter, L"canStepForward", false);
              }
              eventDataWriter.WriteObjectEnd();
            });
      }
    }
  });
}

void ReactVideoView::OnMediaFailed(IInspectable const &, IInspectable const &) {}

void ReactVideoView::OnMediaEnded(IInspectable const &, IInspectable const &) {
  runOnQueue([weak_this{get_weak()}]() {
    if (auto strong_this{weak_this.get()}) {
      strong_this->m_reactContext.DispatchEvent(*strong_this, L"topEnd", nullptr);
    }
  });
}

void ReactVideoView::OnBufferingStarted(IInspectable const &, IInspectable const &) {}

void ReactVideoView::OnBufferingEnded(IInspectable const &, IInspectable const &) {}

void ReactVideoView::OnSeekCompleted(IInspectable const &, IInspectable const &) {
  runOnQueue([weak_this{get_weak()}]() {
    if (auto strong_this{weak_this.get()}) {
      strong_this->m_reactContext.DispatchEvent(*strong_this, L"topSeek", nullptr);
    }
  });
}

void ReactVideoView::Set_progressUpdateInterval(int64_t interval) {
  m_timer.Interval(std::chrono::milliseconds{interval});
}

void ReactVideoView::Set_IsLoopingEnabled(bool value) {
  m_isLoopingEnabled = value;
  if (m_player != nullptr) {
    m_player.IsLoopingEnabled(m_isLoopingEnabled);
  }
}

void ReactVideoView::Set_UriString(hstring const &value) {
  m_uriString = value;
  if (m_player != nullptr) {
    auto uri = Uri(m_uriString);
    m_player.Source(MediaSource::CreateFromUri(uri));
  }
}

void ReactVideoView::Set_Paused(bool value) {
  m_isPaused = value;
  if (m_player != nullptr) {
    if (m_isPaused) {
      if (IsPlaying(m_player.PlaybackSession().PlaybackState())) {
        m_player.Pause();
      }
    } else {
      if (!IsPlaying(m_player.PlaybackSession().PlaybackState())) {
        m_player.Play();
      }
    }
  }
}

void ReactVideoView::Set_Muted(bool isMuted) {
  m_isMuted = isMuted;
  if (m_player != nullptr) {
    m_player.IsMuted(m_isMuted);
  }
}

void ReactVideoView::Set_Controls(bool useControls) {
  m_useControls = useControls;
  AreTransportControlsEnabled(m_useControls);
}

void ReactVideoView::Set_FullScreen(bool fullScreen) {
  if (m_fullScreen != fullScreen) {
    m_fullScreen = fullScreen;
    IsFullWindow(m_fullScreen);
    auto applicationView = winrt::Windows::UI::ViewManagement::ApplicationView::GetForCurrentView();
    bool isFullScreen = applicationView.IsFullScreenMode();
    if (m_fullScreen) {
      // transport control needs to be enabled for full screen mode
      m_useControls = true;
      AreTransportControlsEnabled(m_useControls);
      if (!isFullScreen) {
        applicationView.TryEnterFullScreenMode();
      }
    } else if (!m_fullScreen && isFullScreen) {
      applicationView.ExitFullScreenMode();
    }
  }
}

void ReactVideoView::Set_Volume(double volume) {
  m_volume = volume;
  if (m_player != nullptr) {
    m_player.Volume(m_volume);
  }
}

void ReactVideoView::Set_Position(double position) {
  m_position = position;
  if (m_player != nullptr) {
    std::chrono::seconds duration(static_cast<int>(m_position));
    m_player.PlaybackSession().Position(duration);
  }
}

bool ReactVideoView::IsPlaying(MediaPlaybackState currentState) {
  if (currentState == MediaPlaybackState::Buffering || currentState == MediaPlaybackState::Opening ||
      currentState == MediaPlaybackState::Playing) {
    return true;
  } else {
    return false;
  }
}

void ReactVideoView::runOnQueue(std::function<void()> &&func) {
  m_uiDispatcher.RunAsync(
      winrt::Windows::UI::Core::CoreDispatcherPriority::Normal, [func = std::move(func)]() { func(); });
}

} // namespace winrt::ReactNativeVideoCPP::implementation
