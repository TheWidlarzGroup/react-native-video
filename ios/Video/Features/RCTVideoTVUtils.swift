import AVFoundation
import AVKit
import Foundation

/*!
 * Collection of helper functions for tvOS specific features
 */

#if os(tvOS)
    enum RCTVideoTVUtils {
        static func makeNavigationMarkerGroups(_ chapters: [Chapter]) -> [AVNavigationMarkersGroup] {
            var metadataGroups = [AVTimedMetadataGroup]()

            // Iterate over the defined chapters and build a timed metadata group object for each.
            for chapter in chapters {
                metadataGroups.append(makeTimedMetadataGroup(for: chapter))
            }

            return [AVNavigationMarkersGroup(title: nil, timedNavigationMarkers: metadataGroups)]
        }

        static func makeTimedMetadataGroup(for chapter: Chapter) -> AVTimedMetadataGroup {
            var metadata = [AVMetadataItem]()

            // Create a metadata item that contains the chapter title.
            let titleItem = RCTVideoUtils.createMetadataItem(for: .commonIdentifierTitle, value: chapter.title)
            metadata.append(titleItem)

            // Create a time range for the metadata group.
            let timescale: Int32 = 600
            let startTime = CMTime(seconds: chapter.startTime, preferredTimescale: timescale)
            let endTime = CMTime(seconds: chapter.endTime, preferredTimescale: timescale)
            let timeRange = CMTimeRangeFromTimeToTime(start: startTime, end: endTime)

            // Image
            if let imgUri = chapter.uri,
               let uri = URL(string: imgUri),
               let imgData = try? Data(contentsOf: uri),
               let image = UIImage(data: imgData),
               let pngData = image.pngData() {
                let imageItem = RCTVideoUtils.createMetadataItem(for: .commonIdentifierArtwork, value: pngData)
                metadata.append(imageItem)
            }

            return AVTimedMetadataGroup(items: metadata, timeRange: timeRange)
        }
    }
#endif
