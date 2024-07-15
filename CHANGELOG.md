

## [6.4.2](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.4.1...v6.4.2) (2024-07-15)


### Bug Fixes

* **android:** exit fullscreen mode after finishing video playback ([#3978](https://github.com/TheWidlarzGroup/react-native-video/issues/3978)) ([4b8d09e](https://github.com/TheWidlarzGroup/react-native-video/commit/4b8d09e61f79a319ba5816dd342b5c0fd02d6e07))
* **android:** fix android notification controller order ([#4002](https://github.com/TheWidlarzGroup/react-native-video/issues/4002)) ([05623c9](https://github.com/TheWidlarzGroup/react-native-video/commit/05623c9f5447f67acb535487de8918210b5ffec7))
* **android:** fix onVideoLoad event field key ([#4001](https://github.com/TheWidlarzGroup/react-native-video/issues/4001)) ([f82268b](https://github.com/TheWidlarzGroup/react-native-video/commit/f82268be1bc33e5c61dbb031d7937197da0b67e5))
* **android:** handle aspect ratio for rotated videos ([#4000](https://github.com/TheWidlarzGroup/react-native-video/issues/4000)) ([0a55ace](https://github.com/TheWidlarzGroup/react-native-video/commit/0a55ace0ca92f56394235f7c651d3a160e6a3c90))
* **android:** resolve compatibility issue ([5cd5e5e](https://github.com/TheWidlarzGroup/react-native-video/commit/5cd5e5efe70b49d76fb27e3220a1df12b32901a6))
* **example/basic:** select resizeMode ([#3989](https://github.com/TheWidlarzGroup/react-native-video/issues/3989)) ([39cf477](https://github.com/TheWidlarzGroup/react-native-video/commit/39cf477ceb37c6ecc38cbdd9077a556c81fd9c3d))
* **ts:** make multiDrm prop optional type ([#3999](https://github.com/TheWidlarzGroup/react-native-video/issues/3999)) ([79c3076](https://github.com/TheWidlarzGroup/react-native-video/commit/79c30767fcf67e75e70ceb64a17736b5e3de63c6))

## [6.4.1](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.4.0...v6.4.1) (2024-07-12)


### Bug Fixes

* expo plugin export ([#3992](https://github.com/TheWidlarzGroup/react-native-video/issues/3992)) ([de8ade0](https://github.com/TheWidlarzGroup/react-native-video/commit/de8ade06202cfdb3dd7fec635b6e8c6cdfd04e47))

* fix(ios): remove pip check for other platforms (#3991) (40a72825)
* feat: add `isSeeking` to `onPlaybackStateChanged` (#3899) (111a5d21)
* chore(android): migrate DataSourceUtil to Kotlin (#3984) (b25e43ee)
* chore(android): migrate AspectRatioFrameLayout to Kotlin (#3985) (452e42f1)
* refactor: move view type and drm in source (#3867) (66dcf32b)
* feat: add expo plugins (#3933) (08f6caa6)
* docs: update deprecated tool (#3982) (25c74e05)
* chore(android): migrate DefaultReactExoplayerConfig to Kotlin (#3983) (1728373d)
* fix(ios): don't pause playback when entering background (#3973) (ccffcfd7)
* chore(example/basic): refactor state variable (#3949) (a3ecc010)
* feat(android): Bump default media3 version from v1.1.1 to v1.3.1 (#3977) :warning: need targetSdkVersion 34 (7562669f)
* feat: modified Fabric example android build.gradle for resolving build issue (#3976) (1d6fb297)
* chore: upgrade react-native & expo version in the basic example app (#3964) (01a00b12)
* refactor(android): migrate VideoEventEmitter to Kotlin (#3962) (3c9b1b57)
* fix(ios): fix fullscreen view controller ANR (#3952) (7def3ac3)
* chore(example/fabric): bump up fabric example android deps (#3957) (de6e7196)
* refactor(ios): refactor NowPlayingInfoCenerManager.swift (#3968) (76c63291)
* fix(android): build issue on the latest react-native version (#3963) (530686ca)
* feat(fabric): updated ios podspec for implementing new architecture (#3961) (df29c231)
* fix(android): fix wrong module name (#3959) (3f11894c)
* refactor(android): migrate ReactVideoPackage to Kotlin (#3955) (702a0d9d)
* refactor(android): migrate VideoDecoderPropertiesModule to Kotlin (#3954) (99585987)
* feat: bump up fabric example react-native iOS (#3951) (e5a2ee3b)
* fix(android): added setAllowChunklessPreparation to HlsMediaSource.Factory to allow build success on projects without HLS support (#3948) (#3950) (322d7e99)
* refactor: basic example from class component to functional component (#3934) (d4f16486)
* chore(android): rework view type (#3940) (b431d09e)
* chore: update homepage field in package.json (#3945) (6e133768)
* feat(android): allow building exoplayer from source (#3932) (a7d834a8)
* feat: add plugins management (#3909) (91d27a60)
* Chore(docs): fix typo (#3938) (3cfb96ad)

# [6.3.0](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.2.0...v6.3.0) (2024-06-22)


### Bug Fixes

* **android:** allow chunk less preparation ([#3913](https://github.com/TheWidlarzGroup/react-native-video/issues/3913)) ([264b57a](https://github.com/TheWidlarzGroup/react-native-video/commit/264b57aa2ed01b52c09b2992d5ca61e33871315b))
* **android:** avoid crash multiplayer with notification ([#3931](https://github.com/TheWidlarzGroup/react-native-video/issues/3931)) ([104ee70](https://github.com/TheWidlarzGroup/react-native-video/commit/104ee703bac0f7d5fb162d17c30f65f8071d07a6))
* **android:** show controls in notification on older androids ([#3886](https://github.com/TheWidlarzGroup/react-native-video/issues/3886)) ([098a754](https://github.com/TheWidlarzGroup/react-native-video/commit/098a754110a2c58fc18062769f4dd83775d20de4))
* **android:** use UI thread to pause when lost audio focus ([#3916](https://github.com/TheWidlarzGroup/react-native-video/issues/3916)) ([856b1dd](https://github.com/TheWidlarzGroup/react-native-video/commit/856b1dd58ba9bb1832397ee0fc86f778f737798f))
* **ios:** crash on ads after leaving the app ([#3911](https://github.com/TheWidlarzGroup/react-native-video/issues/3911)) ([3d6bc94](https://github.com/TheWidlarzGroup/react-native-video/commit/3d6bc9409c2111760620a821466b0ea0f1970681))
* **ios:** missing notification controls when enabled from start ([#3898](https://github.com/TheWidlarzGroup/react-native-video/issues/3898)) ([2d793db](https://github.com/TheWidlarzGroup/react-native-video/commit/2d793dbde16cc140d1e7b873c40ff4dec285e253))
* **JS:** safety check on resolve uri ([#3915](https://github.com/TheWidlarzGroup/react-native-video/issues/3915)) ([84bb910](https://github.com/TheWidlarzGroup/react-native-video/commit/84bb910d10e3e3d70f9e92b57c17de829d73218a))
* **typescript:** type checks on selectedTextTrack, selectedAudioTrack, selectedVideoTrack ([#3910](https://github.com/TheWidlarzGroup/react-native-video/issues/3910)) ([dc2a2ab](https://github.com/TheWidlarzGroup/react-native-video/commit/dc2a2ab863dc53fb2da1c2cea99e59e6d8387803))


### Features

* **android:** add `onControlsVisiblityChange` ([#3925](https://github.com/TheWidlarzGroup/react-native-video/issues/3925)) ([c2ce372](https://github.com/TheWidlarzGroup/react-native-video/commit/c2ce372bcf21e21b97878e7efe77780168d09a79))
* **ios:** add live key to now playing dict to decorate when livestream playing ([#3922](https://github.com/TheWidlarzGroup/react-native-video/issues/3922)) ([91751ab](https://github.com/TheWidlarzGroup/react-native-video/commit/91751abc870109e0a2667dfffbd2baa2e4cf997b))

# [6.2.0](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.1.2...v6.2.0) (2024-06-07)


### Bug Fixes

* **android:** allow notification tap to foreground app ([#3831](https://github.com/TheWidlarzGroup/react-native-video/issues/3831)) ([5c29b48](https://github.com/TheWidlarzGroup/react-native-video/commit/5c29b48747b4a30eb9911daa579baaa93402ba67))
* **android:** android cache header ([#3832](https://github.com/TheWidlarzGroup/react-native-video/issues/3832)) ([c2a1424](https://github.com/TheWidlarzGroup/react-native-video/commit/c2a14240ada24cd7c816bcb1ac942986eb855792))
* **android:** fix null pointer exception at playback start with item metadata ([#3879](https://github.com/TheWidlarzGroup/react-native-video/issues/3879)) ([c2cd752](https://github.com/TheWidlarzGroup/react-native-video/commit/c2cd7529fd9c9a3c8b1ae7b87d0b80e822ca400d))
* **android:** optimize lag on old android ([#3860](https://github.com/TheWidlarzGroup/react-native-video/issues/3860)) ([c2ce66e](https://github.com/TheWidlarzGroup/react-native-video/commit/c2ce66ed26efb975335ee7b229744a9957b0621e))
* **android:** refactor source, fix random DRM issue and crop start on local asset ([#3835](https://github.com/TheWidlarzGroup/react-native-video/issues/3835)) ([bdf3e55](https://github.com/TheWidlarzGroup/react-native-video/commit/bdf3e556d802caa426d098d3f5fffe00dfb96660))
* **android:** video resolution orientation android ([#3862](https://github.com/TheWidlarzGroup/react-native-video/issues/3862)) ([b698b18](https://github.com/TheWidlarzGroup/react-native-video/commit/b698b1837b71f2c93d488c521eb363e236e41aa5))
* ensure progress is sent before `onEnd` callback ([#3872](https://github.com/TheWidlarzGroup/react-native-video/issues/3872)) ([7133c96](https://github.com/TheWidlarzGroup/react-native-video/commit/7133c96cac905f06f7a9bccd21eeb2f7a8a27c06))
* ensure view drop stop playback startup ([#3875](https://github.com/TheWidlarzGroup/react-native-video/issues/3875)) ([ff1e24a](https://github.com/TheWidlarzGroup/react-native-video/commit/ff1e24aaad179656af71443b3db3b9817a98eb92))
* **ios:** don't crash app if view wasn't found ([#3841](https://github.com/TheWidlarzGroup/react-native-video/issues/3841)) ([cd28d37](https://github.com/TheWidlarzGroup/react-native-video/commit/cd28d370d27571b6f42b68e506b0bd1eaa9c770c))
* **ios:** fix notification controls enabled by default ([#3861](https://github.com/TheWidlarzGroup/react-native-video/issues/3861)) ([5c6dfb2](https://github.com/TheWidlarzGroup/react-native-video/commit/5c6dfb26c56c2b9165b25a01b9224c489e2fd2a5))
* **ios:** fix playback status with lifecycle ([#3819](https://github.com/TheWidlarzGroup/react-native-video/issues/3819)) ([1b51c15](https://github.com/TheWidlarzGroup/react-native-video/commit/1b51c1534881216f9975834657e8add1e7fe9621))
* **ios:** Implicit use of 'self' in closure - use 'self.' to make capture semantics explicit ([#3764](https://github.com/TheWidlarzGroup/react-native-video/issues/3764)) ([#3881](https://github.com/TheWidlarzGroup/react-native-video/issues/3881)) ([ac0a9c3](https://github.com/TheWidlarzGroup/react-native-video/commit/ac0a9c3e3a4fec474a963207a343765d1776406d)), closes [#3875](https://github.com/TheWidlarzGroup/react-native-video/issues/3875)


### Features

* add getCurrentPosition to component's ref ([#3824](https://github.com/TheWidlarzGroup/react-native-video/issues/3824)) ([c7f4d7b](https://github.com/TheWidlarzGroup/react-native-video/commit/c7f4d7b83bd09178f945d21e1f252a57ee1c8ab1))
* **android:** allow chunckless preparation ([#3882](https://github.com/TheWidlarzGroup/react-native-video/issues/3882)) ([d4a8c24](https://github.com/TheWidlarzGroup/react-native-video/commit/d4a8c24f65eda5f3ce17263b234e47b667947e08))
* **android:** Change subtitleLayout from child to sibling of layout ([#3830](https://github.com/TheWidlarzGroup/react-native-video/issues/3830)) ([c2cc917](https://github.com/TheWidlarzGroup/react-native-video/commit/c2cc91736852ea8b128e63bee71979d64b805c91))
* **android:** handle increment forward and rewind buttons ([#3818](https://github.com/TheWidlarzGroup/react-native-video/issues/3818)) ([5059e7a](https://github.com/TheWidlarzGroup/react-native-video/commit/5059e7a7f122447a1762249429d5fe289cbb0a4d))

## [6.1.2](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.1.1...v6.1.2) (2024-05-23)


### Bug Fixes

* **android:** revert previous fix not compatible with old java version ([#3828](https://github.com/TheWidlarzGroup/react-native-video/issues/3828)) ([69bde44](https://github.com/TheWidlarzGroup/react-native-video/commit/69bde447b825507533627c7b7d931e5a5d19ef75))

# [6.1.1](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.1.0...v6.1.1) (2024-05-22)

### Bug Fixes
* **iOS:** sometimes aspect ratio is invalid ([#3821](https://github.com/TheWidlarzGroup/react-native-video/issues/3821)) ([dac0985](https://github.com/TheWidlarzGroup/react-native-video/commit/dac09854303335d8e37b633c37bca399499d1999))

### Features
* **android:** change default user agent value ([#3813](https://github.com/TheWidlarzGroup/react-native-video/issues/3813)) ([089dc7e](https://github.com/TheWidlarzGroup/react-native-video/commit/089dc7e03251983ed3e1581519ffe4b3020ff5f8))


# [6.1.0](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.0.0...v6.1.0) (2024-05-22)


### Bug Fixes

* **android:** avoid blinking on video track change ([#3782](https://github.com/TheWidlarzGroup/react-native-video/issues/3782)) ([7b1e129](https://github.com/TheWidlarzGroup/react-native-video/commit/7b1e1293f67c0e25e0763d08d830fcf192bb713c))
* **android:** implement live configuration management ([#3792](https://github.com/TheWidlarzGroup/react-native-video/issues/3792)) ([e16730d](https://github.com/TheWidlarzGroup/react-native-video/commit/e16730de11d50b8a85cd09fa2b102fdbf777d8ad))
* **android:** implement seek backward in notification service ([#3808](https://github.com/TheWidlarzGroup/react-native-video/issues/3808)) ([94b3da3](https://github.com/TheWidlarzGroup/react-native-video/commit/94b3da3477af3d82e4b16e6c93beb5c92ccee59b))
* **android:** playback doesn't work with 0 startPositionMs ([#3784](https://github.com/TheWidlarzGroup/react-native-video/issues/3784)) ([66e0ba5](https://github.com/TheWidlarzGroup/react-native-video/commit/66e0ba579b84d745b4ca1b076d41d8eb880ef616))
* **android:** random android crash ([#3777](https://github.com/TheWidlarzGroup/react-native-video/issues/3777)) ([d4c9be2](https://github.com/TheWidlarzGroup/react-native-video/commit/d4c9be2ba09dd410f0d878ce3f6a1cca987f6713))
* **android:** remove remaining ad view when zapping ([#3786](https://github.com/TheWidlarzGroup/react-native-video/issues/3786)) ([324b461](https://github.com/TheWidlarzGroup/react-native-video/commit/324b46152703d813945778f55d87310d4e0b03cf))
* **android:** source metadata compare function ([#3775](https://github.com/TheWidlarzGroup/react-native-video/issues/3775)) ([6455380](https://github.com/TheWidlarzGroup/react-native-video/commit/6455380f9e15099b975dce9beaf9b9af8298f998))
* **tvos:** fix tvOS build and sample ([#3785](https://github.com/TheWidlarzGroup/react-native-video/issues/3785)) ([cd42dd7](https://github.com/TheWidlarzGroup/react-native-video/commit/cd42dd78c96e20da377c9b05c321218f1411ba97))


### Features

* add setVolume function to component's ref ([#3794](https://github.com/TheWidlarzGroup/react-native-video/issues/3794)) ([3cd7ab6](https://github.com/TheWidlarzGroup/react-native-video/commit/3cd7ab60b27e8820607bd83a5681bc7ba7e6c52e))
* **android:** add possibility to hide seekBar ([#3789](https://github.com/TheWidlarzGroup/react-native-video/issues/3789)) ([95e6140](https://github.com/TheWidlarzGroup/react-native-video/commit/95e6140eead56efab83871e29b57d30f4f11a77a))

# [6.0.0](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.0.0-rc.2...v6.0.0) (2024-05-14)


### Bug Fixes

* **android:** poster hidding ([#3768](https://github.com/TheWidlarzGroup/react-native-video/issues/3768)) ([98b4a75](https://github.com/TheWidlarzGroup/react-native-video/commit/98b4a75a90c6bc97cde267ea1c6a4a68d0bfdf45))
* **android:** video tracks crash and clean ([#3767](https://github.com/TheWidlarzGroup/react-native-video/issues/3767)) ([219496f](https://github.com/TheWidlarzGroup/react-native-video/commit/219496ff3abf6d7362ae01fb66c0bf28dfb00510))

# [6.0.0-rc.2](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.0.0-rc.1...v6.0.0-rc.2) (2024-05-13)


### Bug Fixes

* **avoid:** avoid early return in setSrc ([#3759](https://github.com/TheWidlarzGroup/react-native-video/issues/3759)) ([2e623ca](https://github.com/TheWidlarzGroup/react-native-video/commit/2e623ca0fb074e64a6125994effb8723f5c4ce59))
* **ios:** call `onLoadStart` earlier ([#3750](https://github.com/TheWidlarzGroup/react-native-video/issues/3750)) ([b3f08f6](https://github.com/TheWidlarzGroup/react-native-video/commit/b3f08f6c990f4670311e6d918aea191e72673057))
* **js:** fix onPlaybackStateChanged callback ([#3753](https://github.com/TheWidlarzGroup/react-native-video/issues/3753)) ([f87a793](https://github.com/TheWidlarzGroup/react-native-video/commit/f87a7938c6941c69915477fcf5f08c54a2635597))
* **ts:** add missing type ([#3757](https://github.com/TheWidlarzGroup/react-native-video/issues/3757)) ([2d94844](https://github.com/TheWidlarzGroup/react-native-video/commit/2d9484499cfb58d86b0aa82872d494a03fe67bba))


### Features

* **android:** make buffering strategy dynamic ([#3756](https://github.com/TheWidlarzGroup/react-native-video/issues/3756)) ([e420418](https://github.com/TheWidlarzGroup/react-native-video/commit/e420418e8f74894c443bd232e99f9b860e1d0b93))


### Reverts

* Revert "fix(android): video flickering add playback start (#3746)" (#3748) ([d25629b](https://github.com/TheWidlarzGroup/react-native-video/commit/d25629bb62cb9a7772ec2704f678e0fdf4927d12)), closes [#3746](https://github.com/TheWidlarzGroup/react-native-video/issues/3746) [#3748](https://github.com/TheWidlarzGroup/react-native-video/issues/3748)

# [6.0.0-rc.1](https://github.com/TheWidlarzGroup/react-native-video/compare/v6.0.0-rc.0...v6.0.0-rc.1) (2024-05-08)


### Bug Fixes

* **android:** prevent changing video track when video load ([#3683](https://github.com/TheWidlarzGroup/react-native-video/issues/3683)) ([6f61d7f](https://github.com/TheWidlarzGroup/react-native-video/commit/6f61d7f6e6969d05e4cee9bdb2e4cbc80d356e7f))
* **android:** video flickering add playback start ([#3746](https://github.com/TheWidlarzGroup/react-native-video/issues/3746)) ([b1cd52b](https://github.com/TheWidlarzGroup/react-native-video/commit/b1cd52bc58b3dfd02dab4784ea423ebddae874c4))
* avoid crash when setting index to 0 to tracks selection ([#3721](https://github.com/TheWidlarzGroup/react-native-video/issues/3721)) ([518a9a9](https://github.com/TheWidlarzGroup/react-native-video/commit/518a9a93e06686ba707427078a1770dc3d803b2b))
* **ios:** destroy adsManager when player detach from super view ([#3716](https://github.com/TheWidlarzGroup/react-native-video/issues/3716)) ([#3722](https://github.com/TheWidlarzGroup/react-native-video/issues/3722)) ([e96c173](https://github.com/TheWidlarzGroup/react-native-video/commit/e96c17321f1347818c1f5a38628d65b5b4bd5e7b))
* **ios:** ensure duration available when playing live ([#3710](https://github.com/TheWidlarzGroup/react-native-video/issues/3710)) ([d56b251](https://github.com/TheWidlarzGroup/react-native-video/commit/d56b251aef6d4ca1708c7bbada15016efbf12caf))
* **ios:** ensure orientation is correct on iOS ([#3719](https://github.com/TheWidlarzGroup/react-native-video/issues/3719)) ([1a8295c](https://github.com/TheWidlarzGroup/react-native-video/commit/1a8295c8bf30d53135d723fc9aface1a812be78a))
* **ios:** fix text track selection by index ([#3728](https://github.com/TheWidlarzGroup/react-native-video/issues/3728)) ([51e22ab](https://github.com/TheWidlarzGroup/react-native-video/commit/51e22abfe35978ee3fd1a7b3dc6f6c769d1b24bc))


### Features

* add notification controls ([#3723](https://github.com/TheWidlarzGroup/react-native-video/issues/3723)) ([8ad4be4](https://github.com/TheWidlarzGroup/react-native-video/commit/8ad4be459b935e30077e38cce696875ea9d6b21f))
* **android:** cache ([#3514](https://github.com/TheWidlarzGroup/react-native-video/issues/3514)) ([ecc946d](https://github.com/TheWidlarzGroup/react-native-video/commit/ecc946d1c1f9870c3f0a40fa426fa088017bd7cd))
* **android:** implement asset folder playback ([#3733](https://github.com/TheWidlarzGroup/react-native-video/issues/3733)) ([e05da4e](https://github.com/TheWidlarzGroup/react-native-video/commit/e05da4e9fe82b63cb1cebf70f6d11930b01124e0))


### Performance Improvements

* ensure we do not provide callback to native if no callback provided from app ([#3735](https://github.com/TheWidlarzGroup/react-native-video/issues/3735)) ([c59d00a](https://github.com/TheWidlarzGroup/react-native-video/commit/c59d00a0f0a0b63b6bbe931f1a9b4fef03667cb2))
* **ios:** add early returns ([#3741](https://github.com/TheWidlarzGroup/react-native-video/issues/3741)) ([1d235a1](https://github.com/TheWidlarzGroup/react-native-video/commit/1d235a1fea948b7b37ef20e75d953fcbd8c550c6))

# [6.0.0-rc.0](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.8...v6.0.0-rc.0) (2024-04-22)


### Bug Fixes

* **android:** catch errors in `performOnPlayerView` ([#3685](https://github.com/react-native-video/react-native-video/issues/3685)) ([3e35326](https://github.com/react-native-video/react-native-video/commit/3e3532691ad42a53b9136fd52eb7f9a578e21b91))
* **android:** fixed bug where video would not be visible after remount and change of drm source ([#3668](https://github.com/react-native-video/react-native-video/issues/3668)) ([1af12f9](https://github.com/react-native-video/react-native-video/commit/1af12f9dfb107c58a1896ee3181cb2c1a4fe300f))
* **android:** seek callback with controls ([#3694](https://github.com/react-native-video/react-native-video/issues/3694)) ([c730306](https://github.com/react-native-video/react-native-video/commit/c730306e3a408be753febf6e5a6e9c2984a3bbb5))
* **android:** set title for external subtitles ([#3676](https://github.com/react-native-video/react-native-video/issues/3676)) ([336b9f0](https://github.com/react-native-video/react-native-video/commit/336b9f022065b881eb31038ea1adba9dc54b2a08))
* ensure poster works as expected and add it to the sample ([#3643](https://github.com/react-native-video/react-native-video/issues/3643)) ([d694139](https://github.com/react-native-video/react-native-video/commit/d6941392e071f2bd50fbe832dde203b7f18da769))
* ensure tracks are available in sample ([#3660](https://github.com/react-native-video/react-native-video/issues/3660)) ([4c7719a](https://github.com/react-native-video/react-native-video/commit/4c7719a3f537509426c366d2176895661933c63c))
* **ios:** add workaround for `TouchableWithoutFeedback` ([#3688](https://github.com/react-native-video/react-native-video/issues/3688)) ([b5ccc48](https://github.com/react-native-video/react-native-video/commit/b5ccc48476d958f6b70d8a163a8d1209d1c3c302))
* **ios:** apply PictureInPicture state on start ([#3655](https://github.com/react-native-video/react-native-video/issues/3655)) ([07f71c2](https://github.com/react-native-video/react-native-video/commit/07f71c2fc446b43aa9565659983f7acb36d95f0c))
* **ios:** call PictureInPicture callbacks with native controls ([#3603](https://github.com/react-native-video/react-native-video/issues/3603)) ([051e884](https://github.com/react-native-video/react-native-video/commit/051e884c8f34755c887b66d8715a6ee38efc5f77)), closes [#3602](https://github.com/react-native-video/react-native-video/issues/3602) [#3602](https://github.com/react-native-video/react-native-video/issues/3602)
* **ios:** do not save pause state before seeking ([#3650](https://github.com/react-native-video/react-native-video/issues/3650)) ([e992243](https://github.com/react-native-video/react-native-video/commit/e992243305af0915442c3400f6ef105c4d5cd44c))
* **ios:** fix sideloading external subtitles ([#3690](https://github.com/react-native-video/react-native-video/issues/3690)) ([efa1c52](https://github.com/react-native-video/react-native-video/commit/efa1c52491cb069f6f4ba92ba56cf38624fecfde))
* **ios:** update onPlaybackStateChanged implementation ([#3687](https://github.com/react-native-video/react-native-video/issues/3687)) ([042e13c](https://github.com/react-native-video/react-native-video/commit/042e13c1dc3f88a42cd9293b064f9cebacecc831))
* **ios:** workaround for rate change ([#3657](https://github.com/react-native-video/react-native-video/issues/3657)) ([e26afac](https://github.com/react-native-video/react-native-video/commit/e26afac403e0b3675138f18569b08b4c9000cd81))
* prevents crash from occurring when using the selected video track with resolution type ([#3664](https://github.com/react-native-video/react-native-video/issues/3664)) ([e82f9dc](https://github.com/react-native-video/react-native-video/commit/e82f9dc24b6a4a09786f5425153b53494d72b05d))
* **ts:** onPlaybackRateChangeData was not correctly typed ([#3651](https://github.com/react-native-video/react-native-video/issues/3651)) ([2a858df](https://github.com/react-native-video/react-native-video/commit/2a858df8bce4dd6c529853bba5bac85f798c662e))


### Features

* **android:** allow to disable selected functionalities  ([#3681](https://github.com/react-native-video/react-native-video/issues/3681)) ([64e3191](https://github.com/react-native-video/react-native-video/commit/64e3191f73c828067094031a55e6868696b40a34))

# [6.0.0-beta.8](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.7...v6.0.0-beta.8) (2024-04-03)


### Bug Fixes

* **android:** update ui manager getter ([#3634](https://github.com/react-native-video/react-native-video/issues/3634)) ([e87c14a](https://github.com/react-native-video/react-native-video/commit/e87c14a4375d47a03447716b1920608855df5d8d))
* fix codegen types ([#3636](https://github.com/react-native-video/react-native-video/issues/3636)) ([9b66e7f](https://github.com/react-native-video/react-native-video/commit/9b66e7fdce0393c4e2154a23b407de6c46dc9490))

# [6.0.0-beta.7](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.6...v6.0.0-beta.7) (2024-03-30)


### Bug Fixes

* **android:** ensure rate is never set to 0 ([#3593](https://github.com/react-native-video/react-native-video/issues/3593)) ([3d7444a](https://github.com/react-native-video/react-native-video/commit/3d7444ab25c365b36e0e8d2672b74f474bba12eb))
* **android:** improve and backBufferDurationMs. mainly let exoplayer manage the prop ([#3619](https://github.com/react-native-video/react-native-video/issues/3619)) ([f10511d](https://github.com/react-native-video/react-native-video/commit/f10511d9534257a8fc9a4a47978d9c844428f1f7))
* **android:** keep screen on on fullscreen ([#3563](https://github.com/react-native-video/react-native-video/issues/3563)) ([bfb76e6](https://github.com/react-native-video/react-native-video/commit/bfb76e6d15f88a7dc50c63958486375e142a26bd))
* **android:** track selection parameter has change in last release. ([#3594](https://github.com/react-native-video/react-native-video/issues/3594)) ([d5c8b51](https://github.com/react-native-video/react-native-video/commit/d5c8b514a1af23fa473f32b434612feac46fd321))
* fix getLicense function's type definition ([#3606](https://github.com/react-native-video/react-native-video/issues/3606)) ([89ae843](https://github.com/react-native-video/react-native-video/commit/89ae8438fa1d90700a462b117aa9af42780c6268))
* inject onGetLicense prop properly for detect user defined or not ([#3608](https://github.com/react-native-video/react-native-video/issues/3608)) ([24c1aab](https://github.com/react-native-video/react-native-video/commit/24c1aab3f5ab6d2d753199ea16e01c993cc3ef7d))
* **iOS:** fix iOS DRM header parser ([#3609](https://github.com/react-native-video/react-native-video/issues/3609)) ([c9a75f3](https://github.com/react-native-video/react-native-video/commit/c9a75f3cde82f55e612b9e2c30ca06db3093b283))
* **ios:** fix PiP callback ([#3601](https://github.com/react-native-video/react-native-video/issues/3601)) ([bb9e7eb](https://github.com/react-native-video/react-native-video/commit/bb9e7eb5a5d68de1d8945be2f3fa089ca6ce2465))
* **ios:** fix regression when playing source starting with ph:// ([#3630](https://github.com/react-native-video/react-native-video/issues/3630)) ([75d3707](https://github.com/react-native-video/react-native-video/commit/75d370742b95ddf0eb114ef48620e188e6fdfad1))
* **ios:** fix startPosition, cropStart and cropEnd to handle float values correctly ([#3589](https://github.com/react-native-video/react-native-video/issues/3589)) ([36bd2e2](https://github.com/react-native-video/react-native-video/commit/36bd2e2d71dc6879d74b154ecc39ea7b27f4b565))
* **iOS:** throw when content id defined with empty string ([#3612](https://github.com/react-native-video/react-native-video/issues/3612)) ([0983580](https://github.com/react-native-video/react-native-video/commit/098358076ddaba387284c1757a80bfcc5d82191f))
* remove `setNativeProps` usage ([#3605](https://github.com/react-native-video/react-native-video/issues/3605)) ([0312afc](https://github.com/react-native-video/react-native-video/commit/0312afc8ea27f8c82ef7ba9fecbde23174e68671))


### BREAKING CHANGES

* **android:** move backBufferDurationMs from root props to bufferConfig

# [6.0.0-beta.6](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.5...v6.0.0-beta.6) (2024-03-18)


### Bug Fixes

* add missing node_modules paths to metro.config.js of basic example app ([#3555](https://github.com/react-native-video/react-native-video/issues/3555)) ([d505de5](https://github.com/react-native-video/react-native-video/commit/d505de5910a22ab9a0d7429e6b88a81cd2594b9c))
* add missing shutterColor type ([#3561](https://github.com/react-native-video/react-native-video/issues/3561)) ([ba00881](https://github.com/react-native-video/react-native-video/commit/ba00881ddcd53c2f5a4e1fc6e30cb5eb7ef674a3))
* **android:** check disableFocus when state is ready ([#3494](https://github.com/react-native-video/react-native-video/issues/3494)) ([366c841](https://github.com/react-native-video/react-native-video/commit/366c841c0b960fd461ae7dcfdcb76a928fadf2b8))
* **android:** enableDecoderFallback to decrease DECODER_ERROR issue ([#3416](https://github.com/react-native-video/react-native-video/issues/3416)) ([eaa72c6](https://github.com/react-native-video/react-native-video/commit/eaa72c66659b9e2a22af9ff9d43013521f6a66e3))
* **android:** onSeek called instantly ([#3530](https://github.com/react-native-video/react-native-video/issues/3530)) ([af6aea8](https://github.com/react-native-video/react-native-video/commit/af6aea8934e19467e1ed8e21808b2dbddb6f6356))
* **android:** suppress lint `PrivateResource` ([#3531](https://github.com/react-native-video/react-native-video/issues/3531)) ([38e3625](https://github.com/react-native-video/react-native-video/commit/38e3625541753340e912e474b753e0f4fac4e9c1))
* **docs/ci:** add typescript ([#3572](https://github.com/react-native-video/react-native-video/issues/3572)) ([0f31271](https://github.com/react-native-video/react-native-video/commit/0f31271dcf2bfe2f4429e22040660025be8a6a3c))
* **docs:** fix build ([#3571](https://github.com/react-native-video/react-native-video/issues/3571)) ([4fc7d27](https://github.com/react-native-video/react-native-video/commit/4fc7d2788b4d01c581a31cc3ac733c3948b65a3a))
* **ios:** add text tracks only if we successfully insertTimeRage ([#3557](https://github.com/react-native-video/react-native-video/issues/3557)) ([b73baad](https://github.com/react-native-video/react-native-video/commit/b73baad2c2c0c6ea701d865eee32d4e94ae58178))
* **ios:** apply `cropStart` when in repeat mode ([#3525](https://github.com/react-native-video/react-native-video/issues/3525)) ([2c0e009](https://github.com/react-native-video/react-native-video/commit/2c0e00987685875f9603ae2084ae23b3c1aebce7))
* **ios:** current release volume change observer ([#3565](https://github.com/react-native-video/react-native-video/issues/3565)) ([16f3cdb](https://github.com/react-native-video/react-native-video/commit/16f3cdbd9a7864206feaeef29344c09792d66d56))
* **ios:** Do not crash when accessLog return nil ([#3549](https://github.com/react-native-video/react-native-video/issues/3549)) ([4d4b56c](https://github.com/react-native-video/react-native-video/commit/4d4b56c05dd3c09fce5ddc38f56b0391c357ac85))
* **ios:** don't crop video when in repeat mode ([#3575](https://github.com/react-native-video/react-native-video/issues/3575)) ([90b31af](https://github.com/react-native-video/react-native-video/commit/90b31af2c969b6d6d57877c71ef3a4830a76aedc))
* **ios:** ensure playback stopped in background ([#3587](https://github.com/react-native-video/react-native-video/issues/3587)) ([41c6785](https://github.com/react-native-video/react-native-video/commit/41c6785ee8c667ebe9c6c464223f6485473d94f8))
* **ios:** fix missing bridge in bridgeless mode ([#3570](https://github.com/react-native-video/react-native-video/issues/3570)) ([46c8c49](https://github.com/react-native-video/react-native-video/commit/46c8c498c474600a0b35ebaf744306aefa42905f))
* **ios:** fix tvOS build ([#3524](https://github.com/react-native-video/react-native-video/issues/3524)) ([9306d9a](https://github.com/react-native-video/react-native-video/commit/9306d9a15d281a60492f6d4166598a389a56f652))
* **ios:** split licenseUrl and loadedLicenseUrl ([#3578](https://github.com/react-native-video/react-native-video/issues/3578)) ([7c4d19f](https://github.com/react-native-video/react-native-video/commit/7c4d19fa72a35449dd11ec59278b2ea11ec629fc))


### Features

* **android:** add subtitle event ([#3566](https://github.com/react-native-video/react-native-video/issues/3566)) ([6184c10](https://github.com/react-native-video/react-native-video/commit/6184c10acc90defd63cd55af51458864dfe112d5))
* implement opacity to control visibility of subtitles ([#3583](https://github.com/react-native-video/react-native-video/issues/3583)) ([f4cce2e](https://github.com/react-native-video/react-native-video/commit/f4cce2ecdba0668c3ecf74d2fd7956df4dd8489d))
* **ios:** Add ios support for accessing WebVTT Subtitle Content  ([#3541](https://github.com/react-native-video/react-native-video/issues/3541)) ([253ffb5](https://github.com/react-native-video/react-native-video/commit/253ffb595633a4b18221339278f73c8416225f56))
* move require (local files) to `source.uri` ([#3535](https://github.com/react-native-video/react-native-video/issues/3535)) ([41ac781](https://github.com/react-native-video/react-native-video/commit/41ac7814121fc70a123fa4585dc9b1bd96e9629f))

# [6.0.0-beta.5](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.4...v6.0.0-beta.5) (2024-02-02)


### Bug Fixes

* **android:** fix crash with interop layer ([#3509](https://github.com/react-native-video/react-native-video/issues/3509)) ([41e9bcb](https://github.com/react-native-video/react-native-video/commit/41e9bcb1ef28c1532863186c83423814fcaf2372))
* **android:** re-layout controls after fullscreen dismiss ([#3490](https://github.com/react-native-video/react-native-video/issues/3490)) ([135d97c](https://github.com/react-native-video/react-native-video/commit/135d97ce506bf1a0226042e0f29f4de5bcc10972))
* fix typo ([#3497](https://github.com/react-native-video/react-native-video/issues/3497)) ([336eb44](https://github.com/react-native-video/react-native-video/commit/336eb44dc6061dad9cdc3382eb05d0a0effbef64))
* **ios:** fix pip memory leak ([#3506](https://github.com/react-native-video/react-native-video/issues/3506)) ([53068dd](https://github.com/react-native-video/react-native-video/commit/53068ddd41218bb615cd129eba2c36d6347ccf25))
* remove lifecycle listener after component unmount ([#3489](https://github.com/react-native-video/react-native-video/issues/3489)) ([3858a15](https://github.com/react-native-video/react-native-video/commit/3858a15b4268ae54d5b97c036d86b05aaf31bcf9)), closes [#3488](https://github.com/react-native-video/react-native-video/issues/3488)
* remove pausePlayback when audio focus loss event ([#3496](https://github.com/react-native-video/react-native-video/issues/3496)) ([b1ab0f2](https://github.com/react-native-video/react-native-video/commit/b1ab0f24a3efbcc3be49005060f50b34a117664e))


### Features

* implement onAudioTracks and onTextTracks on ios ([#3503](https://github.com/react-native-video/react-native-video/issues/3503)) ([6a49cba](https://github.com/react-native-video/react-native-video/commit/6a49cba273fa0a47e106f4abb8caeb4ab6dbe4c8))


### Reverts

* Revert "fix: remove pausePlayback when audio focus loss event (#3496)" (#3504) ([aec7db6](https://github.com/react-native-video/react-native-video/commit/aec7db63901c42dd7a591b030bfc69daa8860341)), closes [#3496](https://github.com/react-native-video/react-native-video/issues/3496) [#3504](https://github.com/react-native-video/react-native-video/issues/3504)

# [6.0.0-beta.4](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.3...v6.0.0-beta.4) (2024-01-15)


### Bug Fixes
* add missing audioOutput prop (#3450) (f20d68b)
* **android**: support opacity properly (#3464) (11e5b75)
* **ios**: currentPlaybackTime in ms and not seconds (#3472) (3f63c16)
* **ios**: remove extra dismissFullscreenPlayer declaration (#3474) (045f5fa)

### Features
* add visionOS support (#3425) (cf3ebb7)
* **ios**: migrate from deprecated methods (#3444) (5aaa53d)
* **ios**: update the way to get keyWindow (#3448) (f35727f)
* **ios**: update timed metadata handler (#3449) (481cc71)

# [6.0.0-beta.3](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.2...v6.0.0-beta.3) (2023-12-24)


### Bug Fixes

* **android:** default UA ([#3429](https://github.com/react-native-video/react-native-video/issues/3429)) ([dd7bb54](https://github.com/react-native-video/react-native-video/commit/dd7bb54720c06eca045d72e7557d6f472a793b6f))
* ensure save doesn't crash on android ([#3415](https://github.com/react-native-video/react-native-video/issues/3415)) ([22a2655](https://github.com/react-native-video/react-native-video/commit/22a2655dca4bb53074ce5a74cfeb7f9bb26b13a3))
* **ios:** revert ios url encoding as this breaks encoded urls ([#3440](https://github.com/react-native-video/react-native-video/issues/3440)) ([0723481](https://github.com/react-native-video/react-native-video/commit/0723481fee75890bc2fff967e3b5bc8946e481a3))
* **ReactVideoProps:** add accessibility & testID in typing ([#3434](https://github.com/react-native-video/react-native-video/issues/3434)) ([d986b7b](https://github.com/react-native-video/react-native-video/commit/d986b7bf57f8fe49cbf5f507efde4aeb28ee34f8))

# [6.0.0-beta.2](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.1...v6.0.0-beta.2) (2023-12-08)


### Bug Fixes

* add allowsExternalPlayback missing on ReactVideoProps ([#3398](https://github.com/react-native-video/react-native-video/issues/3398)) ([72679a7](https://github.com/react-native-video/react-native-video/commit/72679a7d639b9c000e060af0dbab7c862c180b00))
* **android:** add explicitly dependancy to androidx.activity ([#3410](https://github.com/react-native-video/react-native-video/issues/3410)) ([908e30f](https://github.com/react-native-video/react-native-video/commit/908e30f9b8d950fa1423a10d4b08135b6cc4d43a))
* **android:** ensure adTagUrl can be reset ([#3408](https://github.com/react-native-video/react-native-video/issues/3408)) ([f9bcaac](https://github.com/react-native-video/react-native-video/commit/f9bcaac5158ea2d835dd3177b62ad0446eb30d67))
* revert drm type definition change ([#3409](https://github.com/react-native-video/react-native-video/issues/3409)) ([fbb5654](https://github.com/react-native-video/react-native-video/commit/fbb5654a8e075a2b33ae17bd322bb79b1f459d53))

# [6.0.0-beta.1](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.0...v6.0.0-beta.1) (2023-12-02)


### Bug Fixes

* **android:** ads build and enable ads in android sample ([#3376](https://github.com/react-native-video/react-native-video/issues/3376)) ([fe89122](https://github.com/react-native-video/react-native-video/commit/fe89122524826093689118a4515802d83ca88679))
* **android:** fix leak caused by removing lifecycle listener too early ([#3380](https://github.com/react-native-video/react-native-video/issues/3380)) ([0c0f317](https://github.com/react-native-video/react-native-video/commit/0c0f3174cb37d3c664a345ea00fcbaafffcd4b10))
* **android:** revert media3 update, back to 1.1.1 ([#3369](https://github.com/react-native-video/react-native-video/issues/3369)) ([5beef38](https://github.com/react-native-video/react-native-video/commit/5beef383cba13d3ac471bfde27e4acfaa19adfec))
* **ios:** check for ios url query encoding ([#3384](https://github.com/react-native-video/react-native-video/issues/3384)) ([de4159f](https://github.com/react-native-video/react-native-video/commit/de4159f0c2825a58d88f3882215da4bf51fdbeb2))
* **ios:** fix pip(when player doesn't fill screen) ([#3363](https://github.com/react-native-video/react-native-video/issues/3363)) ([11f6201](https://github.com/react-native-video/react-native-video/commit/11f62013e33939ce3f78ec7cf40e4da464afa824))


### Features

* **ad:** add data to onReceiveAdEvent ([#3378](https://github.com/react-native-video/react-native-video/issues/3378)) ([d05231d](https://github.com/react-native-video/react-native-video/commit/d05231d76b87e2f65bc7648bfb81d01e4054b2de))
* add AdEvent enum to have an exhaustive list of all possible AdEvent values ([#3374](https://github.com/react-native-video/react-native-video/issues/3374)) ([b3744f9](https://github.com/react-native-video/react-native-video/commit/b3744f9b9f25b469fb8b0828e3762842bd5026de))
* add onAdError event listener ([#3381](https://github.com/react-native-video/react-native-video/issues/3381)) ([596c02d](https://github.com/react-native-video/react-native-video/commit/596c02d2b3b5175e1653844c39a47ecfd5e23163))
* **android:** bump media3 version from v1.1.1 to v1.2.0 ([#3362](https://github.com/react-native-video/react-native-video/issues/3362)) ([17dbf6e](https://github.com/react-native-video/react-native-video/commit/17dbf6e8264c5c6bed10ff23d96c2b7296a49651))
* implement startPosition ([#3355](https://github.com/react-native-video/react-native-video/issues/3355)) ([2648502](https://github.com/react-native-video/react-native-video/commit/2648502b364c2802f5a2a7302c31200905c0a807))

# [6.0.0-beta.1](https://github.com/react-native-video/react-native-video/compare/v6.0.0-beta.0...v6.0.0-beta.1) (WIP)
* **android:** fix leak caused by removing lifecycle listener too early ([#3380](https://github.com/react-native-video/react-native-video/pull/3380))

# [6.0.0-beta.0](https://github.com/react-native-video/react-native-video/compare/v6.0.0-alpha.11...v6.0.0-beta.0) (2023-11-18)


### Bug Fixes

* **example:** remove dependency loop ([#3353](https://github.com/react-native-video/react-native-video/issues/3353)) ([211c3c7](https://github.com/react-native-video/react-native-video/commit/211c3c7d08c8438bfca3350f0070cfec0ae5bc56))
* **ios:** change isPlaybackLikelyToKeepUp check ([#3357](https://github.com/react-native-video/react-native-video/issues/3357)) ([1ba93f9](https://github.com/react-native-video/react-native-video/commit/1ba93f9e9d33f653f0e01214f220e1e5eda819f5))
* **ios:** fix cache playerItemPrepareText type ([#3358](https://github.com/react-native-video/react-native-video/issues/3358)) ([0e23952](https://github.com/react-native-video/react-native-video/commit/0e23952cea5c71324a2f5eea0383c4db9e02504b))
* **ios:** fix external text tracks crashes with m3u8 files ([#3330](https://github.com/react-native-video/react-native-video/issues/3330)) ([782e7e0](https://github.com/react-native-video/react-native-video/commit/782e7e0df1386ef0aad3f00d73171d04d6cf725d))
* update onError definition to match implementation ([#3349](https://github.com/react-native-video/react-native-video/issues/3349)) ([fdbd6a6](https://github.com/react-native-video/react-native-video/commit/fdbd6a6ba8aef2da854ff7b0fbf25085ce6983e3))


### Features

* **android:** replace deprecated ExoPlayer2 with AndroidX media3 ([#3337](https://github.com/react-native-video/react-native-video/issues/3337)) ([f2e80e9](https://github.com/react-native-video/react-native-video/commit/f2e80e9f2d1acc97080d48913802639dd2f38346))

# [6.0.0-alpha.11](https://github.com/react-native-video/react-native-video/compare/v6.0.0-alpha.10...v6.0.0-alpha.11) (2023-11-15)


### Bug Fixes

* fix bad package release process ([#3347](https://github.com/react-native-video/react-native-video/issues/3347)) ([f961f95](https://github.com/react-native-video/react-native-video/commit/f961f952a483192ee3de1f7bae59419ec6ddc5b7))

# [6.0.0-alpha.10](https://github.com/react-native-video/react-native-video/compare/v6.0.0-alpha.9...v6.0.0-alpha.10) (2023-11-13)


### Bug Fixes

* fixes where Android's muted prop behavior differs from iOS ([#3339](https://github.com/react-native-video/react-native-video/issues/3339)) ([8fbdc28](https://github.com/react-native-video/react-native-video/commit/8fbdc28a73a0b3ffd3691ef0c8cf523c760ae288))
* **ios:** fix wrong fullscreen method definition ([#3338](https://github.com/react-native-video/react-native-video/issues/3338)) ([7f49b56](https://github.com/react-native-video/react-native-video/commit/7f49b560278262fb4276f931404c70672a6445c8))
* **ios:** player is frozen after re-focusing on the app ([#3326](https://github.com/react-native-video/react-native-video/issues/3326)) ([722ae34](https://github.com/react-native-video/react-native-video/commit/722ae3477a68aecb812b26d71ea22a17dda71f50))


### Features

* add `onVolumeChange` event ([#3322](https://github.com/react-native-video/react-native-video/issues/3322)) ([cdbc856](https://github.com/react-native-video/react-native-video/commit/cdbc85638789da0002cdadb13190963d4c1332c2))
* add release-it ([#3342](https://github.com/react-native-video/react-native-video/issues/3342)) ([da27089](https://github.com/react-native-video/react-native-video/commit/da270891fbce485bb132825a336638f2af98408d))
* **ios:** add onBandwidthUpdate event ([#3331](https://github.com/react-native-video/react-native-video/issues/3331)) ([9054db3](https://github.com/react-native-video/react-native-video/commit/9054db35d7d5e4e6d54739fc9349576c03522d7c))

## Changelog

## Next
- Android, iOS: add onVolumeChange event #3322
- iOS: Externally loaded text tracks not loading properly [#3461](https://github.com/react-native-video/react-native-video/pull/3461)

### Version 6.0.0-alpha.9
- All: add built-in typescript support [#3266](https://github.com/react-native-video/react-native-video/pull/3266)
- All: update documentation generation [#3296](https://github.com/react-native-video/react-native-video/pull/3296)
- **BREAKING CHANGE**❗️Android: update isCodecSupported to return enum [#3254](https://github.com/react-native-video/react-native-video/pull/3254)
- Android: use explicit not-exported flag for AudioBecomingNoisyReceiver [#3327](https://github.com/react-native-video/react-native-video/pull/3327)
- Android: remove kotlin-android-extensions [#3299](https://github.com/react-native-video/react-native-video/pull/3299)
- Android: ensure audio volume is changed in UI thread [3292](https://github.com/react-native-video/react-native-video/pull/3292)
- Android: multiple internal refactor and switch to kotlin
- Android: refactor log management and add an option to increase log verbosity [#3277](https://github.com/react-native-video/react-native-video/pull/3277)
- iOS: Fix audio session category when not using the audioOutput prop
- iOS: implement onPlaybackStateChanged callback [#3307](https://github.com/react-native-video/react-native-video/pull/3307)
- iOS: remove false calls at onPlaybackRateChange [#3306](https://github.com/react-native-video/react-native-video/pull/3306)
- iOS: audio does not work with headphones [#3284](https://github.com/react-native-video/react-native-video/pull/3284)
- iOS: Resuming video ad after closing the in-app browser on iOS [#3275](https://github.com/react-native-video/react-native-video/pull/3275)
- iOS, Android: expose playback functions to ref [#3245](https://github.com/react-native-video/react-native-video/pull/3245)
- tvOS: fix build: [#3276](https://github.com/react-native-video/react-native-video/pull/3276)
- Windows: fix build error from over-specified SDK version [#3246](https://github.com/react-native-video/react-native-video/pull/3246)
- Windows: fix `onError` not being raised [#3247](https://github.com/react-native-video/react-native-video/pull/3247)

### Version 6.0.0-alpha.8
- All: Playing audio over earpiece [#2887](https://github.com/react-native-video/react-native-video/issues/2887)
- All: Prepare for fabric [#3175](https://github.com/react-native-video/react-native-video/pull/3175) [#]()
- iOS: Fix Pip [#3221](https://github.com/react-native-video/react-native-video/pull/3221)
- iOS: Fix regression in presentFullscreenPlayer & dismissFullscreenPlayer [#3230](https://github.com/react-native-video/react-native-video/pull/3230)
- tvOS: Fix build [#3207](https://github.com/react-native-video/react-native-video/pull/3207)
- tvOS: Add sample [#3208](https://github.com/react-native-video/react-native-video/pull/3208)
- tvOS: Allow chapter customization [#3216](https://github.com/react-native-video/react-native-video/pull/3216)
- doc: Fix internal links [#3229](https://github.com/react-native-video/react-native-video/pull/3229)

### Version 6.0.0-alpha.7
- All: clean JS warnings (https://github.com/react-native-video/react-native-video/pull/3183)
- Android: Add shutterView color configurtion (https://github.com/react-native-video/react-native-video/pull/3179)
- Android: React native 0.73 support (https://github.com/react-native-video/react-native-video/pull/3163)
- Android: Fix memory leaks from AudioManager [#3123](https://github.com/react-native-video/react-native-video/pull/3123)
- Android: Fixed syntax error [#3182](https://github.com/react-native-video/react-native-video/issues/3182)
- iOS: Fix freeze at playback startup (https://github.com/react-native-video/react-native-video/pull/3173)
- iOS: Various safety checks (https://github.com/react-native-video/react-native-video/pull/3168)

### Version 6.0.0-alpha.6
- Feature: Video range support [#3030](https://github.com/react-native-video/react-native-video/pull/3030)
- iOS: remove undocumented `currentTime` property [#3064](https://github.com/react-native-video/react-native-video/pull/3064)
- iOS: make sure that the audio in ads is muted when the player is muted. [#3068](https://github.com/react-native-video/react-native-video/pull/3077)
- iOS: make IMA build optionnal

### Version 6.0.0-alpha.5

- iOS: ensure controls are not displayed when disabled by user [#3017](https://github.com/react-native-video/react-native-video/pull/3017)
- iOS: app crashes on call to presentFullScreenPlayer [#2808](https://github.com/react-native-video/react-native-video/pull/2971)
- Android: Fix publicated progress handler causing duplicated progress event [#2972](https://github.com/react-native-video/react-native-video/pull/2972)
- Android: Fix audio/Subtitle tracks selection [#2979](https://github.com/react-native-video/react-native-video/pull/2979)
- Android: add new events on tracks changed to be notified of audio/text/video Tracks update during playback [2806](https://github.com/react-native-video/react-native-video/pull/2806)
- Feature: Add VAST support for AVOD [#2923](https://github.com/react-native-video/react-native-video/pull/2923)
- Sample: Upgrade react-native version of basic sample [#2960](https://github.com/react-native-video/react-native-video/pull/2960)

### Version 6.0.0-alpha.4

- ensure src is always provided to native player even if it is invalid [#2857](https://github.com/react-native-video/react-native-video/pull/2857)
- Sample: Add react-native-video controls support [#2852](https://github.com/react-native-video/react-native-video/pull/2852)
- Android: Switch Google's maven repository to default `google()` [#2860](https://github.com/react-native-video/react-native-video/pull/2860)
- Android: Implement focusable prop so the video view can toggle whether it is focusable for non-touch devices [#2819](https://github.com/react-native-video/react-native-video/issues/2819)
- Android: fix linter warning [#2891] (https://github.com/react-native-video/react-native-video/pull/2891)
- Fix iOS RCTSwiftLog naming collision [#2868](https://github.com/react-native-video/react-native-video/issues/2868)
- Added "homepage" to package.json [#2882](https://github.com/react-native-video/react-native-video/pull/2882)
- Fix regression when fullscreen prop is used combined with controls [#2911](https://github.com/react-native-video/react-native-video/pull/2911)
- Fix: memory leak issue on iOS [#2907](https://github.com/react-native-video/react-native-video/pull/2907)
- Fix setting text tracks before player is initialized on iOS [#2935](https://github.com/react-native-video/react-native-video/pull/2935)

### Version 6.0.0-alpha.3

- Fix ios build [#2854](https://github.com/react-native-video/react-native-video/pull/2854)

### Version 6.0.0-alpha.2

- Upgrade ExoPlayer to 2.18.1 [#2846](https://github.com/react-native-video/react-native-video/pull/2846)
- Feature add new APIs to query supported features of device decoder (widevine level & codec capabilities) on android [#2740](https://github.com/react-native-video/react-native-video/pull/2740)
- Feature add support of subtitle styling on android [#2759](https://github.com/react-native-video/react-native-video/pull/2759)
- Fix Android #2690 ensure onEnd is not sent twice [#2690](https://github.com/react-native-video/react-native-video/issues/2690)
- Fix Exoplayer progress not reported when paused [#2664](https://github.com/react-native-video/react-native-video/pull/2664)
- Call playbackRateChange onPlay and onPause [#1493](https://github.com/react-native-video/react-native-video/pull/1493)
- Fix being unable to disable sideloaded texttracks in the AVPlayer [#2679](https://github.com/react-native-video/react-native-video/pull/2679)
- Fixed crash when iOS seek method called reject on the promise [#2743](https://github.com/react-native-video/react-native-video/pull/2743)
- Fix maxBitRate property being ignored on Android [#2670](https://github.com/react-native-video/react-native-video/pull/2670)
- Fix crash when the source is a cameraroll [#2639] (https://github.com/react-native-video/react-native-video/pull/2639)
- Fix IOS UI frame drop on loading video [#2848] (https://github.com/react-native-video/react-native-video/pull/2848)

### Version 6.0.0-alpha.1

- Remove Android MediaPlayer support [#2724](https://github.com/react-native-video/react-native-video/pull/2724)
  **WARNING**: when switching from older version to V6, you need to remove all refrerences of android-exoplayer. This android-exoplayer folder has been renamed to android. Exoplayer is now the only player implementation supported.

- Replace Image.propTypes with ImagePropTypes. [#2718](https://github.com/react-native-video/react-native-video/pull/2718)
- Fix iOS build caused by type mismatch [#2720](https://github.com/react-native-video/react-native-video/pull/2720)
- ERROR TypeError: undefined is not an object (evaluating '_reactNative.Image.propTypes.resizeMode') [#2714](https://github.com/react-native-video/react-native-video/pull/2714)
- Fix video endless loop when repeat set to false or not specified. [#2329](https://github.com/react-native-video/react-native-video/pull/2329)

### Version 6.0.0-alpha.0

- Support disabling buffering [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Fix AudioFocus bug that could cause the player to stop responding to play/pause in some instances. [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Fix player crashing when it is being cleared. [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Add support for customising back buffer duration and handle network errors gracefully to prevent releasing the player when network is lost. [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Allow player to be init before source is provided, and later update once a source is provided. [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Adds handling for providing a empty source in order to stop playback and clear out any existing content [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Add support for detecting if format is supported and exclude unsupported resolutions from auto quality selection and video track info in RN. [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Improve error handling [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Add support for L1 to L3 Widevine fallback if playback fails initially. [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Reduce buffer size based on available heap [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Force garbage collection when there is no available memory [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Improve memory usage [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Support disabling screen recording [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Improved error capturing [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Fix DRM init crashes [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Improve progress reporting [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Fix progress loss when network connection is regained [#2689](https://github.com/react-native-video/react-native-video/pull/2689)
- Add Google's maven repository to avoid build error [#2552](https://github.com/react-native-video/react-native-video/pull/2552)
- Fix iOS 15.4 HLS playback race condition [#2633](https://github.com/react-native-video/react-native-video/pull/2633)
- Fix app crash from NPE in Exoplayer error handler [#2575](https://github.com/react-native-video/react-native-video/pull/2575)
- Fix default closed captioning behavior for Android ExoPlayer [#2181](https://github.com/react-native-video/react-native-video/pull/2181)
- Disable pipController init if pictureInPicture is false [#2645](https://github.com/react-native-video/react-native-video/pull/2645)
- Make sure modifiers are applied before playing [#2395](https://github.com/react-native-video/react-native-video/pull/2395)
- Better support newer versions of RNW (64 and newer) [#2535](https://github.com/react-native-video/react-native-video/pull/2535)
- Fix nil string uri parameter error [#695](https://github.com/react-native-video/react-native-video/pull/695)
- (Breaking) Bump shaka-player to 3.3.2 [#2587](https://github.com/react-native-video/react-native-video/pull/2587)
- Improve basic player example on android [#2662](https://github.com/react-native-video/react-native-video/pull/2662)
- Ensure we always use `hideShutterView` before showing the `shutterView` on Android [#2609](https://github.com/react-native-video/react-native-video/pull/2609)
- Convert iOS implementation to Swift [#2527](https://github.com/react-native-video/react-native-video/pull/2527)
- Add iOS support for decoding offline sources [#2527](https://github.com/react-native-video/react-native-video/pull/2527)
- Update basic example applications (React Native 0.63.4) [#2527](https://github.com/react-native-video/react-native-video/pull/2527)
- Upgrade ExoPlayer to 2.17.1 [#2498](https://github.com/react-native-video/react-native-video/pull/2498)
- Fix volume reset issue in exoPlayer [#2371](https://github.com/react-native-video/react-native-video/pull/2371)
- Change WindowsTargetPlatformVersion to 10.0 [#2706](https://github.com/react-native-video/react-native-video/pull/2706)
- Fixed Android seeking bug [#2712](https://github.com/react-native-video/react-native-video/pull/2712)
- Fixed `onReadyForDisplay` not being called [#2721](https://github.com/react-native-video/react-native-video/pull/2721)
- Fix type of `_eventDispatcher` on iOS target to match `bridge.eventDispatcher()` [#2720](https://github.com/react-native-video/react-native-video/pull/2720)

### Version 5.2.0

- Fix for tvOS native audio menu language selector
- Update ExoPlayer to allow pre-init and content clear [#2412] (https://github.com/react-native-video/react-native-video/pull/2412)
- iOS rate is reset to 1.0 after play/pause [#2167] (https://github.com/react-native-video/react-native-video/pull/2167)
- Upgrade ExoPlayer to 2.13.2 [#2317] (https://github.com/react-native-video/react-native-video/pull/2317)
- Fix AudioFocus pausing video when attempting to play [#2311] (https://github.com/react-native-video/react-native-video/pull/2311)

### Version 5.1.0-alpha9

- Add ARM64 support for windows [#2137](https://github.com/react-native-community/react-native-video/pull/2137)
- Fix deprecated API bug for windows [#2119](https://github.com/react-native-video/react-native-video/pull/2119)
- Added `rate` property and autolinking support for windows [#2206](https://github.com/react-native-video/react-native-video/pull/2206)

### Version 5.1.0-alpha8

- Fixing ID3 Frame Error When Receiving EventMessage in TimedMetadata [#2116](https://github.com/react-native-community/react-native-video/pull/2116)

### Version 5.1.0-alpha7

- Basic support for DRM on iOS and Android [#1445](https://github.com/react-native-community/react-native-video/pull/1445)

### Version 5.1.0-alpha6

- Fix iOS bug which would break size of views when video is displayed with controls on a non full-screen React view. [#1931](https://github.com/react-native-community/react-native-video/pull/1931)
- Fix video dimensions being undefined when playing HLS in ios. [#1992](https://github.com/react-native-community/react-native-video/pull/1992)
- Add support for audio mix with other apps for iOS. [#1978](https://github.com/react-native-community/react-native-video/pull/1978)
- Properly implement pending seek for iOS. [#1994](https://github.com/react-native-community/react-native-video/pull/1994)
- Added `preferredForwardBufferDuration` (iOS) - the duration the player should buffer media from the network ahead of the playhead to guard against playback disruption. (#1944)
- Added `currentPlaybackTime` (Android ExoPlayer, iOS) - when playing an HLS live stream with a `EXT-X-PROGRAM-DATE-TIME` tag configured, then this property will contain the epoch value in msec. (#1944)
- Added `trackId` (Android ExoPlayer) - Configure an identifier for the video stream to link the playback context to the events emitted. (#1944)
- Added preventsDisplaySleepDuringVideoPlayback (#2019)
- Reverted the JS fullscreening for Android. [#2013](https://github.com/react-native-community/react-native-video/pull/2013)
- Set iOS request headers without needing to edit RCTVideo.m. [#2014](https://github.com/react-native-community/react-native-video/pull/2014)
- Fix exoplayer aspect ratio update on source changes [#2053](https://github.com/react-native-community/react-native-video/pull/2053)

### Version 5.1.0-alpha5

- Add support for react-native Windows Cpp/WinRT [#1893]((https://github.com/react-native-community/react-native-video/pull/1893))

### Version 5.1.0-alpha4

- Fix android play/pause bug related to full-screen mode [#1916](https://github.com/react-native-community/react-native-video/pull/1916)

### Version 5.1.0-alpha3

- Improve Android Audio Focus [#1897](https://github.com/react-native-community/react-native-video/pull/1897)

### Version 5.1.0-alpha2

- Added support for full-screen functionality in Android Exoplayer [#1730](https://github.com/react-native-community/react-native-video/pull/1730)

### Version 5.1.0-alpha1

- Fixed Exoplayer doesn't work with mute=true (Android). [#1696](https://github.com/react-native-community/react-native-video/pull/1696)
- Added support for automaticallyWaitsToMinimizeStalling property (iOS) [#1723](https://github.com/react-native-community/react-native-video/pull/1723)
- Bump Exoplayer to 2.10.4, remove deprecated usages of Exoplayer methods (Android). [#1753](https://github.com/react-native-community/react-native-video/pull/1753)
- Preserve Exoplayer BandwidthMeter instance across video plays, this should noticeably improve streaming bandwidth detection (Android).

### Version 5.0.2

- Fix crash when RCTVideo's superclass doesn't observe the keyPath 'frame' (iOS) [#1720](https://github.com/react-native-community/react-native-video/pull/1720)

### Version 5.0.1

- Fix AndroidX Support bad merge

### Version 5.0.0 [Deprecated]

- AndroidX Support

### Version 4.4.4

- Handle racing conditions when props are settled on Exoplayer

### Version 4.4.3

- Fix mute/unmute when controls are present (iOS) [#1654](https://github.com/react-native-community/react-native-video/pull/1654)
- Fix Android videos being able to play with background music/audio from other apps.
- Fixed memory leak on iOS when using `controls` [#1647](https://github.com/react-native-community/react-native-video/pull/1647)
- (Android) Update gradle and target SDK [#1629](https://github.com/react-native-community/react-native-video/pull/1629)
- Fix iOS stressed mount/unmount crash [#1646](https://github.com/react-native-community/react-native-video/pull/1646)

### Version 4.4.2

- Change compileOnly to implementation on gradle (for newer gradle versions and react-native 0.59 support) [#1592](https://github.com/react-native-community/react-native-video/pull/1592)
- Replaced RCTBubblingEventBlock events by RCTDirectEventBlock to avoid event name collisions [#1625](https://github.com/react-native-community/react-native-video/pull/1625)
- Added `onPlaybackRateChange` to README [#1578](https://github.com/react-native-community/react-native-video/pull/1578)
- Added `onReadyForDisplay` to README [#1627](https://github.com/react-native-community/react-native-video/pull/1627)
- Improved handling of poster image. Fixes bug with displaying video and poster simultaneously. [#1627](https://github.com/react-native-community/react-native-video/pull/1627)
- Fix background audio stopping on iOS when using `controls` [#1614](https://github.com/react-native-community/react-native-video/pull/1614)

### Version 4.4.1

- Fix tvOS picture-in-picture compilation regression [#1518](https://github.com/react-native-community/react-native-video/pull/1518)
- fullscreen rotation issues with iOS built-in controls [#1441](https://github.com/react-native-community/react-native-video/pull/1441)
- Fix player freeze when playing audio files on ExoPlayer [#1529](https://github.com/react-native-community/react-native-video/pull/1529)

### Version 4.4.0

- Fix runtime warning by replacing `UIManager.RCTVideo` with `UIManager.getViewManagerConfig('RCTVideo')` (and ensuring backwards compat) [#1487](https://github.com/react-native-community/react-native-video/pull/1487)
- Fix loading package resolved videos when using video-caching [#1438](https://github.com/react-native-community/react-native-video/pull/1438)
- Fix "message sent to deallocated instance" crash on ios [#1482](https://github.com/react-native-community/react-native-video/pull/1482)
- Display a warning when source is empty [#1478](https://github.com/react-native-community/react-native-video/pull/1478)
- Don't crash on iOS for an empty source [#1246](https://github.com/react-native-community/react-native-video/pull/1246)
- Recover from from transient internet failures when loading on ExoPlayer [#1448](https://github.com/react-native-community/react-native-video/pull/1448)
- Add controls support for ExoPlayer [#1414](https://github.com/react-native-community/react-native-video/pull/1414)
- Fix check for text tracks when iOS caching enabled [#1387](https://github.com/react-native-community/react-native-video/pull/1387)
- Add support for Picture in Picture on iOS [#1325](https://github.com/react-native-community/react-native-video/pull/1325)
- Fix UIManager undefined variable [#1488](https://github.com/react-native-community/react-native-video/pull/1488)

### Version 4.3.0

- Fix iOS video not displaying after switching source [#1395](https://github.com/react-native-community/react-native-video/pull/1395)
- Add the filterEnabled flag, fixes iOS video start time regression [#1384](https://github.com/react-native-community/react-native-video/pull/1384)
- Fix text not appearing in release builds of Android apps [#1373](https://github.com/react-native-community/react-native-video/pull/1373)
- Update to ExoPlayer 2.9.3 [#1406](https://github.com/react-native-community/react-native-video/pull/1406)
- Add video track selection & onBandwidthUpdate [#1199](https://github.com/react-native-community/react-native-video/pull/1199)
- Recovery from transient internet failures and props to configure the custom retry count [#1448](https://github.com/react-native-community/react-native-video/pull/1448)

### Version 4.2.0

- Don't initialize filters on iOS unless a filter is set. This was causing a startup performance regression [#1360](https://github.com/react-native-community/react-native-video/pull/1360)
- Support setting the maxBitRate [#1310](https://github.com/react-native-community/react-native-video/pull/1310)
- Fix useTextureView not defaulting to true [#1383](https://github.com/react-native-community/react-native-video/pull/1383)
- Fix crash on MediaPlayer w/ Android 4.4 & avoid memory leak [#1328](https://github.com/react-native-community/react-native-video/pull/1328)

### Version 4.1.0

- Generate onSeek on Android ExoPlayer & MediaPlayer after seek completes [#1351](https://github.com/react-native-community/react-native-video/pull/1351)
- Remove unneeded onVideoSaved event [#1350](https://github.com/react-native-community/react-native-video/pull/1350)
- Disable AirPlay if sidecar text tracks are enabled [#1304](https://github.com/react-native-community/react-native-video/pull/1304)
- Add possibility to remove black screen while video is loading in Exoplayer [#1355](https://github.com/react-native-community/react-native-video/pull/1355)

### Version 4.0.1

- Add missing files to package.json [#1342](https://github.com/react-native-community/react-native-video/pull/1342)

### Version 4.0.0

- Partial support for timed metadata on Android MediaPlayer [#707](https://github.com/react-native-community/react-native-video/pull/707)
- Support video caching for iOS [#955](https://github.com/react-native-community/react-native-video/pull/955)
- Video caching cleanups [#1172](https://github.com/react-native-community/react-native-video/pull/1172)
- Add ipod-library support [#926](https://github.com/react-native-community/react-native-video/pull/926/files)
- Fix crash on ExoPlayer when there are no audio tracks [#1233](https://github.com/react-native-community/react-native-video/pull/1233)
- Reduce package size [#1231](https://github.com/react-native-community/react-native-video/pull/1231)
- Remove unnecessary import in TextTrackType [#1229](https://github.com/react-native-community/react-native-video/pull/1229)
- Prevent flash between poster and video [#1167](https://github.com/react-native-community/react-native-video/pull/1167)
- Support react-native-dom [#1253](https://github.com/react-native-community/react-native-video/pull/1253)
- Update to ExoPlayer 2.8.2. Android SDK 26 now required [#1170](https://github.com/react-native-community/react-native-video/pull/1170)
- Update to ExoPlayer 2.8.4 [#1266](https://github.com/react-native-community/react-native-video/pull/1266)
- Add fullscreenOrientation option for iOS [#1215](https://github.com/react-native-community/react-native-video/pull/1215)
- Update to ExoPlayer 2.9.0 [#1285](https://github.com/react-native-community/react-native-video/pull/1285)
- Switch useTextureView to default to `true` [#1286](https://github.com/react-native-community/react-native-video/pull/1286)
- Re-add fullscreenAutorotate prop [#1303](https://github.com/react-native-community/react-native-video/pull/1303)
- Make seek throw a useful error for NaN values [#1283](https://github.com/react-native-community/react-native-video/pull/1283)
- Video Filters and Save Video [#1306](https://github.com/react-native-community/react-native-video/pull/1306)
- Fix: volume should not change on onAudioFocusChange event [#1327](https://github.com/react-native-community/react-native-video/pull/1327)
- Update ExoPlayer to 2.9.1 and OkHTTP to 3.12.0 [#1338](https://github.com/react-native-community/react-native-video/pull/1338)

### Version 3.2.0

- Basic fullscreen support for Android MediaPlayer [#1138](https://github.com/react-native-community/react-native-video/pull/1138)
- Simplify default Android SDK code [#1145](https://github.com/react-native-community/react-native-video/pull/1145) [#1146](https://github.com/react-native-community/react-native-video/pull/1146)
- Various iOS sideloaded text track fixes [#1157](https://github.com/react-native-community/react-native-video/pull/1157)
- Fix #1150 where assets with bundled assets don't work on iOS in release mode [#1162](https://github.com/react-native-community/react-native-video/pull/1162)
- Support configuring the buffer on Android ExoPlayer [#1160](https://github.com/react-native-community/react-native-video/pull/1160)
- Prevent sleep from sleeping while videos are playing on Android MediaPlayer [#1117](https://github.com/react-native-community/react-native-video/pull/1117)
- Update NewtonSoft JSON to match react-native-windows version [#1169](https://github.com/react-native-community/react-native-video/pull/1169)

### Version 3.1.0

- Support sidecar text tracks on iOS [#1109](https://github.com/react-native-community/react-native-video/pull/1109)
- Support onAudioBecomingNoisy on iOS [#1131](https://github.com/react-native-community/react-native-video/pull/1131)

### Version 3.0

- Inherit Android buildtools and SDK version from the root project [#1081](https://github.com/react-native-community/react-native-video/pull/1081)
- Automatically play on ExoPlayer when the paused prop is not set [#1083](https://github.com/react-native-community/react-native-video/pull/1083)
- Preserve Android MediaPlayer paused prop when backgrounding [#1082](https://github.com/react-native-community/react-native-video/pull/1082)
- Support specifying headers on ExoPlayer as part of the source [#805](https://github.com/react-native-community/react-native-video/pull/805)
- Prevent iOS onLoad event during seeking [#1088](https://github.com/react-native-community/react-native-video/pull/1088)
- ExoPlayer playableDuration incorrect [#1089](https://github.com/react-native-community/react-native-video/pull/1089)

### Version 2.3.1

- Revert PR to inherit Android SDK versions from root project. Re-add in 3.0 [#1080](https://github.com/react-native-community/react-native-video/pull/1080)

### Version 2.3.0

- Support allowsExternalPlayback on iOS [#1057](https://github.com/react-native-community/react-native-video/pull/1057)
- Inherit Android buildtools and SDK version from the root project [#999](https://github.com/react-native-community/react-native-video/pull/999)
- Fix bug that caused ExoPlayer to start paused if playInBackground was set [#833](https://github.com/react-native-community/react-native-video/pull/833)
- Fix crash if clearing an observer on iOS that was already cleared [#1075](https://github.com/react-native-community/react-native-video/pull/1075)
- Add audioOnly prop for music files [#1039](https://github.com/react-native-community/react-native-video/pull/1039)
- Support seeking with more exact tolerance on iOS [#1076](https://github.com/react-native-community/react-native-video/pull/1076)

### Version 2.2.0

- Text track selection support for iOS & ExoPlayer [#1049](https://github.com/react-native-community/react-native-video/pull/1049)
- Support outputting to a TextureView on Android ExoPlayer [#1058](https://github.com/react-native-community/react-native-video/pull/1058)
- Support changing the left/right balance on Android MediaPlayer [#1051](https://github.com/react-native-community/react-native-video/pull/1051)
- Prevent multiple onEnd notifications on iOS [#832](https://github.com/react-native-community/react-native-video/pull/832)
- Fix doing a partial swipe on iOS causing a black screen [#1048](https://github.com/react-native-community/react-native-video/pull/1048)
- Fix crash when switching to a new source on iOS [#974](https://github.com/react-native-community/react-native-video/pull/974)
- Add cookie support for ExoPlayer [#922](https://github.com/react-native-community/react-native-video/pull/922)
- Remove ExoPlayer onMetadata that wasn't being used [#1040](https://github.com/react-native-community/react-native-video/pull/1040)
- Fix bug where setting the progress interval on iOS didn't work [#800](https://github.com/react-native-community/react-native-video/pull/800)
- Support setting the poster resize mode [#595](https://github.com/react-native-community/react-native-video/pull/595)