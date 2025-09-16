//
//  PlayerViewProxy.swift
//  react-native-video
//
//  Created by Nick on 1/3/24.
//

import React
import AVDoris
import RNDReactNativeDiceVideo

class PlayerViewProxy {
    private static func convertRNVideoImaToRNDV(sourceIma: Source.Ima?) -> JSIma? {
        var jsIma: JSIma?
        if let ima = sourceIma {
            jsIma = JSIma(
                videoId: ima.videoId,
                adTagParameters: ima.adTagParameters,
                endDate: ima.endDate,
                startDate: ima.startDate,
                assetKey: ima.assetKey,
                contentSourceId: ima.contentSourceId,
                authToken: ima.authToken)
        }
        return jsIma
    }
    
    private static func convertRNVideoDrmToRNDV(sourceDrm: Source.Drm?) -> JSDrm? {
        var jsDrm: JSDrm?
        if let drm = sourceDrm {
            jsDrm = JSDrm(
                contentUrl: drm.contentUrl,
                drmScheme: drm.drmScheme,
                offlineLicense: nil,
                id: drm.id,
                croToken: drm.croToken,
                licensingServerUrl: drm.licensingServerUrl)
        }
        return jsDrm
    }
    
    private static func convertRNVideoConfigToRNDV(sourceConfig: Source.Config?) -> JSConfig? {
        var jsConfig: JSConfig?
        if let config = sourceConfig {
            let jsMuxData = JSConfig.JSMuxData(
                envKey: config.muxData.envKey,
                videoTitle: config.muxData.videoTitle,
                viewerUserId: config.muxData.viewerUserId,
                playerVersion: config.muxData.playerVersion,
                videoId: config.muxData.videoId,
                playerName: config.muxData.playerName,
                videoStreamType: config.muxData.videoStreamType,
                subPropertyId: config.muxData.subPropertyId,
                videoIsLive: config.muxData.videoIsLive,
                experimentName: config.muxData.experimentName,
                videoSeries: nil,
                videoCdn: nil,
                videoDuration: nil,
                correlationId: config.muxData.correlationId)
            jsConfig = JSConfig(muxData: jsMuxData, beacon: nil, convivaData: nil)
        }
        return jsConfig
    }
    
    private static func convertRNVideoTranslationsToRNDV(translations: Translations?) -> JSTranslations? {
        guard let translations else { return nil }
        let dorisTranslationsViewModel = convertRNVideoTranslationsToDorisTranslations(translations: translations)
        return JSTranslations(beaconTranslations: nil, dorisTranslations: dorisTranslationsViewModel)
    }

    static func convertRNVideoTranslationsToDorisTranslations(translations: Translations) -> DorisTranslationsViewModel {
        var dorisTranslationsViewModel = DorisTranslationsViewModel()
        dorisTranslationsViewModel.play = translations.playerPlayButton
        dorisTranslationsViewModel.pause = translations.playerPauseButton
        dorisTranslationsViewModel.stats = translations.playerStatsButton
        dorisTranslationsViewModel.audioAndSubtitles = translations.playerAudioAndSubtitlesButton
        dorisTranslationsViewModel.live = translations.goLive
        dorisTranslationsViewModel.favourites = translations.favourite
        dorisTranslationsViewModel.addToWatchlist = translations.addToWatchlist
        dorisTranslationsViewModel.moreVideos = translations.moreVideos
        dorisTranslationsViewModel.audio = translations.audioTracks
        dorisTranslationsViewModel.info = translations.info
        dorisTranslationsViewModel.adsCountdownAd = translations.adsCountdownAd
        dorisTranslationsViewModel.adsCountdownOf = translations.adsCountdownOf
        dorisTranslationsViewModel.annotations = translations.annotations
        dorisTranslationsViewModel.playingLive = translations.playingLive
        dorisTranslationsViewModel.nowPlaying = translations.nowPlaying
        dorisTranslationsViewModel.subtitles = translations.captions
        dorisTranslationsViewModel.skipIntro = translations.skipIntro
        dorisTranslationsViewModel.skipCredits = translations.skipCredits
        dorisTranslationsViewModel.rewind = translations.rewind
        dorisTranslationsViewModel.fastForward = translations.fastForward
        dorisTranslationsViewModel.off = translations.off
        dorisTranslationsViewModel.audioOnlyBadge = translations.audioOnlyBadge
        dorisTranslationsViewModel.schedule = translations.tvPlayerEPG
        dorisTranslationsViewModel.unknown = translations.unknown
        dorisTranslationsViewModel.seconds = translations.seconds
        dorisTranslationsViewModel.seekSpeedTooltip = translations.seekSpeedTooltip
        return dorisTranslationsViewModel
    }

