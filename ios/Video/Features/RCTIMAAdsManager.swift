#if USE_GOOGLE_IMA
import Foundation
import GoogleInteractiveMediaAds

class RCTIMAAdsManager: NSObject, IMAAdsLoaderDelegate, IMAAdsManagerDelegate, IMALinkOpenerDelegate {
    private weak var _video: RCTVideo?
    private var _isPictureInPictureActive: () -> Bool

    /* Entry point for the SDK. Used to make ad requests. */
    private var adsLoader: IMAAdsLoader!
    /* Main point of interaction with the SDK. Created by the SDK as the result of an ad request. */
    private var adsManager: IMAAdsManager!

    // ✅ NEW: keep a reference to the overlay so we can remove it later
    private weak var adContainerView: UIView?

    init(video: RCTVideo!, isPictureInPictureActive: @escaping () -> Bool) {
        _video = video
        _isPictureInPictureActive = isPictureInPictureActive
        super.init()
    }

    func setUpAdsLoader() {
        guard let _video else { return }
        let settings = IMASettings()
        if let adLanguage = _video.getAdLanguage() {
            settings.language = adLanguage
        }
        adsLoader = IMAAdsLoader(settings: settings)
        adsLoader.delegate = self
    }

    func requestAds() {
        guard let _video else { return }

        // ✅ Create lightweight overlay to avoid retain cycle AND store a reference
        let container = UIView(frame: _video.bounds)
        container.backgroundColor = .clear
        container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.isUserInteractionEnabled = true
        _video.addSubview(container)
        self.adContainerView = container

        // Create ad display container for ad rendering.
        let adDisplayContainer = IMAAdDisplayContainer(
            adContainer: container,
            viewController: _video.reactViewController()
        )

        let adTagUrl = _video.getAdTagUrl()
        let contentPlayhead = _video.getContentPlayhead()

        if let adTagUrl, let contentPlayhead {
            let request = IMAAdsRequest(
                adTagUrl: adTagUrl,
                adDisplayContainer: adDisplayContainer,
                contentPlayhead: contentPlayhead,
                userContext: nil
            )
            adsLoader.requestAds(with: request)
        }
    }

    func releaseAds() {
        // ✅ Always clean overlay + tear down loader/manager
        if let adsManager {
            adsManager.volume = 0
            adsManager.pause()
            adsManager.destroy()
        }
        self.adsManager = nil
        self.adsLoader?.delegate = nil
        self.adsLoader = nil
        removeAdOverlayIfNeeded()
    }

    // MARK: - Getters
    func getAdsLoader() -> IMAAdsLoader? { adsLoader }
    func getAdsManager() -> IMAAdsManager? { adsManager }

    // MARK: - IMAAdsLoaderDelegate

    func adsLoader(_ : IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
        guard let _video else { return }
        adsManager = adsLoadedData.adsManager
        adsManager?.delegate = self

        let adsRenderingSettings = IMAAdsRenderingSettings()
        adsRenderingSettings.linkOpenerDelegate = self
        adsRenderingSettings.linkOpenerPresentingController = _video.reactViewController()

        adsManager.initialize(with: adsRenderingSettings)
    }

    func adsLoader(_ : IMAAdsLoader, failedWith adErrorData: IMAAdLoadingErrorData) {
        if let msg = adErrorData.adError.message {
            print("Error loading ads: " + msg)
        }
        // ✅ Fallback: resume content & remove overlay
        removeAdOverlayIfNeeded()
        _video?.setAdPlaying(false)
        _video?.setPaused(false)
    }

    // MARK: - IMAAdsManagerDelegate

    func adsManager(_ adsManager: IMAAdsManager, didReceive event: IMAAdEvent) {
        guard let _video else { return }

        if _video.isMuted() { adsManager.volume = 0 }

        // Start ads when LOADED (if not PiP)
        if event.type == .LOADED {
            if _isPictureInPictureActive() { return }
            adsManager.start()
        }

        // ✅ Extra safety: when ALL_ADS_COMPLETED, clean overlay (sometimes resume comes late)
        if event.type == .ALL_ADS_COMPLETED {
            removeAdOverlayIfNeeded()
        }

        if let onReceive = _video.onReceiveAdEvent {
            let type = convertEventToString(event: event.type)
            if let data = event.adData {
                onReceive(["event": type, "data": data, "target": _video.reactTag!])
            } else {
                onReceive(["event": type, "target": _video.reactTag!])
            }
        }
    }

    func adsManager(_ : IMAAdsManager, didReceive error: IMAAdError) {
        if let msg = error.message {
            print("AdsManager error: " + msg)
        }

        guard let _video else { return }

        if let onReceive = _video.onReceiveAdEvent {
            onReceive([
                "event": "ERROR",
                "data": ["message": error.message ?? "", "code": error.code, "type": error.type],
                "target": _video.reactTag!,
            ])
        }

        // ✅ Fallback: resume content & remove overlay
        removeAdOverlayIfNeeded()
        _video.setAdPlaying(false)
        _video.setPaused(false)
    }

    func adsManagerDidRequestContentPause(_ : IMAAdsManager) {
        _video?.setPaused(true)
        _video?.setAdPlaying(true)
    }

    func adsManagerDidRequestContentResume(_ : IMAAdsManager) {
        // ✅ Resume + remove overlay to unblock touches
        _video?.setAdPlaying(false)
        _video?.setPaused(false)
        removeAdOverlayIfNeeded()
    }

    // MARK: - IMALinkOpenerDelegate

    func linkOpenerDidClose(inAppLink _: NSObject) {
        adsManager?.resume()
    }

    // MARK: - Helpers

    private func removeAdOverlayIfNeeded() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            if let v = self.adContainerView {
                v.subviews.forEach { $0.removeFromSuperview() }
                v.removeFromSuperview()
            }
            self.adContainerView = nil
        }
    }

    func convertEventToString(event: IMAAdEventType!) -> String {
        switch event {
        case .AD_BREAK_READY: return "AD_BREAK_READY"
        case .AD_BREAK_ENDED: return "AD_BREAK_ENDED"
        case .AD_BREAK_STARTED: return "AD_BREAK_STARTED"
        case .AD_PERIOD_ENDED: return "AD_PERIOD_ENDED"
        case .AD_PERIOD_STARTED: return "AD_PERIOD_STARTED"
        case .ALL_ADS_COMPLETED: return "ALL_ADS_COMPLETED"
        case .CLICKED: return "CLICK"
        case .COMPLETE: return "COMPLETED"
        case .CUEPOINTS_CHANGED: return "CUEPOINTS_CHANGED"
        case .FIRST_QUARTILE: return "FIRST_QUARTILE"
        case .LOADED: return "LOADED"
        case .LOG: return "LOG"
        case .MIDPOINT: return "MIDPOINT"
        case .PAUSE: return "PAUSED"
        case .RESUME: return "RESUMED"
        case .SKIPPED: return "SKIPPED"
        case .STARTED: return "STARTED"
        case .STREAM_LOADED: return "STREAM_LOADED"
        case .TAPPED: return "TAPPED"
        case .THIRD_QUARTILE: return "THIRD_QUARTILE"
        default: return "UNKNOWN"
        }
    }
}
#endif
