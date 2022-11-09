## react-native-video-inc-ads
an addon property (**adTagUrl**) to support google ima on react-native-video. 
Thanks to https://github.com/RobbyWH for his great work. I just merged his ima branch with latest react-native-video branch.

const adTagUrl = "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/"
+ "ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp"
+ "&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite"
+ "%26sample_ar%3Dpremidpost&cmsid=496&vid=short_onecue&correlator=";

In case of any issue, one can follow RobbyWH's comments on the issue : https://github.com/react-native-video/react-native-video/issues/488 :)

A new function property `onReceiveAdEvent` added. this is used to notify ad events from native component to react component. 

## react-native-video

> :warning: **Version 6 Alpha**: The following documentation may refer to features only available through the v6.0.0 alpha releases, [please see version 5.2.x](https://github.com/react-native-video/react-native-video/blob/v5.2.0/README.md) for the current documentation!

## A `<Video>` component for react-native.
Version 6.x recommends react-native >= 0.68.2. 
<br>For older versions of react-native, [please use version 5.x](https://github.com/react-native-video/react-native-video/tree/v5.2.0).

### Version 6.0.0 breaking changes

Version 6.0.0 is introducing dozens of breaking changes, mostly through updated dependecies and significant refactoring. While the API remains compatible, the significant internal changes require full testing with your app to ensure all functionality remains operational. Please view the [Changelog](CHANGELOG.md) for specific breaking changes.

### Installing Version 6.0.0 Alphas
Whilst we finalise version 6.0.0 you can install the latest alpha from npm
Using npm:
```
npm install --save react-native-video@alpha
```
using yarn:
```
yarn add react-native-video@alpha
```

## Useful resources
- [Documentation](API.md)
- [Changelog](CHANGELOG.md)
- [Contribution guide](CONTRIBUTING.md)
- [Usefull Side Project](./docs/PROJECTS.md)
- [Advanced debugging](./docs/DEBUGGING.md)

**react-native-video** was originally created by [Brent Vatne](https://github.com/brentvatne)