    private static func convertRNVideoButtonsToRNDV(buttons: Buttons?) -> JSButtons? {
        var jsButtons: JSButtons?
        if let buttonsValue = buttons {
            jsButtons = JSButtons(
                fullscreen: buttonsValue.fullscreen,
                stats: buttonsValue.stats,
                favourite: buttonsValue.favourite,
                zoom: buttonsValue.zoom,
                back: buttonsValue.back,
                settings: buttonsValue.settings,
                info: buttonsValue.info,
                share: nil,
                watchlist: buttonsValue.watchlist,
                epg: buttonsValue.epg,
                annotations: buttonsValue.annotations)
        }
        return jsButtons
    }
    
    private static func convertRNVideoThemeToRNDV(theme: Theme?) -> JSTheme? {
        var jsTheme: JSTheme?
        if let themeValue = theme {
            let fonts = JSTheme.JSFonts(
                secondaryFontName: themeValue.fonts.secondary,
                primaryFontName: themeValue.fonts.primary,
                tertiaryFontName: "")
            let colors = JSTheme.JSColors(
                accentColor: themeValue.colors.primary,
                backgroundColor: nil)
            jsTheme = JSTheme(fonts: fonts, colors: colors)
        }
        return jsTheme
    }
    
    private static func convertRNVideoOverlayConfigToRNDV(overlayConfig: OverlayConfig?) -> JSOverlayConfig? {
        var jsOverlayConfig: JSOverlayConfig?
        if let overlayConfigValue = overlayConfig {
            let overlayType = JSOverlayConfig.JSOverlayConfigType(rawValue: overlayConfigValue.type.rawValue)
            let buttonIconUrl = overlayConfigValue.button
            let componentsArray = overlayConfigValue.components
            let components: [JSOverlayConfig.JSOverlayComponent] = componentsArray.map { component in
                let componentType = JSOverlayConfig.JSOverlayConfigType(rawValue: component.type.rawValue)
                let name = component.name
                let initialProps = component.initialProps
                return JSOverlayConfig.JSOverlayComponent(type: componentType ?? .side, name: name, initialProps: initialProps)
            }
            jsOverlayConfig = JSOverlayConfig(type: overlayType ?? .side, buttonIconUrl: buttonIconUrl, components: components)
        }
        return jsOverlayConfig
    }
    
    private static func convertRNVideoTracksPolicyToRNDV(tracksPolicy: react_native_video.JSTracksPolicy?) -> RNDReactNativeDiceVideo.JSTracksPolicy? {
        var jsTracksPolicy: RNDReactNativeDiceVideo.JSTracksPolicy?
        if let items = tracksPolicy?.items.map({ trackPolicyPair -> RNDReactNativeDiceVideo.JSTrackPolicyPair in
            return RNDReactNativeDiceVideo.JSTrackPolicyPair(audio: trackPolicyPair.audio, subtitle: trackPolicyPair.subtitle)
        }) {
            jsTracksPolicy = RNDReactNativeDiceVideo.JSTracksPolicy(items: items)
        }
        return jsTracksPolicy
    }
    
