# Ads

## IMA SDK
`react-native-video` has built-in support for Google IMA SDK for Android and iOS. To enable it please refer to [installation section](/installation)

### Usage
To use AVOD, you need to pass `adTagUrl` prop to `Video` component. `adTagUrl` is a VAST uri. 

Example:
```
adTagUrl="https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpostoptimizedpodbumper&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator="
```

> NOTE: Video ads cannot start when you are using the PIP on iOS (more info available at [Google IMA SDK Docs](https://developers.google.com/interactive-media-ads/docs/sdks/ios/client-side/picture_in_picture?hl=en#starting_ads)). If you are using custom controls, you must hide your PIP button when you receive the ```STARTED``` event from ```onReceiveAdEvent``` and show it again when you receive the ```ALL_ADS_COMPLETED``` event.

### Events
To receive events from IMA SDK, you need to pass `onReceiveAdEvent` prop to `Video` component. List of events, you can find [here](https://github.com/TheWidlarzGroup/react-native-video/blob/master/src/types/Ads.ts)

Example:

```jsx
...
onReceiveAdEvent={event => console.log(event)}
...
```
