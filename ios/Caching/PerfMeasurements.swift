/*
See LICENSE folder for this sample’s licensing information.

Abstract:
`PerfMeasurements` contains utility code to measure streaming performance KPIs
*/

import Foundation
import AVFoundation
import os.log

/// - Tag: PerfMeasurements
class PerfMeasurements: NSObject {
    
    /// Time when this class was created.
    private var creationTime: CFAbsoluteTime = 0.0
    
    /// Time when playback initially started.
    private var playbackStartTime: CFAbsoluteTime = 0.0

    /// Time of last stall event.
    private var lastStallTime: CFAbsoluteTime = 0.0
    
    /// Duration of all stalls (time waiting for rebuffering).
    private var totalStallTime: CFTimeInterval = 0.0
    
    /// Stream startup time measured in seconds.
    var startupTime: CFTimeInterval {
        return playbackStartTime - creationTime
    }
    
    /// Total time spent playing, obtained from the AccessLog.
    /// - Tag: TotalDurationWatched
    var totalDurationWatched: Double {
        // Compute total duration watched by iterating through the AccessLog events.
        var totalDurationWatched = 0.0
        if accessLog != nil && !accessLog!.events.isEmpty {
            for event in accessLog!.events where event.durationWatched > 0 {
                    totalDurationWatched += event.durationWatched
            }
        }
        return totalDurationWatched
    }
    
    /**
    Time weighted value of the variant indicated bitrate.
    Measure of overall stream quality.
    */
    var timeWeightedIBR: Double {
        var timeWeightedIBR = 0.0
        let totalDurationWatched = self.totalDurationWatched
        
        if accessLog != nil && totalDurationWatched > 0 {
            // Compute the time-weighted indicated bitrate.
            for event in accessLog!.events {
                if event.durationWatched > 0 && event.indicatedBitrate > 0 {
                    let eventTimeWeight = event.durationWatched / totalDurationWatched
                    timeWeightedIBR += event.indicatedBitrate * eventTimeWeight
                }
            }
        }
        return timeWeightedIBR
    }
    
    /**
    Stall rate measured in stalls per hour.
    Normalized measure of stream interruptions caused by stream buffer depleation.
    */
    var stallRate: Double {
            var totalNumberOfStalls = 0
            let totalHoursWatched = self.totalDurationWatched / 3600
            
            if accessLog != nil && totalDurationWatched > 0 {
                for event in accessLog!.events {
                    totalNumberOfStalls += event.numberOfStalls
                }
            }
            return Double(totalNumberOfStalls) / totalHoursWatched
    }
    
    /**
    Stall time measured as duration-stalled / duration-watched.
    Normalized meausre of time waited for the a stream to rebuffer.
    */
    var stallWaitRatio: Double {
            return totalStallTime / totalDurationWatched
    }
    
    // The AccessLog associated to the current player item.
    private var accessLog: AVPlayerItemAccessLog? {
            return playerItem?.accessLog()
    }
    
    /// The player item monitored.
    private var playerItem: AVPlayerItem?
    
    init(playerItem: AVPlayerItem) {
        super.init()
        self.playerItem = playerItem
        creationTime = CACurrentMediaTime()
    }
    
    /// Called when a timebase rate change occurs.
    func rateChanged(rate: Double) {
        if playbackStartTime == 0.0 && rate > 0 {
            // First rate change
            playbackStartTime = CACurrentMediaTime()
            os_log("Perf -- Playback started in %.2f seconds", self.startupTime)
        } else if rate > 0 && lastStallTime > 0 {
            // Subsequent rate change
            playbackStallEnded()
            os_log("Perf -- Playback resumed in %.2f seconds", totalStallTime)
        }
    }
    
    /// Called when playback stalls.
    func playbackStalled() {
        os_log("Perf -- Playback stalled")
        lastStallTime = CACurrentMediaTime()
    }
    
    /// Called after a stall event, when playback resumes.
    func playbackStallEnded() {
        if lastStallTime > 0 {
            totalStallTime += CACurrentMediaTime() - lastStallTime
            lastStallTime = 0.0
        }
    }
    
    /// Called when the player item is released.
    func playbackEnded() {
        playbackStallEnded()
        os_log("Perf -- Playback ended")
        os_log("Perf -- Time-weighted Indicated Bitrate: %.2fMbps", timeWeightedIBR / 1_000_000)
        os_log("Perf -- Stall rate: %.2f stalls/hour", stallRate)
        os_log("Perf -- Stall wait ratio: %.2f duration-stalled/duration-watched", stallWaitRatio)
    }
}
