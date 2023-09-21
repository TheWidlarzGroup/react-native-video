import Foundation
import AVFoundation
import DVAssetLoaderDelegate
import Promises

enum RCTVideoCacheStatus: UInt {
    case missingFileExtension
    case unsupportedFileExtension
    case notAvailable
    case available
}

class RCTVideoCachingHandler: NSObject, DVAssetLoaderDelegatesDelegate {

    static let instance = RCTVideoCachingHandler()
    
    private var _cacheStorage = RCTVideoCacheStorage.instance
    var playerItemPrepareText: ((AVAsset?, NSDictionary?) -> AVPlayerItem)?

    /// The AVAssetDownloadURLSession to use for managing AVAssetDownloadTasks.
    private var assetDownloadURLSession: AVAssetDownloadURLSession!

    /// Internal map of AVAggregateAssetDownloadTask to its corresponding Asset.
    private var activeDownloadsMap: [AVAggregateAssetDownloadTask: AVURLAsset] = [:]

    /// Internal map of AVAggregateAssetDownloadTask to download URL.
    private var willDownloadToUrlMap: [AVAggregateAssetDownloadTask: URL] = [:]

    private var queuedAssetsMap: [URL: AVURLAsset] = [:]

    private override init() {
        super.init()
        // Create the configuration for the AVAssetDownloadURLSession.
        let backgroundConfiguration = URLSessionConfiguration.background(withIdentifier: "AAPL-Identifier")

        // Create the AVAssetDownloadURLSession using the configuration.
        self.assetDownloadURLSession = AVAssetDownloadURLSession(
            configuration: backgroundConfiguration,
            assetDownloadDelegate: self,
            delegateQueue: OperationQueue.main
        )
    }
    