    private static func convertRNVideoReleatedVideosToRNDV(relatedVideos: RelatedVideos?) -> JSPlaylist? {
        var jsPlaylist: JSPlaylist?
        if let playlist = relatedVideos {
            let jsPlaylistItems = playlist.items.map { relatedVideo -> JSPlaylist.JSPlaylistItem in
                return JSPlaylist.JSPlaylistItem(
                    id: relatedVideo.id,
                    thumbnailUrl: relatedVideo.thumbnailUrl,
                    title: relatedVideo.title ?? "",
                    duration: relatedVideo.duration ?? 0.0,
                    type: relatedVideo.type
                )
            }
            jsPlaylist = JSPlaylist(items: jsPlaylistItems, headIndex: playlist.headIndex)
        }
        return jsPlaylist
    }
    
    private static func convertRNVideoSkipMarkersToRNDV(skipMarkers: [Source.RNSkipMarker]?) -> [JSSkipMarker]? {
        return skipMarkers?.map {
            let rndvType: JSSkipMarker.JSSkipMarkerType
            
            switch $0.type {
            case .SKIP_CREDITS: rndvType = .SKIP_CREDITS
            case .SKIP_INTRO: rndvType = .SKIP_INTRO
            }
            
            return JSSkipMarker(startTime: $0.startTime, stopTime: $0.stopTime, type: rndvType)
        }
    }
    
