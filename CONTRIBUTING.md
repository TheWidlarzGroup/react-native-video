## Issues

* New issues are reviewed and if they require additional work will be marked with the [`triage needed`](https://github.com/react-native-video/react-native-video/labels/triage%20needed) label. This is an open call for help from the community to verify the issue and help categorize it. If an issue stays in this state for a long time, it will be closed unresolved.
* Once an issue has been reviewed it will be labeled with [`help wanted`](https://github.com/react-native-video/react-native-video/labels/help%20wanted) to indicate it is ready to be worked on. Please wait for this label before submitting a PR to avoid spending time on something that is likely to be rejected.

## Cleanup

* Given the history of this project, we are going to be more aggressive than usual in keeping things clean. We are working with limited resources and do not want to return to the 1000+ open issues state. This is not meant to be disrespectful or hostile. It is just a way to keep the limited resources we have focused. If your issue was closed prematurely, just chime in and engage!
* Issues and pull requests that become stale (60 days of inactivity) will be closed unless assigned and show progress.
* If the issue creator fails to provide additional information within a week when asked, we may close the issue to keep things tidy (but you can always comment back and we can reopen).

## Pull Requests

* Please open an issue before opening a PR to make sure the proposed change is wanted and is likely to be merged. We don't want you to waste your time!
* Pull requests require 1-3 approved reviews to be merged.
* The number of reviews depends on the complexity by adding up (max of 3):
    * `1` reviewer for each PR 
    * `1` if more than 3 files and/or 30 lines of code changed
    * `1` for each native platform code changes involved

For example, a single file JS code change requires 1 review while a 3 files iOS code change requires 3 reviews. As soon as the reviews show up as approved without any requested changes, the PR will be merged into the next milestone.

* Reviewers will be asked to assign a risk level when they are done from 1 (super safe) to 5 (super risky). A release with any risk level 4 or 5 will be published as a major version, otherwise as a patch or minor based on the changes. Prepare for some large version increments while we get more comfortable... (but remember versions are free).

* If you have time to help out, look for the [`review requested`](https://github.com/react-native-video/react-native-video/labels/review%20requested) label. It will have another numeric label with it (`1`, `2`, or `3` indicating how many more reviews are needed to merge).

## Releases

* Aim for a bi-weekly (every other week) release to flush out whatever was approved and merge. Most people use this with a lock file (and if you don't you are doing it wrong) and should not have any issues with new bugs showing up. This is already a high risk dependency which must be tested well before going into production. Let's take advantage of that and move faster.

Please do not harass people to review your pull request! You can tag those you feel have relevant experience but please don't abuse this as people will unfollow or mute the project if they are called too many times!