    func shouldCache(source: VideoSource, textTracks:[TextTrack]?) -> Bool {
        if source.isNetwork && source.shouldCache && ((textTracks == nil) || (textTracks!.count == 0)) {
            /* The DVURLAsset created by cache doesn't have a tracksWithMediaType property, so trying
             * to bring in the text track code will crash. I suspect this is because the asset hasn't fully loaded.
             * Until this is fixed, we need to bypass caching when text tracks are specified.
             */
            DebugLog("Caching is not supported for uri '\(source.uri)' because text tracks are not compatible with the cache. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
            return true
        }
        return false
    }
    
    func playerItemForSourceUsingCache(uri:String!, assetOptions options:NSDictionary!) -> Promise<AVPlayerItem?> {
        let url = URL(string: uri)
        return getItemForUri(uri)
        .then{ [weak self] (videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?) -> AVPlayerItem in
            guard let self = self, let playerItemPrepareText = self.playerItemPrepareText else {throw  NSError(domain: "", code: 0, userInfo: nil)}
            switch (videoCacheStatus) {
            case .missingFileExtension:
                DebugLog("Could not generate cache key for uri '\(uri)'. It is currently not supported to cache urls that do not include a file extension. The video file will not be cached. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
                let asset:AVURLAsset! = AVURLAsset(url: url!, options:options as! [String : Any])
                return playerItemPrepareText(asset, options)
                
            case .unsupportedFileExtension:
                DebugLog("Could not generate cache key for uri '\(uri)'. The file extension of that uri is currently not supported. The video file will not be cached. Checkout https://github.com/react-native-community/react-native-video/blob/master/docs/caching.md")
                let asset:AVURLAsset! = AVURLAsset(url: url!, options:options as! [String : Any])
                return playerItemPrepareText(asset, options)
                
            default:
                if let cachedAsset = cachedAsset {
                    DebugLog("Playing back uri '\(uri)' from cache")
                    // See note in playerItemForSource about not being able to support text tracks & caching
                    return AVPlayerItem(asset: cachedAsset)
                }
            }
            
            let asset:DVURLAsset! = DVURLAsset(url:url, options:options as! [String : Any], networkTimeout:10000)
            asset.loaderDelegate = self
            
            /* More granular code to have control over the DVURLAsset
             let resourceLoaderDelegate = DVAssetLoaderDelegate(url: url)
             resourceLoaderDelegate.delegate = self
             let components = NSURLComponents(url: url, resolvingAgainstBaseURL: false)
             components?.scheme = DVAssetLoaderDelegate.scheme()
             var asset: AVURLAsset? = nil
             if let url = components?.url {
             asset = AVURLAsset(url: url, options: options)
             }
             asset?.resourceLoader.setDelegate(resourceLoaderDelegate, queue: DispatchQueue.main)
             */
            
            return AVPlayerItem(asset: asset)
        }
    }

    func getItemForUri(_ uri:String) ->  Promise<(videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?)> {
        return Promise<(videoCacheStatus:RCTVideoCacheStatus,cachedAsset:AVAsset?)> { [weak self] fulfill, reject in

            guard let self = self, let assetURL = URL(string: uri)
            else {
                reject(NSError(domain: "", code: 2))
                return
            }

            let cachedAsset: AVAsset
            let videoCacheStatus: RCTVideoCacheStatus

            if let localFileLocation = self._cacheStorage.storedItemUrl(forUrl: assetURL) {
                cachedAsset = AVURLAsset(url: localFileLocation)
                videoCacheStatus = .available
            } else {
                let queuedAssets = self.getQueuedAsset(forUrl: assetURL)
                cachedAsset = queuedAssets
                videoCacheStatus = .notAvailable
            }

            fulfill((videoCacheStatus, cachedAsset))
        }
    }

    func getQueuedAsset(forUrl assetUrl: URL) -> AVURLAsset {
        guard let queuedAssets = queuedAssetsMap[assetUrl] else {
            let newAsset = AVURLAsset(url: assetUrl)
            queuedAssetsMap[assetUrl] = newAsset
            return newAsset
        }
        return queuedAssets
    }
    
    // MARK: - DVAssetLoaderDelegate
    
    func dvAssetLoaderDelegate(loaderDelegate:DVAssetLoaderDelegate!, didLoadData data:NSData!, forURL url:NSURL!) {
    }

    // MARK: - Prefetching

    func cacheVideoForUrl(_ url: String) {
        DispatchQueue.main.async {
            guard let assetURL = URL(string: url),
                  !self.willDownloadToUrlMap.values.contains(where: { $0.absoluteString == url}),
                  self._cacheStorage.storedItemUrl(forUrl: assetURL) == nil
            else { return }

            self.downloadStream(for: assetURL)
            urls.insert(assetURL)
            print("************************************** \(urls.count)")
        }
    }

    /// Triggers the initial AVAssetDownloadTask for a given Asset.
    /// - Tag: DownloadStream
    func downloadStream(for assetURL: URL) {

        let urlAsset = getQueuedAsset(forUrl: assetURL)

        // Get the default media selections for the asset's media selection groups.
        let preferredMediaSelection = urlAsset.preferredMediaSelection

        /*
         Creates and initializes an AVAggregateAssetDownloadTask to download multiple AVMediaSelections
         on an AVURLAsset.

         For the initial download, we ask the URLSession for an AVAssetDownloadTask with a minimum bitrate
         corresponding with one of the lower bitrate variants in the asset.
         */
        guard let task =
                assetDownloadURLSession.aggregateAssetDownloadTask(with: urlAsset,
                                                                   mediaSelections: [preferredMediaSelection],
                                                                   assetTitle: "",
                                                                   assetArtworkData: nil,
                                                                   options:
                                                                    [AVAssetDownloadTaskMinimumRequiredMediaBitrateKey: 265_000]) else { return }

        // To better track the AVAssetDownloadTask, set the taskDescription to something unique for the sample.
        task.taskDescription = "asset.stream.download.task"

        activeDownloadsMap[task] = urlAsset

        task.resume()
    }

}

var urls = Set<URL>()

/**
 Extend `RCTVideoCachingHandler` to conform to the `AVAssetDownloadDelegate` protocol.
 */
extension RCTVideoCachingHandler: AVAssetDownloadDelegate {

    /// Tells the delegate that the task finished transferring data.
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let userDefaults = UserDefaults.standard

        /*
         This is the ideal place to begin downloading additional media selections
         once the asset itself has finished downloading.
         */
        guard let task = task as? AVAggregateAssetDownloadTask,
              let asset = activeDownloadsMap.removeValue(forKey: task) else { return }

        guard let downloadURL = willDownloadToUrlMap.removeValue(forKey: task) else { return }


        if let error = error as NSError? {
            switch (error.domain, error.code) {
            case (NSURLErrorDomain, NSURLErrorCancelled):
                /*
                 This task was canceled, you should perform cleanup using the
                 URL saved from AVAssetDownloadDelegate.urlSession(_:assetDownloadTask:didFinishDownloadingTo:).
                 */
                guard let localFileLocation = _cacheStorage.storedItemUrl(forUrl: asset.url) else { return }

                do {
                    try FileManager.default.removeItem(at: localFileLocation)
                } catch {
                    DebugLog("An error occured trying to delete the contents on disk for \(localFileLocation): \(error)")
                }

                break
            case (NSURLErrorDomain, NSURLErrorUnknown):
                fatalError("Downloading HLS streams is not supported in the simulator.")

            default:
                fatalError("An unexpected error occured \(error.localizedDescription)")
            }
        } else {
            _cacheStorage.storeItem(from: downloadURL, forUri: asset.url)

            guard let cashedAssetUrl =  _cacheStorage.storedItemUrl(forUrl: asset.url) else { return }
            let policy = AVMutableAssetDownloadStorageManagementPolicy()
            policy.expirationDate = Calendar.current.date(byAdding: .hour, value: 24, to: Date())!
            policy.priority = .default
            AVAssetDownloadStorageManager.shared().setStorageManagementPolicy(policy, for: cashedAssetUrl)
        }

    }

    /// Method called when the an aggregate download task determines the location this asset will be downloaded to.
    func urlSession(_ session: URLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask,
                    willDownloadTo location: URL) {

        /*
         This delegate callback should only be used to save the location URL
         somewhere in your application. Any additional work should be done in
         `URLSessionTaskDelegate.urlSession(_:task:didCompleteWithError:)`.
         */

        willDownloadToUrlMap[aggregateAssetDownloadTask] = location
    }

    /// Method called when a child AVAssetDownloadTask completes.
    func urlSession(_ session: URLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask,
                    didCompleteFor mediaSelection: AVMediaSelection) {
        /*
         This delegate callback provides an AVMediaSelection object which is now fully available for
         offline use. You can perform any additional processing with the object here.
         */

//        guard let asset = activeDownloadsMap[aggregateAssetDownloadTask] else { return }

        aggregateAssetDownloadTask.taskDescription = "asset.stream.download.task"

        aggregateAssetDownloadTask.resume()
    }

    /// Method to adopt to subscribe to progress updates of an AVAggregateAssetDownloadTask.
    func urlSession(_ session: URLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask,
                    didLoad timeRange: CMTimeRange, totalTimeRangesLoaded loadedTimeRanges: [NSValue],
                    timeRangeExpectedToLoad: CMTimeRange, for mediaSelection: AVMediaSelection) {

        // This delegate callback should be used to provide download progress for your AVAssetDownloadTask.
//        guard let asset = activeDownloadsMap[aggregateAssetDownloadTask] else { return }
//
//        var percentComplete = 0.0
//        for value in loadedTimeRanges {
//            let loadedTimeRange: CMTimeRange = value.timeRangeValue
//            percentComplete +=
//            loadedTimeRange.duration.seconds / timeRangeExpectedToLoad.duration.seconds
//        }
    }
}