    static func convertRNVideoJSPropsToRNDV(jsProps: JSProps) -> RNDReactNativeDiceVideo.JSProps {
        let rndvJsProps = RNDReactNativeDiceVideo.JSProps()
        rndvJsProps.isFullScreen.value = true
        rndvJsProps.isMinimiseButton.value = false
        rndvJsProps.isFavourite.value = jsProps.isFavourite.value
        rndvJsProps.locale.value = jsProps.locale.value
        rndvJsProps.displayType.value = JSPlayerViewDisplayType(layoutType: .max)
        rndvJsProps.plugins.value = jsProps.source.value?.plugins

        var rndvJSSource: RNDReactNativeDiceVideo.JSSource?
        if let sourceValue = jsProps.source.value {
            let jsNowPlaying = RNDReactNativeDiceVideo.JSNowPlaying(
                title: sourceValue.nowPlaying?.title ?? jsProps.metadata.value?.title,
                channelLogoUrl: sourceValue.nowPlaying?.channelLogoUrl,
                episodeInfo: jsProps.metadata.value?.episodeInfo, //tvos new
                startDate: sourceValue.nowPlaying?.startDate,
                endDate: sourceValue.nowPlaying?.endDate,
                dateFormat: sourceValue.nowPlaying?.dateFormat)
            rndvJsProps.nowPlaying.value = jsNowPlaying
            
            let rndvJSIma = PlayerViewProxy.convertRNVideoImaToRNDV(sourceIma: sourceValue.ima)
            let rndvJSDrm = PlayerViewProxy.convertRNVideoDrmToRNDV(sourceDrm: sourceValue.drm)
            let jsPartialVideoInformation = JSPartialVideoInformation(
                title: sourceValue.partialVideoInformation?.title,
                imageUri: sourceValue.partialVideoInformation?.imageUri)
            let jsConfig = PlayerViewProxy.convertRNVideoConfigToRNDV(sourceConfig: sourceValue.config)
            var jsSubtitles: [RNDReactNativeDiceVideo.JSSubtitles]?
            if let subtitles = sourceValue.subtitles {
                jsSubtitles = [RNDReactNativeDiceVideo.JSSubtitles]()
                for subtitle in subtitles {
                    jsSubtitles!.append(RNDReactNativeDiceVideo.JSSubtitles(language: subtitle.language, uri: subtitle.uri))
                }
            }
            let jsLimitedSeekableRange = RNDReactNativeDiceVideo.JSLimitedSeekableRange(start: sourceValue.limitedSeekableRange?.start, end: sourceValue.limitedSeekableRange?.end, seekToStart: sourceValue.limitedSeekableRange?.seekToStart)
            
            let metadata = JSMetadata(metadata: sourceValue.metadata)

            rndvJSSource = RNDReactNativeDiceVideo.JSSource(
                id: sourceValue.id ?? "",
                ima: rndvJSIma,
                uri: sourceValue.uri,
                drm: rndvJSDrm,
                progressUpdateInterval: sourceValue.progressUpdateInterval ?? 6,
                type: sourceValue.type,
                title: sourceValue.nowPlaying?.title ?? jsProps.metadata.value?.title ?? sourceValue.title ?? "",
                description: jsProps.metadata.value?.description, //tvos new
                live: sourceValue.live,
                partialVideoInformation: jsPartialVideoInformation,
                isAudioOnly: sourceValue.isAudioOnly,
                config: jsConfig,
                imageUri: jsProps.metadata.value?.thumbnailUrl,
                thumbnailsPreview: sourceValue.thumbnailsPreview,
                resumePosition: sourceValue.resumePosition,
                delay: nil,
                ads: sourceValue.ads,
                metadata: metadata,
                subtitles: jsSubtitles,
                limitedSeekableRange: jsLimitedSeekableRange,
                selectedAudioTrack: nil,
                selectedSubtitleTrack: sourceValue.selectedSubtitleTrack,
                bandwidthPolicy: nil,
                nowPlaying: jsNowPlaying,
                preferredAudioTracks: sourceValue.preferredAudioTracks,
                watchContext: nil,
                is4K: sourceValue.is4K)
        }

        let jsTranslations = PlayerViewProxy.convertRNVideoTranslationsToRNDV(translations: jsProps.translations.value)
        let jsButtons = PlayerViewProxy.convertRNVideoButtonsToRNDV(buttons: jsProps.buttons.value)
        let jsTheme = PlayerViewProxy.convertRNVideoThemeToRNDV(theme: jsProps.theme.value)
        let jsOverlayConfig = PlayerViewProxy.convertRNVideoOverlayConfigToRNDV(overlayConfig: jsProps.overlayConfig.value)
        let jsTracksPolicy = PlayerViewProxy.convertRNVideoTracksPolicyToRNDV(tracksPolicy: jsProps.source.value?.tracksPolicy)
        let jsPlaylist = PlayerViewProxy.convertRNVideoReleatedVideosToRNDV(relatedVideos: jsProps.relatedVideos.value)
        let skipMarkers = PlayerViewProxy.convertRNVideoSkipMarkersToRNDV(skipMarkers: jsProps.source.value?.skipMarkers)
        let seekForwardInterval = jsProps.source.value?.dvrSeekForwardInterval ?? 30
        let seekBackwardInterval = jsProps.source.value?.dvrSeekBackwardInterval ?? 30
        
        let rndvJSVideoDataConfig = RNDReactNativeDiceVideo.JSVideoData.JSVideoDataConfig(
            translations: jsTranslations,
            buttons: jsButtons,
            theme: jsTheme,
            playlist: jsPlaylist,
            testIdentifiers: nil,
            annotations: nil,
            overlayConfig: jsOverlayConfig,
            plugins: jsProps.source.value?.plugins,
            tracksPolicy: jsTracksPolicy,
            isFullScreen: true,
            allowAirplay: false,
            canMinimise: false,
            isPipEnabled: false,
            canShareplay: false,
            isPlaybackQualityChangeAllowed: false,
            isAutoPlayNextEnabled: false,
            skipMarkers: skipMarkers,
            seekForwardInterval: seekForwardInterval,
            seekBackwardInterval: seekBackwardInterval,
            hideAdUiElements: jsProps.hideAdUiElements.value,
            isWhyThisAdIconEnabled: jsProps.isWhyThisAdIconEnabled.value,
            isPlayPauseEnabled: jsProps.isPlayPauseEnabled.value)
        
        if let rndvJSSource = rndvJSSource {
            let jsVideoData = RNDReactNativeDiceVideo.JSVideoData(source: rndvJSSource, config: rndvJSVideoDataConfig)
            rndvJsProps.videoData.value = jsVideoData
        }
        return rndvJsProps
    }
}
