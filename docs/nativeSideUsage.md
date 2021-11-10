# Native side usage

## iOS

You will need to set a delegate for RNVideo's player.

Create a MyVideoPlayerDelegate.swift (works only in equivalent objective-c code) file in your project :

```swift
import AVFoundation

@objc(MyVideoPlayerDelegate)
class MyVideoPlayerDelegate : NSObject, RCTVideoPlayerDelegate {
  func playerDidAppear(_ player: AVPlayer!) {
    // do something when player is mounted
  }

  func playerDidDisappear() {
    // do something when player is unmounted
  }
}
```

In AppDelegate.m:

```obj-c
#import "RCTVideoPlayerViewController.h"

...

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    MyVideoPlayerDelegate *myVideoPlayerDelegate = [[MyVideoPlayerDelegate alloc] init];
    RCTVideoPlayerViewController.videoPlayerDelegate = myVideoPlayerDelegate;
```
