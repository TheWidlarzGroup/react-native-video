//
//  JSDoris.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 11.03.2022.
//

import AVDoris

class JSDoris {
    private let muxDataMapper: AVDorisMuxDataMapper = AVDorisMuxDataMapper()
    private let sourceMapper: AVDorisSourceMapper = AVDorisSourceMapper()
    private var adTagParametersModifier = AdTagParametersModifier()
    
    private var currentPlayerState: DorisPlayerState = .initialization
    private var currentPlayingItemDuration: Double?
        
    weak var output: JSInputProtocol?
    var doris: Doris?
    var jsBridge: RCTBridge?
    var props: JSProps = JSProps()
    
    deinit {
        doris?.player.stopMuxMonitoring()
    }
    
    func setup(with props: JSProps) {
        self.props = props
        
        props.overlayConfig.bindAndFire { [weak self] config in
            guard let self = self else { return }
            guard let config = config else { return }
            
            self.doris?.viewModel.overlay.overlayType = config.create(bridge: self.jsBridge)
        }
        
        props.relatedVideos.bindAndFire { [weak self] relatedVideos in
            guard let self = self else { return }
            guard let relatedVideos = relatedVideos else { return }
            
            let episodes = relatedVideos.items
                .map { EpisodeViewModel(url: $0.thumbnailUrl,
                                        title: $0.title ?? "",
                                        id: $0.id,
                                        type: StreamType(stringValue: $0.type),
                                        duration: $0.duration,
                                        isSelected: String($0.id) == self.props.source.value?.id) }
            self.doris?.viewModel.moreEpisodes.episodes = episodes
        }
        
        props.buttons.bindAndFire { [weak self] buttons in
            guard let self = self else { return }
            guard let buttons = buttons else { return }
            
            self.doris?.viewModel.toggles.isFavouriteButtonHidden = !buttons.favourite
            self.doris?.viewModel.toggles.isScheduleButtonHidden = !(buttons.epg ?? false)
            self.doris?.viewModel.toggles.isStatsButtonHidden = !buttons.stats
            self.doris?.viewModel.toggles.isAnnotationsButtonHidden = !(buttons.annotations ?? false)
        }
        
        props.metadata.bindAndFire { [weak self] metadata in
            guard let self = self else { return }
            self.doris?.viewModel.images.channelLogoViewModel.cropAlphaForLogo = true
            self.doris?.viewModel.images.channelLogoViewModel.logoURL = URL(string: metadata?.channelLogoUrl ?? "")
            self.doris?.viewModel.labels.metadata.title = metadata?.title
            self.doris?.viewModel.labels.metadata.description = metadata?.description
            self.doris?.viewModel.labels.metadata.episodeInfo = metadata?.episodeInfo
            self.doris?.viewModel.images.backgroundImageURL = metadata?.thumbnailUrl
            self.doris?.viewModel.images.watermarkViewModel = metadata?.watermarkModel ?? WatermarkViewModel()
        }
        
        props.controls.bindAndFire { [weak self] isEnabled in
            guard let self = self else { return }
            self.doris?.viewModel.toggles.isUIEnabled = isEnabled
        }
        
        props.isFavourite.bindAndFire { [weak self] isFavourite in
            guard let self = self else { return }
            self.doris?.viewModel.toggles.isFavourite = isFavourite
        }
        
        props.source.bindAndFire { [weak self] source in
            guard let self = self else { return }
            guard let source = source else { return }
            
            self.setupLimitedSeekableRange(with: source.limitedSeekableRange)
            self.setupMux(from: source)
            //FIXME: startAt
            self.setupPlayer(from: source, at: props.startAt.value)
            self.setupNowPlaying(nowPlaying: source.nowPlaying)
            self.doris?.viewModel.seekPreviews.bifsURL = source.thumbnailsPreview
        }
        
        props.translations.bindAndFire { [weak self] translations in
            guard let self = self, let translations = translations else { return }
            self.doris?.viewModel.rendering.translationsViewModel = DorisTranslationsViewModel(translations: translations)
        }
        
        props.theme.bindAndFire { [weak self] theme in
            guard let self = self else { return }
            self.doris?.viewModel.rendering.styleViewModel = DorisStyleViewModel(theme: theme)
            self.doris?.viewModel.seekBar.minimumDVRWindowToBeVisible = 120
            self.doris?.viewModel.toggles.shouldHideLiveBadgeWhenOnLiveEdge = true
        }
        
        props.nowPlaying.bindAndFire { [weak self] nowPlaying in
            guard let self = self else { return }
            self.setupNowPlaying(nowPlaying: nowPlaying)
        }
    }
    
    func replaceAdTagParameters(parameters: AdTagParameters, extraInfo: AdTagParametersModifierInfo) {
        adTagParametersModifier.prepareAdTagParameters(adTagParameters: parameters.adTagParameters,
                                                       info: extraInfo) { [weak self] newAdTagParameters in
            guard let self = self else { return }
            guard let newAdTagParameters = newAdTagParameters else { return }
            self.doris?.player.replaceAdTagParameters(adTagParameters: newAdTagParameters, validFrom: parameters.startDate, validUntil: parameters.endDate)
        }
    }
    
