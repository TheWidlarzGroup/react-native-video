//
//  RCTVideoCacheDownloader.swift
//  react-native-video
//
//  Created by Mark Kryzhanouski on 25.09.23.
//

import Foundation
import AVFoundation
import DVAssetLoaderDelegate
import Promises

class RCTVideoCacheDownloader: NSObject {

    /// The AVAssetDownloadURLSession to use for managing AVAssetDownloadTasks.
    fileprivate var assetDownloadURLSession: AVAssetDownloadURLSession!

    /// Internal map of AVAggregateAssetDownloadTask to its corresponding Asset.
    fileprivate var activeDownloadsMap = [AVAggregateAssetDownloadTask: AVURLAsset]()
    fileprivate var activeDownloadsStartTimeMap = [AVAggregateAssetDownloadTask: TimeInterval]()
    fileprivate var activeDownloadsPromisesMap = [String: Promise<URL>]()

    /// Internal map of AVAggregateAssetDownloadTask to download URL.
    fileprivate var willDownloadToUrlMap = [AVAggregateAssetDownloadTask: URL]()

    override init() {
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

    // MARK: - Prefetching

    func downloadVideoForUrl(_ url: String) -> Promise<URL>? {

        let promise: Promise<URL>

        if let existing = activeDownloadsPromisesMap[url] {
            promise = existing
        } else {
            promise = Promise<URL>.pending()
            activeDownloadsPromisesMap[url] = promise
            downloadStream(for: url)
        }

        return promise
    }

    func removeVideoForUrl(_ url: String) {
        activeDownloadsPromisesMap[url]?.reject(NSError(domain: "Canceled", code: 0))
        activeDownloadsPromisesMap[url] = nil
        activeDownloadsMap
            .first(where: { _, asset in asset.url.absoluteString == url })?.key
            .cancel()
    }

    /// Triggers the initial AVAssetDownloadTask for a given Asset.
    /// - Tag: DownloadStream
    private func downloadStream(for url: String) {

        guard let assetURL = URL(string: url) else {
            return
        }

        let urlAsset = AVURLAsset(url: assetURL)

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
                                                                    [AVAssetDownloadTaskMinimumRequiredMediaBitrateKey: 480000]) else { return }

        // To better track the AVAssetDownloadTask, set the taskDescription to something unique for the sample.
        task.taskDescription = ""

        activeDownloadsMap[task] = urlAsset

        task.resume()
    }

}

/**
 Extend `RCTVideoCacheDownloader` to conform to the `AVAssetDownloadDelegate` protocol.
 */
extension RCTVideoCacheDownloader: AVAssetDownloadDelegate {

    /// Tells the delegate that the task finished transferring data.
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {

        /*
         This is the ideal place to begin downloading additional media selections
         once the asset itself has finished downloading.
         */

        guard
            let task = task as? AVAggregateAssetDownloadTask,
            let asset = activeDownloadsMap.removeValue(forKey: task),
            let promise = activeDownloadsPromisesMap.removeValue(forKey: asset.url.absoluteString)
        else { return }

        guard let downloadURL = willDownloadToUrlMap.removeValue(forKey: task) else { return }


        if let error = error as NSError? {
            switch (error.domain, error.code) {
            case (NSURLErrorDomain, NSURLErrorCancelled):
                /*
                 This task was canceled, you should perform cleanup using the
                 URL saved from AVAssetDownloadDelegate.urlSession(_:assetDownloadTask:didFinishDownloadingTo:).
                 */
                promise.reject(error)

                break
            case (NSURLErrorDomain, NSURLErrorUnknown):
                fatalError("Downloading HLS streams is not supported in the simulator.")

            default:
                print("An unexpected error occured \(error)")
            }
        } else {
            
            promise.fulfill(downloadURL)

            if let startTime = activeDownloadsStartTimeMap.removeValue(forKey: task) {
                let downloadDuration = Date.timeIntervalSinceReferenceDate - startTime
                let sizeWithUnit = ByteCountFormatter.string(fromByteCount: task.countOfBytesReceived, countStyle: .file)
                print(
                    """
**************************************
******************* video (\(asset.url.absoluteString)
******************* download time = \(round(downloadDuration * 100) / 100.0) sec
******************* size = \(sizeWithUnit)
**************************************
""")
            }

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

        aggregateAssetDownloadTask.taskDescription = "asset.stream.name"

        aggregateAssetDownloadTask.resume()
    }

    /// Method to adopt to subscribe to progress updates of an AVAggregateAssetDownloadTask.
    func urlSession(_ session: URLSession, aggregateAssetDownloadTask: AVAggregateAssetDownloadTask,
                    didLoad timeRange: CMTimeRange, totalTimeRangesLoaded loadedTimeRanges: [NSValue],
                    timeRangeExpectedToLoad: CMTimeRange, for mediaSelection: AVMediaSelection) {

        // This delegate callback should be used to provide download progress for your AVAssetDownloadTask.
        if activeDownloadsStartTimeMap[aggregateAssetDownloadTask] == nil {
            activeDownloadsStartTimeMap[aggregateAssetDownloadTask] = Date.timeIntervalSinceReferenceDate
        }
    }
}
