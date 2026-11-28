#pragma once

#include "ReactVideoViewComposition.g.h"
#include <functional>
#include <winrt/Windows.UI.Composition.h>
#include <winrt/Windows.Media.Playback.h>
#include <winrt/Windows.Media.Core.h>

namespace winrt::ReactNativeVideoCPP::implementation {

struct ReactVideoViewComposition : ReactVideoViewCompositionT<ReactVideoViewComposition> {
public:
    ReactVideoViewComposition(winrt::Microsoft::ReactNative::IReactContext const& reactContext);
    ~ReactVideoViewComposition();

    void SetUriString(hstring const& value);
    void SetIsLoopingEnabled(bool value);
    void SetPaused(bool isPaused);
    void SetMuted(bool isMuted);
    void SetVolume(double volume);
    void SetPosition(double position);
    void SetProgressUpdateInterval(int64_t interval);
    void SetAutoPlay(bool autoPlay);
    void SetPlaybackRate(double rate);
    void SetSize(float width, float height);

    // Returns IInspectable that can be cast to Windows::UI::Composition::Visual
    winrt::Windows::Foundation::IInspectable CompositionVisual();

private:
    hstring m_uriString;
    bool m_isLoopingEnabled = false;
    bool m_isPaused = true;
    bool m_isMuted = false;
    double m_volume = 1.0;
    double m_position = 0;
    double m_mediaPlayerPosition = 0;
    float m_width = 640.0f;
    float m_height = 480.0f;
    int64_t m_progressInterval = 250;

    Windows::Media::Playback::MediaPlayer m_player{ nullptr };
    Windows::UI::Composition::Compositor m_compositor{ nullptr };
    Windows::UI::Composition::SpriteVisual m_visual{ nullptr };
    Windows::UI::Composition::CompositionSurfaceBrush m_brush{ nullptr };
    Windows::Media::Playback::MediaPlayerSurface m_surface{ nullptr };

    Microsoft::ReactNative::IReactContext m_reactContext{ nullptr };

    Windows::Media::Playback::MediaPlayer::MediaOpened_revoker m_mediaOpenedToken{};
    Windows::Media::Playback::MediaPlayer::MediaFailed_revoker m_mediaFailedToken{};
    Windows::Media::Playback::MediaPlayer::MediaEnded_revoker m_mediaEndedToken{};
    Windows::Media::Playback::MediaPlaybackSession::BufferingStarted_revoker m_bufferingStartedToken{};
    Windows::Media::Playback::MediaPlaybackSession::BufferingEnded_revoker m_bufferingEndedToken{};
    Windows::Media::Playback::MediaPlaybackSession::SeekCompleted_revoker m_seekCompletedToken{};
    Windows::Media::Playback::MediaPlaybackSession::PositionChanged_revoker m_positionChangedToken{};

    Windows::System::Threading::ThreadPoolTimer m_progressTimer{ nullptr };

    bool IsPlaying(Windows::Media::Playback::MediaPlaybackState currentState);
    void OnMediaOpened(IInspectable const& sender, IInspectable const& args);
    void OnMediaFailed(Windows::Media::Playback::MediaPlayer const& sender, 
                       Windows::Media::Playback::MediaPlayerFailedEventArgs const& args);
    void OnMediaEnded(IInspectable const& sender, IInspectable const&);
    void OnBufferingStarted(IInspectable const& sender, IInspectable const&);
    void OnBufferingEnded(IInspectable const& sender, IInspectable const&);
    void OnSeekCompleted(IInspectable const& sender, IInspectable const&);
    void OnProgressTimer();

    void UpdateSurface();
    void DispatchEvent(hstring const& eventName, 
                       std::function<void(winrt::Microsoft::ReactNative::IJSValueWriter const&)> const& writer);
};

} // namespace winrt::ReactNativeVideoCPP::implementation

namespace winrt::ReactNativeVideoCPP::factory_implementation {
struct ReactVideoViewComposition : ReactVideoViewCompositionT<ReactVideoViewComposition, implementation::ReactVideoViewComposition> {};
} // namespace winrt::ReactNativeVideoCPP::factory_implementation
