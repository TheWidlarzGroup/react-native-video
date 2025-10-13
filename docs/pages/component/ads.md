# Ads

## IMA SDK

`react-native-video` includes built-in support for Google IMA SDK on Android and iOS. To enable it, refer to the [installation section](/installation).

The IMA SDK supports two types of ad insertion:

1. **Client-Side Ad Insertion (CSAI)** – Ads are inserted client-side using VAST tags
2. **Dynamic Ad Insertion (DAI)** – Server-side ad insertion where ads are stitched into the stream

---

## Client-Side Ad Insertion (CSAI)

CSAI inserts ads client-side using VAST (Video Ad Serving Template) tags. Ads are requested and played during video playback, with the player handling ad breaks and transitions.

### Usage

To use CSAI, pass the `adTagUrl` prop to the `Video` component. The `adTagUrl` should be a VAST-compliant URI.

#### Example:

```jsx
<Video
  source={{
    uri: 'https://example.com/video.mp4',
    ad: {
      adTagUrl: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator='
    }
  }}
/>
```

> **Note:** Video ads cannot start when Picture-in-Picture (PiP) mode is active on iOS. More details are available in the [Google IMA SDK Docs](https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side/picture_in_picture?hl=en#starting_ads). If you are using custom controls, hide the PiP button when receiving the `STARTED` event from `onReceiveAdEvent` and show it again when receiving the `ALL_ADS_COMPLETED` event.

### Events

To receive events from the IMA SDK, pass the `onReceiveAdEvent` prop to the `Video` component. The full list of supported events is available [here](https://github.com/TheWidlarzGroup/react-native-video/blob/master/src/types/Ads.ts).

#### Example:

```jsx
<Video
  onReceiveAdEvent={event => console.log(event)}
  // ... other props
/>
```

### Localization

To change the language of the IMA SDK, pass the `adLanguage` prop within the `ad` configuration. The list of supported languages is available [here](https://developers.google.com/interactive-media-ads/docs/sdks/android/client-side/localization#locale-codes).

- By default, **iOS** uses the system language, and **Android** defaults to `en` (English).

#### Example:

```jsx
<Video
  source={{
    uri: 'https://example.com/video.mp4',
    ad: {
      adTagUrl: 'https://example.com/adtag',
      adLanguage: 'fr'
    }
  }}
/>
```

---

## Dynamic Ad Insertion (DAI)

DAI (Dynamic Ad Insertion) is a server-side ad insertion solution where ads are stitched into the video stream before it reaches the player. This provides a seamless viewing experience with no playback interruptions, as the stream appears as a single continuous video.

DAI is ideal for:
- Live streaming with ad breaks
- VOD content with dynamic ad insertion
- Scenarios where you want a seamless, uninterrupted viewing experience

### Usage

To use DAI, configure the `dai` property within the `source` prop. DAI supports both Video On Demand (VOD) and Live streaming.

#### VOD Example:

```jsx
<Video
  source={{
    dai: {
      contentSourceId: '2548831',
      videoId: 'tears-of-steel',
      adTagParameters: {
        'custom_param': 'value'
      },
      backupStreamUri: 'https://example.com/backup-stream.m3u8'
    }
  }}
/>
```

#### Live Example:

```jsx
<Video
  source={{
    dai: {
      assetKey: 'c-rArva4ShKVIAkNfy6HUQ',
      adTagParameters: {
        'custom_param': 'value'
      },
      backupStreamUri: 'https://example.com/backup-stream.m3u8'
    }
  }}
/>
```

### Configuration

For VOD streams, you must provide:
- `contentSourceId` – The content source ID
- `videoId` – The video ID

For Live streams, you must provide:
- `assetKey` – The asset key for the live stream

Optional properties:
- `adTagParameters` – Custom key-value pairs to pass as ad tag parameters to the IMA SDK. For a list of supported Ad Manager ad tag parameters, see the [Google Ad Manager documentation](https://support.google.com/admanager/answer/7320899?hl=en#npa).
- `backupStreamUri` – Fallback stream URI. If the DAI stream fails to load, the player will automatically fall back to this URI

### Events

DAI uses the same `onReceiveAdEvent` prop as CSAI to report ad-related events. The full list of supported events is available [here](https://github.com/TheWidlarzGroup/react-native-video/blob/master/src/types/Ads.ts).

#### Example:

```jsx
<Video
  source={{
    dai: {
      contentSourceId: '2548831',
      videoId: 'tears-of-steel'
    }
  }}
  onReceiveAdEvent={event => console.log(event)}
  // ... other props
/>

For more details on DAI configuration properties, see the [props documentation](/component/props#dai).
```

### Backup Stream

If the DAI stream fails to load and a `backupStreamUri` is provided, the player will automatically fall back to the backup stream. This ensures playback continuity even when DAI services are unavailable.

### Example App

For testing and experimenting with DAI, you can use the `expo-dai` example app located in the `examples/expo-dai` directory. This example app demonstrates DAI functionality for both VOD and Live streaming scenarios.

### Differences from CSAI

| Feature                | CSAI                                  | DAI                                    |
|------------------------|---------------------------------------|----------------------------------------|
| Ad insertion           | Client-side                           | Server-side                            |
| Playback interruptions | Possible during ad breaks             | Seamless, no interruptions             |
| Stream format          | Original video + separate ad requests | Single unified stream with ads         |
| Use case               | VOD with pre-defined ad breaks        | Live and VOD with dynamic ad insertion |
| Configuration          | `source.ad.adTagUrl`                  | `source.dai` with content identifiers  |

---

## Known Issues

### Android Emulator Video Scaling

Running HLS streams (including DAI) on Android emulator can sometimes cause video scaling issues. To fix this, use an Android real device for testing.

For more details, see [GitHub issue #3599](https://github.com/TheWidlarzGroup/react-native-video/issues/3599).

### Controls UI Overlap with Ad UI

When using the default `controls={true}` prop, the ad UI (timing, learn more) can overlap with the controls UI. To fix this, listen to ad events and display controls conditionally, or use custom controls.
