import AVFoundation

enum RCTVideoSave {

    static func save(
        options:NSDictionary!,
        resolve: @escaping RCTPromiseResolveBlock,
        reject:@escaping RCTPromiseRejectBlock,
        
        playerItem: AVPlayerItem?
    ) {
        let asset:AVAsset! = playerItem?.asset
        
        guard asset != nil else {
            reject("ERROR_ASSET_NIL", "Asset is nil", nil)
            return
        }
        
        guard let exportSession = AVAssetExportSession(asset: asset, presetName:AVAssetExportPresetHighestQuality) else {
            reject("ERROR_COULD_NOT_CREATE_EXPORT_SESSION", "Could not create export session", nil)
            return
        }
        var path:String! = nil
        path = RCTVideoSave.generatePathInDirectory(
            directory: URL(fileURLWithPath: RCTVideoSave.cacheDirectoryPath() ?? "").appendingPathComponent("Videos").path,
            withExtension: ".mp4")
        let url:NSURL! = NSURL.fileURL(withPath: path) as NSURL
        exportSession.outputFileType = AVFileType.mp4
        exportSession.outputURL = url as URL?
        exportSession.videoComposition = playerItem?.videoComposition
        exportSession.shouldOptimizeForNetworkUse = true
        exportSession.exportAsynchronously(completionHandler: {
            
            switch (exportSession.status) {
            case .failed:
                reject("ERROR_COULD_NOT_EXPORT_VIDEO", "Could not export video", exportSession.error)
                break
            case .cancelled:
                reject("ERROR_EXPORT_SESSION_CANCELLED", "Export session was cancelled", exportSession.error)
                break
            default:
                resolve(["uri": url.absoluteString])
                break
            }
            
        })
    }
    
    static func generatePathInDirectory(directory: String?, withExtension `extension`: String?) -> String? {
        let fileName = UUID().uuidString + (`extension` ?? "")
        RCTVideoSave.ensureDirExists(withPath: directory)
        return URL(fileURLWithPath: directory ?? "").appendingPathComponent(fileName).path
    }
    
    static func cacheDirectoryPath() -> String? {
        let array = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).map(\.path)
        return array[0]
    }
    
    static func ensureDirExists(withPath path: String?) -> Bool {
        var isDir: ObjCBool = false
        var error: Error?
        let exists = FileManager.default.fileExists(atPath: path ?? "", isDirectory: &isDir)
        if !(exists && isDir.boolValue) {
            do {
                try FileManager.default.createDirectory(atPath: path ?? "", withIntermediateDirectories: true, attributes: nil)
            } catch {
            }
            if error != nil {
                return false
            }
        }
        return true
    }
}
