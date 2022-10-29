# Advanced debuging and common issues

### HTTP playback doesn't work or  Black Screen on Release build (Android)
If your video work on Debug mode, but on Release you see only black screen, please, check the link to your video. If you use 'http' protocol there, you will need to add next string to your AndroidManifest.xml file. [Details here](https://developer.android.com/guide/topics/manifest/application-element#usesCleartextTraffic)

```
<application
 ...
 android:usesCleartextTraffic="true"
>
```

### Decoder Issue (Android)

Devices have a maximum of simulataneous possible playback. It means you have reach this limit. Exoplayer returns: 'Unable to instantiate decoder'

**known issue**: This issue happen really often in debug mode.

## You cannot play clean content (all OS)

Here are the steps to consider before opening a ticket in issue tracker

### Check you can access to remote file

Ensure you can download to manifest / content file with a browser for exemple

### Check another player can read the content

Usually clear playback can be read with all Video player. Then you should ensure content can be played without any issue with another player ([VideoLan/VLC](https://www.videolan.org/vlc/) is a good reference implementation)

## You cannot play protected content (all OS)

### Protected content gives error (token error / access forbidden) 

If content is protected with an access token or any other http header, ensure you can access to you data with a wget call or a rest client app. You need to provide all needed access token / authentication parameters.

### Everything seems correct but content cannot be accessed

You need to record network trace to ensure communications with server is correct.
[Charles proxy](https://www.charlesproxy.com/) is a simple and usefull tool to sniff all http/https calls. 
With this tool you should be able to analyze what is going on with network. You will see all access to content and DRM, audio / vido chuncks, ...

Then try to compare exchanges with previous tests you made.

### It's still not working

You can try to open a ticket now !
