---
sidebar_position: 5
title: Ads
description: React Native Video Ads Integration
---
# Ads

## IMA SDK

`react-native-video` includes built-in support for Google IMA SDK on Android and iOS. To enable it, refer to the [installation section](../installation.md).

### Usage

For client-side ads in v6.19, set `type: 'csai'` and `adTagUrl` in `source.ad`. The example below uses a VMAP playlist that schedules multiple ad breaks. To test a single ad, use a VAST tag URL instead.

#### Example:

```jsx
<Video
  source={{
    uri: contentUrl,
    ad: {
      type: 'csai',
      adTagUrl: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=',
    },
  }}
/>
```

> **Note:** Video ads cannot start when Picture-in-Picture (PiP) mode is active on iOS. More details are available in the [Google IMA SDK Docs](https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side/picture_in_picture?hl=en#starting_ads). If you are using custom controls, hide the PiP button when receiving the `STARTED` event from `onReceiveAdEvent` and show it again when receiving the `ALL_ADS_COMPLETED` event.

### Events

To receive events from the IMA SDK, pass the `onReceiveAdEvent` prop to the `Video` component. The full list of supported events is available [here](https://github.com/TheWidlarzGroup/react-native-video/blob/master/src/types/Ads.ts).

#### Example:

```jsx
...
onReceiveAdEvent={event => console.log(event)}
...
```

### Localization

To change the language of the IMA SDK, set `adLanguage` in `source.ad`. The list of supported languages is available [here](https://developers.google.com/interactive-media-ads/docs/sdks/android/client-side/localization#locale-codes).

- By default, **iOS** uses the system language, and **Android** defaults to `en` (English).

#### Example:

```jsx
<Video source={{uri: contentUrl, ad: {type: 'csai', adTagUrl, adLanguage: 'fr'}}} />
```
