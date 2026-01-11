# Bloomberg Modifications to react-native-video

This document describes all Bloomberg-specific modifications made to the [react-native-video](https://github.com/TheWidlarzGroup/react-native-video) library. This fork is based on version **6.17.0** and includes custom features and patches required for Bloomberg's video streaming applications.

## Table of Contents

- [Overview](#overview)
- [Major Features](#major-features)
  - [DAI (Dynamic Ad Insertion)](#dai-dynamic-ad-insertion)
  - [iOS Notification Controls Enhancement](#ios-notification-controls-enhancement)
- [Platform-Specific Patches](#platform-specific-patches)
  - [iOS Patches](#ios-patches)
  - [Android Patches](#android-patches)
- [Contributors](#contributors)
- [Modified Files](#modified-files)
- [Future Maintenance](#future-maintenance)

---

## Overview

Bloomberg maintains this fork to add support for server-side ad insertion (DAI) using Google's IMA SDK and to implement several platform-specific enhancements for improved user experience. All Bloomberg modifications are marked with `BLOOMBERG` annotations in the source code for easy identification during upstream merges.

**Base Version**: react-native-video 6.17.0
**Branch**: `bb`

---

## Major Features

### DAI (Dynamic Ad Insertion)

**Purpose**: Enable server-side ad insertion for both VOD (Video on Demand) and Live streaming using Google's IMA (Interactive Media Ads) SDK.

**Implementation Date**: October 13, 2025
**Primary Contributor**: maciej.budzinski.93@bloomberg.net
**Commit**: 221aba3e

#### Key Capabilities

- **VOD Streaming**: Uses `contentSourceId` + `videoId` to identify content
- **Live Streaming**: Uses `assetKey` to identify live streams
- **Ad Tag Parameters**: Custom key-value pairs for ad targeting
- **Backup Stream Fallback**: Automatic fallback to backup URI if DAI fails
- **Time Conversion**: Converts between stream time (with ads) and content time (without ads)
- **Picture-in-Picture Support**: Full PiP support for DAI streams on iOS
- **Event System**: Comprehensive ad events (STREAM_LOADED, AD_BREAK_STARTED, AD_PERIOD_STARTED, etc.)

#### Usage Example

```typescript
// VOD DAI Stream
const source = {
  dai: {
    contentSourceId: 'your-content-source-id',
    videoId: 'your-video-id',
    adTagParameters: {
      customParam: 'value'
    },
    backupStreamUri: 'https://fallback-stream-url'
  }
};

// Live DAI Stream
const source = {
  dai: {
    assetKey: 'your-asset-key',
    adTagParameters: {
      customParam: 'value'
    }
  }
};
```

#### Implementation Details

**New Files Created**:
- `ios/Video/DataStructures/DaiParams.swift` - DAI configuration data structure
- `android/src/main/java/com/brentvatne/common/api/DaiProps.kt` - DAI properties for Android
- `android/src/main/java/androidx/media3/exoplayer/ima/ImaServerSideAdInsertionMediaSource.java` - IMA media source wrapper
- `android/src/main/java/androidx/media3/exoplayer/ima/ImaServerSideAdInsertionUriBuilder.java` - URI builder for DAI streams

**Modified Files**:
- iOS: `RCTVideo.swift`, `RCTIMAAdsManager.swift`
- Android: `ReactExoplayerView.java`
- TypeScript: `types/video.ts`, `types/Ads.ts`, `specs/VideoNativeComponent.ts`, `Video.tsx`

#### Additional Enhancements

**Time Conversion** (December 8, 2025, commit 31662217):
- Added `convertStreamTimeToContentTime()` and `convertContentTimeToStreamTime()` methods
- Ensures accurate time reporting in `onVideoProgress`, `onVideoSeek`, and `onVideoLoad` events
- Critical for proper playback controls when ads are present

---

### iOS Notification Controls Enhancement

**Purpose**: Improve integration between DAI streams and iOS notification controls (lock screen, Dynamic Island).

**Implementation Date**: December 21, 2025
**Contributor**: clopez32@bloomberg.net
**Ticket**: ENG4BCMA-5842
**Commit**: bf58615f

#### Key Improvements

1. **Audio Session Management**
   - Prevents the library from hijacking the audio session from other apps when just opening the app
   - Only takes exclusive audio control when actually playing with notification controls enabled
   - Allows other apps to continue playing audio until the user presses play

2. **Picture-in-Picture Behavior**
   - Disables automatic PiP when backgrounding to allow Now Playing controls to show in Dynamic Island
   - Conditional PiP initialization - only initializes when `enterPictureInPictureOnLeave` is enabled

3. **Metadata Propagation**
   - Ensures metadata is properly propagated to player items for DAI streams
   - Enables artwork display in lock screen and Dynamic Island controls

4. **Now Playing Info Refresh**
   - Refreshes Now Playing info after returning from Picture-in-Picture
   - Re-establishes artwork in Dynamic Island

**Files Modified**:
- `ios/Video/RCTVideo.swift` - Metadata propagation, PiP initialization, Now Playing refresh
- `ios/Video/AudioSessionManager.swift` - Audio session hijacking prevention
- `ios/Video/Features/RCTPictureInPicture.swift` - Disable automatic PiP

---

## Platform-Specific Patches

### iOS Patches

#### 1. Transparent Video Background (ENG4BCMA-5034)

**Purpose**: Make AVPlayerViewController background transparent to match Android behavior

**Implementation**: Sets `viewController.view.backgroundColor = .clear` to allow app background color to show through

**File**: `ios/Video/RCTVideo.swift`

---

#### 2. Nil Safety in applyModifiers

**Purpose**: Prevent hang when currentItem is nil or not ready

**Implementation**: Added guard check `if _player?.currentItem?.status != AVPlayerItem.Status.readyToPlay`

**File**: `ios/Video/RCTVideo.swift`

---

### Android Patches

#### 1. Accurate Bitrate Reporting

**Purpose**: Use indicated bitrate instead of observed bitrate for accurate reporting

**Details**: The default "bitrate" argument represents video download speed, not the actual video bitrate. This patch uses `videoFormat.bitrate` (indicated bitrate) instead.

**File**: `android/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java`

**Related PRs**:
- https://github.com/BloombergMedia/horseshoe/pull/4027
- https://github.com/BloombergMedia/horseshoe/pull/6013

---

#### 2. Always Hide Live Badge (ENG4BCMA-0000)

**Purpose**: Hide the live badge due to positioning issues

**Implementation Date**: December 11, 2025
**Contributor**: krasnobaev@gmail.com
**Commit**: 7ec18046

**File**: `android/src/main/java/com/brentvatne/exoplayer/ExoPlayerView.kt`

**Related Issue**: https://github.com/TheWidlarzGroup/react-native-video/issues/4623#issuecomment-3218156762

---

#### 3. Lint Error Fixes

**Purpose**: Prevent lint issues in `react-native-video:lintDebug`

**Changes**:
- Added `@WorkerThread` annotations to `getVideoTrackInfoFromManifest()` methods
- Extracted UIManager type conditional into a variable to avoid lint errors

**Files**:
- `android/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java`
- `android/src/main/java/com/brentvatne/react/VideoManagerModule.kt`

---

#### 4. Prevent Duplicate onVideoEnd Events

**Purpose**: Prevent `onVideoEnd` callback from being called multiple times on prop changes

**Details**: This patch ensures that the `onVideoEnd` event is only emitted once when the video actually ends, preventing duplicate callbacks that can occur during prop changes or state transitions.

**File**: `android/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java`

---

## Contributors

- **maciej.budzinski.93@bloomberg.net** - Primary DAI implementation, time conversion enhancements, legacy patches
- **krasnobaev@gmail.com** - Android live badge fix, duplicate onVideoEnd fix
- **clopez32@bloomberg.net** - iOS notification controls on DAI path, code annotations

---

## Modified Files

### Bloomberg-Only Files (4 files)

These files were created entirely by Bloomberg and do not exist in upstream:

1. `android/src/main/java/com/brentvatne/common/api/DaiProps.kt`
2. `android/src/main/java/androidx/media3/exoplayer/ima/ImaServerSideAdInsertionMediaSource.java`
3. `android/src/main/java/androidx/media3/exoplayer/ima/ImaServerSideAdInsertionUriBuilder.java`
4. `ios/Video/DataStructures/DaiParams.swift`

### Modified iOS Files (4 files)

1. `ios/Video/RCTVideo.swift` - ~270 lines of Bloomberg changes
   - Conditional PiP initialization
   - Nil safety in applyModifiers
   - Transparent background
   - Metadata propagation for DAI
   - Now Playing refresh
   - Complete DAI integration (~210 lines)

2. `ios/Video/Features/RCTIMAAdsManager.swift` - ~210 lines of DAI functionality
   - DAI properties (stream manager, ad container, PiP proxy)
   - setupDaiLoader() method
   - requestDaiStream() for VOD and Live
   - Time conversion methods
   - DAI stream lifecycle event handlers

3. `ios/Video/AudioSessionManager.swift` - Audio session management
   - isAudioSessionManagementForcedDisabled property
   - Audio hijacking prevention logic
   - Exclusive audio control logic

4. `ios/Video/Features/RCTPictureInPicture.swift` - PiP behavior
   - Disable automatic PiP for Now Playing controls

### Modified Android Files (3 files)

1. `android/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java` - ~250 lines of Bloomberg changes
   - Bandwidth reporting fix
   - @WorkerThread annotations
   - Duplicate onVideoEnd prevention
   - Complete DAI integration (~218 lines):
     - isDaiRequest() - Validate DAI source
     - createAdsLoader() - Create IMA server-side ads loader
     - createDaiMediaSourceFactory() - Set up DAI media source factory
     - initializeDaiSource() - Initialize player for DAI
     - requestDaiStream() - Request DAI stream with URI builder
     - handleDaiBackupStream() - Fallback to backup stream on error

2. `android/src/main/java/com/brentvatne/exoplayer/ExoPlayerView.kt`
   - Always hide live badge

3. `android/src/main/java/com/brentvatne/react/VideoManagerModule.kt`
   - UIManager type handling to avoid lint errors

### Modified TypeScript Files (4 files)

1. `src/types/video.ts`
   - DaiConfig type definitions (DaiConfigLive, DaiConfigVod, DaiConfigShared)
   - dai property in ReactVideoSourceProperties

2. `src/types/Ads.ts`
   - DAI-specific AdEvent enum values (AD_BREAK_STARTED, AD_BREAK_ENDED, AD_PERIOD_STARTED, AD_PERIOD_ENDED, STREAM_LOADED, CUEPOINTS_CHANGED)

3. `src/specs/VideoNativeComponent.ts`
   - DaiConfig type for native bridge

4. `src/Video.tsx`
   - DAI config extraction and pass-through to native component
   - Allow loading sources with DAI config but no URI

---

## Future Maintenance

### Identifying Bloomberg Code

All Bloomberg modifications are marked with annotations:

- **Top comments**: Bloomberg-only files have `// BLOOMBERG: [description]` at the top
- **Block markers**: Bloomberg sections in upstream files use:
  ```
  // BLOOMBERG BEGIN
  // Purpose: [explanation]
  [code]
  // BLOOMBERG END
  ```
- **Inline comments**: Small changes use `// BLOOMBERG: [explanation]`

### Upgrading to Newer Versions

When merging upstream changes:

1. Search for all `BLOOMBERG BEGIN` markers to identify custom code
2. Review each annotated section to determine if it conflicts with upstream changes
3. Preserve all Bloomberg functionality during merge
4. Test DAI streaming (both VOD and Live)
5. Test iOS notification controls with DAI
6. Verify all Bloomberg-specific patches still work

### Critical Files to Review

When upgrading, pay special attention to:

1. `android/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java` - Most complex Android changes
2. `ios/Video/RCTVideo.swift` - Most complex iOS changes
3. `ios/Video/Features/RCTIMAAdsManager.swift` - Core DAI implementation
4. `src/types/video.ts` - Public API type definitions

### Testing Checklist

- [ ] VOD DAI streaming works
- [ ] Live DAI streaming works
- [ ] DAI backup stream fallback works
- [ ] Ad events are properly emitted
- [ ] iOS notification controls work with DAI
- [ ] PiP works with DAI on iOS
- [ ] Audio session doesn't hijack other apps on iOS
- [ ] Dynamic Island shows artwork correctly
- [ ] Time conversion is accurate (progress, seek)
- [ ] Bandwidth reporting is accurate on Android
- [ ] No duplicate onVideoEnd events on Android

---

## Summary

This fork adds comprehensive DAI support (~430 lines of DAI code across iOS and Android) and several platform-specific enhancements to improve user experience. All modifications are well-documented with inline annotations and can be easily identified for future maintenance.

**Total Modifications**: 15 files (4 new, 11 modified)
**Total Annotations**: 27+ BLOOMBERG BEGIN/END blocks
**Lines of Bloomberg Code**: ~700+ lines across all files
