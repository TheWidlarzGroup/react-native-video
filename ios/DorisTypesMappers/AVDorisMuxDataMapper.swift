//
//  AVDorisMuxDataMapper.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 27.05.2021.
//

import AVDoris

class AVDorisMuxDataMapper {
    func map(muxData: Source.Config.MuxData?) -> (playerData: DorisMuxCustomerPlayerData, videoData: DorisMuxCustomerVideoData)? {
        guard let muxData = muxData else { return nil }
        
        let playerData = DorisMuxCustomerPlayerData(playerName: muxData.playerName, environmentKey: muxData.envKey)
        playerData.viewerUserId = muxData.viewerUserId
        playerData.subPropertyId = muxData.subPropertyId
        
        let videoData = DorisMuxCustomerVideoData()
        videoData.videoTitle = muxData.videoTitle
        videoData.videoId = muxData.videoId
        videoData.videoStreamType = muxData.videoStreamType
        videoData.videoIsLive = muxData.videoIsLive
        
        return (playerData: playerData, videoData: videoData)
    }
}
