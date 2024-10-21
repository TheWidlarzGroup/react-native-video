# Forked Repository: react-native-video

## Description
This repository is a fork of [react-native-video](https://github.com/react-native-video/react-native-video) repository. 

## Update Instructions
To sync this fork with the upstream repository, follow these steps:
1. Sync fork with the latest changes from the original repo
    - a. `git checkout master`
    - c. `git pull`
    - b. `git pull upstream` or `git merge [versionTag]`
    - d. `git push`
2. Update release branch with latest changes
    - a. `git checkout release`
    - b. `git pull`
    - b. `git checkout -b sync/v6.0.0-beta.5`
    - c. `git merge master`
    - d. Resolve conflicts
3. Create new PR targeting release branch
    - a. Name the PR `[v6.0.0 beta.8] Sync fork up to commit <commitHash>`
4. Review and merge PR into the `rekease` branch
5. Draft a new release on GitHub
6. Update GolfPass apps package.json use the new version tag

## Commit Instructions
- from the release branch create a feature branch
   - `git checkout -b "feature/appletv-descriptive-name"`
       - prefix with `[ios/appletv/android/androidtv]-decriptive-name`
- Prefix all commits with [iOS/AppleTV/Android/AndroidTV]

## Tech Debt
- Remove _fork from function names as it creates more work if we want to PR this to the react-native-video team.
   -  Add Fork comments above these functions instead

## Changes Introduced By Fork
- 10/21/2024: [Android] Fix toggling of player controls on TV and Ads

Old changes:
```
All platforms
- [Android/iOS] Show loading indicator while preparing Ads (and don't start the original video until pre-roll has finished)
- [Android/iOS] Add text that indicates if video is live ("Live")
    - Change width to accommodate difference in sizes between duration and live text
- [Android/iOS] Allow toggling of player controls while Ad is playing
    - [Android/iOS] Manually bring the controls on top of the IMA player to ensure visibility
    - [iOS] Don't hide overlay when ad starts playing (updateProgress)
- [Android/iOS] Don't play video until pre-roll has been fetched and initialized)
- [Android/iOS] Fix react children not rendering in the native player

Android:
- [Android] Add overscan (disabled in sync branch)
- [Android] Add video title to controller overlay (disabled in sync branch) 
- [Android] remote button focus mapping (left -> seekbar) etc.
    - Display controls when various remote buttons are pressed
    - Back button should close controller overlay. If overlay is not visible, bubble the event so that the player is closed
    - Android map skip buttons to work with seeking
- [Android] Only emit progress if it's not an Ad
- [Android] Adjust incremental value on the seek bar (timeBar.setKeyTimeIncrement)
- [Android] disable closed captions: `setRendererDisabled(C.TRACK_TYPE_VIDEO, true)` (not sure why?)
- [Android] Add selection colors to control buttons
- [Android] Add exo_settings button (not sure why)

iOS
- [iOS] Add custom controller overlay that is shown on top of the ads
    - This fixes rendering of the IMA ads when in fullscreen
    - Autohide the overlay after a few seconds
    - Allow toggling pause/play state for ads
- [iOS] Fix bug that prevents the final ad from playing when the video has reached the end
- [iOS] Fix race conditions causing the main video to play while the Ad is also playing

- [IOS] Fix bug where Ad continues playing in the background after the video is closed
- [iOS] Request Ads earlier (when handleReadyToPlay is triggered instead of sendProgressUpdate)
```

## README.md for the latest synced upstream
[Click here](/README.md) to visit the root README file of this repository.
