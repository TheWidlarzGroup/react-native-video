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

  m_mediaOpenedToken =
      m_player.MediaOpened(winrt::auto_revoke, [ref = get_weak()](auto const &sender, auto const &args) {
        if (auto self = ref.get()) {
          self->OnMediaOpened(sender, args);
        }
      });
  m_mediaFailedToken =
      m_player.MediaFailed(winrt::auto_revoke, [ref = get_weak()](auto const &sender, auto const &args) {
        if (auto self = ref.get()) {
          self->OnMediaFailed(sender, args);
        }
      });

  m_mediaEndedToken = m_player.MediaEnded(winrt::auto_revoke, [ref = get_weak()](auto const &sender, auto const &args) {
    if (auto self = ref.get()) {
      self->OnMediaEnded(sender, args);
    }
  });

  m_bufferingStartedToken = m_player.PlaybackSession().BufferingStarted(
      winrt::auto_revoke, [ref = get_weak()](auto const &sender, auto const &args) {
        if (auto self = ref.get()) {
          self->OnBufferingStarted(sender, args);
        }
      });

  m_bufferingEndedToken = m_player.PlaybackSession().BufferingEnded(
      winrt::auto_revoke, [ref = get_weak()](auto const &sender, auto const &args) {
        if (auto self = ref.get()) {
          self->OnBufferingEnded(sender, args);
        }
      });

  m_seekCompletedToken = m_player.PlaybackSession().SeekCompleted(
      winrt::auto_revoke, [ref = get_weak()](auto const &sender, auto const &args) {
        if (auto self = ref.get()) {
          self->OnSeekCompleted(sender, args);
        }
      });

  m_timer = Windows::UI::Xaml::DispatcherTimer();
  m_timer.Interval(std::chrono::milliseconds{250});
  m_timer.Start();
  auto token = m_timer.Tick([ref = get_weak()](auto const &, auto const &) {
    if (auto self = ref.get()) {
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

void ReactVideoView::Set_ProgressUpdateInterval(int64_t interval) {
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

void ReactVideoView::Set_AutoPlay(bool autoPlay) {
  m_player.AutoPlay(autoPlay);
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
  m_fullScreen = fullScreen;
  IsFullWindow(m_fullScreen);

  if (m_fullScreen) {
    Set_Controls(true); // full window will always have transport control enabled
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

void ReactVideoView::Set_PlaybackRate(double rate) {
  if (m_player != nullptr) {
    m_player.PlaybackSession().PlaybackRate(rate);
  }
}

bool ReactVideoView::IsPlaying(MediaPlaybackState currentState) {
  return (
      currentState == MediaPlaybackState::Buffering || currentState == MediaPlaybackState::Opening ||
      currentState == MediaPlaybackState::Playing);
}

void ReactVideoView::runOnQueue(std::function<void()> &&func) {
  m_uiDispatcher.RunAsync(
      winrt::Windows::UI::Core::CoreDispatcherPriority::Normal, [func = std::move(func)]() { func(); });
}

} // namespace winrt::ReactNativeVideoCPP::implementation