    private func setupNowPlaying(nowPlaying: JSNowPlaying?) {
        guard let nowPlaying = nowPlaying else { return }

        doris?.viewModel.labels.metadata.title = nowPlaying.title
        doris?.viewModel.images.channelLogoViewModel.logoURL = nowPlaying.channelLogoUrl
        if let programStart = nowPlaying.startDate,
           let programEnd = nowPlaying.endDate,
           let programStartDate = Date(timeIntervalSince1970InMilliseconds: programStart),
           let programEndDate = Date(timeIntervalSince1970InMilliseconds: programEnd) {
            doris?.viewModel.labels.metadata.programRanges = DorisProgramRanges(start: programStartDate, end: programEndDate, dateFormat: nowPlaying.dateFormat ?? "HH:mm")
        }
    }
    
    private func setupPlayer(from source: Source, at position: Double?) {
        sourceMapper.map(source: source, view: doris?.viewController.view) { [weak self] avDorisSource in
            guard let self = self else { return }
            
            var initialSeek: DorisSeekType?
            
            if let resumePosition = position {
                if source.live == true, let date = Date(timeIntervalSince1970InMilliseconds: resumePosition) {
                    initialSeek = .date(date)
                } else {
                    initialSeek = .position(resumePosition)
                }
            } else if let seekableRange = source.limitedSeekableRange, seekableRange.seekToStart == true, let startDate = Date(timeIntervalSince1970InMilliseconds: seekableRange.start) {
                initialSeek = .date(startDate)
            }
            
            switch avDorisSource {
            case .ima(let source):
                self.doris?.player.load(source: source, initialSeek: initialSeek)
            case .regular(let source):
                self.doris?.player.load(source: source, initialSeek: initialSeek)
            case .unknown:
                return
            }
        }
    }
    
    private func setupMux(from source: Source) {
        guard let avDorisMuxData = muxDataMapper.map(muxData: source.config.muxData) else { return }
        doris?.player.startMuxMonitoring(playerData: avDorisMuxData.playerData, videoData: avDorisMuxData.videoData)
    }
    
    func setupLimitedSeekableRange(with range: Source.LimitedSeekableRange?) {
        let start = Date(timeIntervalSince1970InMilliseconds: range?.start)
        let end = Date(timeIntervalSince1970InMilliseconds: range?.end)
        
        if let end = end, end > Date() {
            //avoid finishing playback when ongoing live program reaches its end
            doris?.player.setLimitedSeekableRange(range: (start: start, end: nil))
        } else {
            doris?.player.setLimitedSeekableRange(range: (start: start, end: end))
        }
    }
}


extension JSDoris: DorisOutputProtocol {
    func viewDidChangeState(old: AVDoris.DorisViewState, new: AVDoris.DorisViewState) {}
    
    func onPlayerStateChanged(old: DorisPlayerState, new: DorisPlayerState) {
        if currentPlayerState == .buffering {
            output?.onVideoBuffer?(["isBuffering": false])
        }
        
        currentPlayerState = new
        
        switch new {
        case .failed:
            output?.onVideoError?(nil)
        case .loaded:
            output?.onVideoLoad?(nil)
        case .loading,
             .buffering,
             .waitingForNetwork:
            output?.onVideoBuffer?(["isBuffering": true])
        case .paused:
            output?.onPlaybackRateChange?(["playbackRate": 0.0])
        case .playing:
            output?.onPlaybackRateChange?(["playbackRate": 1.0])
        default: break
        }
    }
    
    func onPlayerEvent(_ event: DorisPlayerEvent) {
        switch event {
        case .finishedPlaying(endTime: _):
            output?.onVideoEnd?(nil)
        case .currentTimeChanged(let seconds, _):
            if seconds > 0 {
                output?.onVideoProgress?(["currentTime": seconds])
            }
            
            if let duration = currentPlayingItemDuration {
                let isAboutToEnd = seconds >= duration - 5
                output?.onVideoAboutToEnd?(["isAboutToEnd": isAboutToEnd]);
            }
        case .itemDurationChanged(duration: let duration):
            currentPlayingItemDuration = duration
        case .playerItemFailed:
            output?.onVideoError?(nil)
        default: break
        }
    }
    
    func onAdvertisementEvent(_ event: DorisAdsEvent) {
        switch event {
        case .adTagParametersRequired(let data):
            output?.onRequireAdParameters?(["date": data.date.timeIntervalSince1970,
                                            "isBlocking": data.isBlocking])
        default: break
        }
    }
    
    func onViewEvent(_ event: DorisViewEvent) {
        switch event {
        case .favouritesButtonTap:
            output?.onFavouriteButtonClick?(nil)
        case .statsButtonTap:
            output?.onStatsIconClick?(nil)
        case .scheduleButtonTap:
            output?.onEpgIconClick?(nil)
        case .relatedVideoSelected(let model):
            guard let model = model else { return }
            output?.onRelatedVideoClicked?(["id": model.id, "type": model.type.stringValue])
        case .moreRelatedVideosTap:
            output?.onRelatedVideosIconClicked?(nil)
        case .backButtonTap:
            output?.onBackButton?(nil)
        case .annotationsButtonTap:
            output?.onAnnotationsButtonClick?(nil)
        default: break
        }
    }
}
