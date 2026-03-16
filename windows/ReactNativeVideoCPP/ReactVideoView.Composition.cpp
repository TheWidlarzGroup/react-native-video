#include "pch.h"
#include "ReactVideoView.Composition.h"
#include "ReactVideoViewComposition.g.cpp"
#include "NativeModules.h"

using namespace winrt;
using namespace Windows::Foundation;
using namespace Windows::Foundation::Collections;
using namespace Windows::Media::Core;
using namespace Windows::Media::Playback;
using namespace Windows::UI::Composition;
using namespace Windows::System::Threading;

namespace winrt::ReactNativeVideoCPP::implementation {

ReactVideoViewComposition::ReactVideoViewComposition(
    winrt::Microsoft::ReactNative::IReactContext const& reactContext)
    : m_reactContext(reactContext)
    , m_player(MediaPlayer())
{
    // Get the compositor - for Win32 apps we need to create one
    // In a real implementation, this should come from the react-native-windows composition context
    m_compositor = Compositor();
    
    // Create the visual that will display the video
    m_visual = m_compositor.CreateSpriteVisual();
    m_visual.Size({ m_width, m_height });
    
    // Set up the media player surface
    UpdateSurface();
    
    // Set up event handlers
    m_mediaOpenedToken = m_player.MediaOpened(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->OnMediaOpened(sender, args);
            }
        });

    m_mediaFailedToken = m_player.MediaFailed(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->OnMediaFailed(sender, args);
            }
        });

    m_mediaEndedToken = m_player.MediaEnded(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->OnMediaEnded(sender, args);
            }
        });

    m_bufferingStartedToken = m_player.PlaybackSession().BufferingStarted(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->OnBufferingStarted(sender, args);
            }
        });

    m_bufferingEndedToken = m_player.PlaybackSession().BufferingEnded(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->OnBufferingEnded(sender, args);
            }
        });

    m_seekCompletedToken = m_player.PlaybackSession().SeekCompleted(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->OnSeekCompleted(sender, args);
            }
        });

    m_positionChangedToken = m_player.PlaybackSession().PositionChanged(
        winrt::auto_revoke, 
        [ref = get_weak()](auto const& sender, auto const& args) {
            if (auto self = ref.get()) {
                self->m_mediaPlayerPosition = sender.Position().count();
            }
        });

    // Set up progress timer
    m_progressTimer = ThreadPoolTimer::CreatePeriodicTimer(
        [ref = get_weak()](ThreadPoolTimer const&) {
            if (auto self = ref.get()) {
                self->OnProgressTimer();
            }
        },
        std::chrono::milliseconds(m_progressInterval));
}

ReactVideoViewComposition::~ReactVideoViewComposition() {
    if (m_progressTimer) {
        m_progressTimer.Cancel();
    }
}

void ReactVideoViewComposition::UpdateSurface() {
    if (!m_player || !m_compositor) {
        return;
    }

    // Set the surface size before getting the surface
    m_player.SetSurfaceSize({ m_width, m_height });
    
    // Get a composition surface from the media player
    m_surface = m_player.GetSurface(m_compositor);
    
    // Create a brush from the surface
    m_brush = m_compositor.CreateSurfaceBrush(m_surface.CompositionSurface());
    m_brush.Stretch(CompositionStretch::UniformToFill);
    
    // Apply the brush to the visual
    m_visual.Brush(m_brush);
}

winrt::Windows::Foundation::IInspectable ReactVideoViewComposition::CompositionVisual() {
    return m_visual;
}

void ReactVideoViewComposition::SetUriString(hstring const& value) {
    m_uriString = value;
    if (m_player != nullptr && !m_uriString.empty()) {
        auto uri = Uri(m_uriString);
        m_player.Source(MediaSource::CreateFromUri(uri));
    }
}

void ReactVideoViewComposition::SetIsLoopingEnabled(bool value) {
    m_isLoopingEnabled = value;
    if (m_player != nullptr) {
        m_player.IsLoopingEnabled(m_isLoopingEnabled);
    }
}

