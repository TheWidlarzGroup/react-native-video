## react-native-video - ExoPlayer

This is an Android React Native video component based on ExoPlayer v2.

> ExoPlayer is an application level media player for Android. It provides an alternative to Android’s MediaPlayer API for playing audio and video both locally and over the Internet. ExoPlayer supports features not currently supported by Android’s MediaPlayer API, including DASH and SmoothStreaming adaptive playbacks. Unlike the MediaPlayer API, ExoPlayer is easy to customize and extend, and can be updated through Play Store application updates.

https://github.com/google/ExoPlayer

## Benefits over `react-native-video@0.9.0`:

- Android Video library built by Google, with a lot of support
- Supports DASH, HlS, & SmoothStreaming adaptive streams
- Supports formats such as MP4, M4A, FMP4, WebM, MKV, MP3, Ogg, WAV, MPEG-TS, MPEG-PS, FLV and ADTS (AAC).
- Fewer device specific issues
- Highly customisable

## ExoPlayer only props

```javascript

  render() {
    return (
      <Video
        ...
        disableFocus={true} // disables audio focus and wake lock (default false)
        onAudioBecomingNoisy={this.onAudioBecomingNoisy} // Callback when audio is becoming noisy - should pause video
        onAudioFocusChanged={this.onAudioFocusChanged} // Callback when audio focus has been lost - pause if focus has been lost
      />
    )
  }

  onAudioBecomingNoisy = () => {
    this.setState({ pause: true })
  }

  onAudioFocusChanged = (event: { hasAudioFocus: boolean }) => {
    if (!this.state.paused && !event.hasAudioFocus) {
      this.setState({ paused: true })
    }
  }
```

## Unimplemented props

- Expansion file - `source={{ mainVer: 1, patchVer: 0 }}`

