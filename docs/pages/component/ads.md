# Ads

## IMA SDK

`react-native-video` includes built-in support for Google IMA SDK on Android and iOS. To enable it, refer to the [installation section](/installation).

### Usage

To use AVOD (Ad-Supported Video on Demand), pass the `adTagUrl` prop to the `Video` component. The `adTagUrl` should be a VAST-compliant URI.

#### Example:

```jsx
adTagUrl="https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator="
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

To change the language of the IMA SDK, pass the `adLanguage` prop to the `Video` component. The list of supported languages is available [here](https://developers.google.com/interactive-media-ads/docs/sdks/android/client-side/localization#locale-codes).

- By default, **iOS** uses the system language, and **Android** defaults to `en` (English).

#### Example:

```jsx
...
adLanguage="fr"
...
```
