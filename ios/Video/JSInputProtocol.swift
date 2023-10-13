//
//  JSInputProtocol.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 11.03.2022.
//

import Foundation

protocol JSInputProtocol: AnyObject {
    var onBackButton: RCTBubblingEventBlock? { get }
    var onVideoLoadStart: RCTBubblingEventBlock? { get }
    var onVideoLoad: RCTBubblingEventBlock? { get }
    var onVideoBuffer: RCTBubblingEventBlock? { get }
    var onVideoError: RCTBubblingEventBlock? { get }
    var onVideoProgress: RCTBubblingEventBlock? { get }
    var onVideoSeek: RCTBubblingEventBlock? { get }
    var onVideoEnd: RCTBubblingEventBlock? { get }
    var onTimedMetadata: RCTBubblingEventBlock? { get }
    var onVideoAudioBecomingNoisy: RCTBubblingEventBlock? { get }
    var onVideoFullscreenPlayerWillPresent: RCTBubblingEventBlock? { get }
    var onVideoFullscreenPlayerDidPresent: RCTBubblingEventBlock? { get }
    var onVideoFullscreenPlayerWillDismiss: RCTBubblingEventBlock? { get }
    var onVideoFullscreenPlayerDidDismiss: RCTBubblingEventBlock? { get }
    var onReadyForDisplay: RCTBubblingEventBlock? { get }
    var onPlaybackStalled: RCTBubblingEventBlock? { get }
    var onPlaybackResume: RCTBubblingEventBlock? { get }
    var onPlaybackRateChange: RCTBubblingEventBlock? { get }
    var onRequireAdParameters: RCTBubblingEventBlock? { get }
    var onVideoAboutToEnd: RCTBubblingEventBlock? { get }
    var onFavouriteButtonClick: RCTBubblingEventBlock? { get }
    var onRelatedVideoClicked: RCTBubblingEventBlock? { get }
    var onRelatedVideosIconClicked: RCTBubblingEventBlock? { get }
    var onStatsIconClick: RCTBubblingEventBlock? { get }
    var onEpgIconClick: RCTBubblingEventBlock? { get }
    var onAnnotationsButtonClick: RCTBubblingEventBlock? { get }
    var onSubtitleTrackChanged: RCTBubblingEventBlock? { get }
}
