# Miscellaneous

## iOS App Transport Security

By default, iOS only allows loading encrypted (`https`) URLs. If you need to load content from an unencrypted (`http`) source, you must modify your `Info.plist` file and add the following entry:

![App Transport Security](../../assets/AppTransportSecuritySetting.png)

For more details, check this [article](https://cocoacasts.com/how-to-add-app-transport-security-exception-domains).

## Audio Mixing

In future versions, `react-native-video` will include an Audio Manager for configuring how videos mix with other audio-playing apps.

On iOS, if you want to allow background music from other apps to continue playing over your video component, update your `AppDelegate.m` file:

### **AppDelegate.m**

```objective-c
#import <AVFoundation/AVFoundation.h>  // Import the AVFoundation framework

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  ...
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];  // Allow background audio
  ...
}
```

You can also use the [`ignoreSilentSwitch`](#ignoresilentswitch) prop.

## Android Expansion File Usage

Expansion files allow you to include assets exceeding the 100MB APK size limit without requiring an update every time you push a new version.

- Only supports `.mp4` files, and they **must not be compressed**.
- Example command to prevent compression:

```bash
zip -r -n .mp4 *.mp4 player.video.example.com
```

### Example Usage in Code:

```javascript
// Assuming "background.mp4" is included in your expansion file.
<Video 
  source={{uri: "background", mainVer: 1, patchVer: 0}} // Looks for "background.mp4" in the specified expansion version.
  resizeMode="cover"           // Fill the whole screen while maintaining aspect ratio.
  style={styles.backgroundVideo} 
/>
```

## Load Files with the React Native Asset System

The asset system introduced in RN `0.14` allows loading shared image resources across iOS and Android without modifying native code. As of RN `0.31`, the same applies to `.mp4` video assets on Android. From RN `0.33`, iOS support was added. Requires `react-native-video@0.9.0` or later.

### Example:

```javascript
<Video
  source={require('../assets/video/turntable.mp4')}
/>
```

## Play in Background on iOS

To allow audio playback in the background on iOS, set the audio session to `AVAudioSessionCategoryPlayback`. See the [Apple documentation](https://developer.apple.com/documentation/avfoundation/avaudiosession) for more details.

_(Note: There is an open ticket to [expose this as a prop](https://github.com/react-native-community/react-native-video/issues/310).)_