void ReactVideoViewComposition::SetPaused(bool value) {
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

void ReactVideoViewComposition::SetMuted(bool isMuted) {
    m_isMuted = isMuted;
    if (m_player != nullptr) {
        m_player.IsMuted(m_isMuted);
    }
}

void ReactVideoViewComposition::SetVolume(double volume) {
    m_volume = volume;
    if (m_player != nullptr) {
        m_player.Volume(m_volume);
    }
}

void ReactVideoViewComposition::SetPosition(double position) {
    m_position = position;
    if (m_player != nullptr) {
        std::chrono::seconds duration(static_cast<int>(m_position));
        m_player.PlaybackSession().Position(duration);
    }
}

void ReactVideoViewComposition::SetProgressUpdateInterval(int64_t interval) {
    m_progressInterval = interval;
    if (m_progressTimer) {
        m_progressTimer.Cancel();
    }
    m_progressTimer = ThreadPoolTimer::CreatePeriodicTimer(
        [ref = get_weak()](ThreadPoolTimer const&) {
            if (auto self = ref.get()) {
                self->OnProgressTimer();
            }
        },
        std::chrono::milliseconds(m_progressInterval));
}

void ReactVideoViewComposition::SetAutoPlay(bool autoPlay) {
    if (m_player) {
        m_player.AutoPlay(autoPlay);
    }
}

void ReactVideoViewComposition::SetPlaybackRate(double rate) {
    if (m_player != nullptr) {
        m_player.PlaybackSession().PlaybackRate(rate);
    }
}

void ReactVideoViewComposition::SetSize(float width, float height) {
    m_width = width;
    m_height = height;
    if (m_visual) {
        m_visual.Size({ width, height });
    }
    UpdateSurface();
}

bool ReactVideoViewComposition::IsPlaying(MediaPlaybackState currentState) {
    return (currentState == MediaPlaybackState::Buffering || 
            currentState == MediaPlaybackState::Opening ||
            currentState == MediaPlaybackState::Playing);
}

void ReactVideoViewComposition::OnMediaOpened(IInspectable const&, IInspectable const&) {
    if (auto mediaPlayer = m_player) {
        auto width = mediaPlayer.PlaybackSession().NaturalVideoWidth();
        auto height = mediaPlayer.PlaybackSession().NaturalVideoHeight();
        auto orientation = (width > height) ? L"landscape" : L"portrait";
        auto durationInSeconds = mediaPlayer.PlaybackSession().NaturalDuration().count() / 10000000;
        auto currentTimeInSeconds = mediaPlayer.PlaybackSession().Position().count() / 10000000;

        DispatchEvent(L"topVideoLoad", 
            [&](winrt::Microsoft::ReactNative::IJSValueWriter const& eventDataWriter) noexcept {
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

void ReactVideoViewComposition::OnMediaFailed(
    Windows::Media::Playback::MediaPlayer const&, 
    Windows::Media::Playback::MediaPlayerFailedEventArgs const&) {
    DispatchEvent(L"topVideoError", nullptr);
}

void ReactVideoViewComposition::OnMediaEnded(IInspectable const&, IInspectable const&) {
    DispatchEvent(L"topVideoEnd", nullptr);
}

void ReactVideoViewComposition::OnBufferingStarted(IInspectable const&, IInspectable const&) {
    // Can add buffering event if needed
}

void ReactVideoViewComposition::OnBufferingEnded(IInspectable const&, IInspectable const&) {
    // Can add buffering ended event if needed
}

void ReactVideoViewComposition::OnSeekCompleted(IInspectable const&, IInspectable const&) {
    if (auto mediaPlayer = m_player) {
        auto currentTimeInSeconds = mediaPlayer.PlaybackSession().Position().count() / 10000000;
        auto seekTimeInSeconds = m_mediaPlayerPosition / 10000000;

        DispatchEvent(L"topVideoSeek",
            [&](winrt::Microsoft::ReactNative::IJSValueWriter const& eventDataWriter) noexcept {
                eventDataWriter.WriteObjectBegin();
                {
                    WriteProperty(eventDataWriter, L"currentTime", currentTimeInSeconds);
                    WriteProperty(eventDataWriter, L"seekTime", seekTimeInSeconds);
                }
                eventDataWriter.WriteObjectEnd();
            });
    }
}

void ReactVideoViewComposition::OnProgressTimer() {
    if (auto mediaPlayer = m_player) {
        if (mediaPlayer.PlaybackSession().PlaybackState() == MediaPlaybackState::Playing) {
            auto currentTimeInSeconds = mediaPlayer.PlaybackSession().Position().count() / 10000000;
            DispatchEvent(L"topVideoProgress",
                [&](winrt::Microsoft::ReactNative::IJSValueWriter const& eventDataWriter) noexcept {
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

void ReactVideoViewComposition::DispatchEvent(
    hstring const& eventName,
    std::function<void(winrt::Microsoft::ReactNative::IJSValueWriter const&)> const& writer) {
    // For composition views, we need a different way to dispatch events
    // This is a placeholder - the actual implementation depends on how the view is integrated
    // with the react-native-windows Fabric component system
}

} // namespace winrt::ReactNativeVideoCPP::implementation
