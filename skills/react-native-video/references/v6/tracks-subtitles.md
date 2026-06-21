# v6 — audio / text / video tracks & subtitles

In v6, track selection is via **props**, and available tracks arrive via events.

## Selecting tracks

```tsx
<Video
  source={{ uri }}
  selectedTextTrack={{ type: 'language', value: 'en' }}
  selectedAudioTrack={{ type: 'language', value: 'en' }}
  selectedVideoTrack={{ type: 'resolution', value: 720 }}
  onTextTracks={({ textTracks }) => {}}
  onAudioTracks={({ audioTracks }) => {}}
  onVideoTracks={({ videoTracks }) => {}}
/>
```

Selector `type` for **audio/text**: `'system' | 'disabled' | 'title' | 'language' | 'index'`. For **video** the set differs: `'auto' | 'disabled' | 'resolution' | 'index'`.

## External (sidecar) subtitles

```tsx
<Video
  source={{ uri }}
  textTracks={[
    { title: 'English', language: 'en', type: 'text/vtt', uri: 'https://example.com/en.vtt' },
  ]}
  subtitleStyle={{ fontSize: 16, paddingBottom: 24 }}
/>
```

> iOS sidecar subtitles are limited to `.vtt`. `subtitleStyle` `fontSize`/`paddingBottom` are Android-only (`opacity` works on both). Audio/text track events fire on both platforms; **video-track reporting/selection (`onVideoTracks` / `selectedVideoTrack`) is Android-only.**

> **v7 note:** selection moves to player methods (`getAvailableTextTracks()` / `selectTextTrack()`), external subs move into the `useVideoPlayer` config, and native audio/video-track switching is no longer in core. See `../v7/tracks-subtitles.md`.
