import AVFoundation

enum CaptureError: Error {
    case emptyPlayerItem
    case emptyPlayerItemOutput
    case emptyBuffer
    case emptyImg
    case emtpyPngData
    case emptyTmpDir
}

enum RCTVideoCapture {

    static func capture(
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock,
        playerItem: AVPlayerItem?,
        playerOutput: AVPlayerItemVideoOutput?
    ) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let playerItem = try playerItem ?? { throw CaptureError.emptyPlayerItem }()
                let playerOutput = try playerOutput ?? { throw CaptureError.emptyPlayerItemOutput }()

                let currentTime = playerItem.currentTime()
                let settings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
                let output = AVPlayerItemVideoOutput.init(pixelBufferAttributes: settings)
                let buffer = try playerOutput.copyPixelBuffer(forItemTime: currentTime, itemTimeForDisplay: nil) ?? { throw CaptureError.emptyBuffer }()
                
                let ciImage = CIImage(cvPixelBuffer: buffer)
                let ctx = CIContext.init(options: nil)
                let width = CVPixelBufferGetWidth(buffer)
                let height = CVPixelBufferGetHeight(buffer)
                let rect = CGRectMake(0, 0, CGFloat(width), CGFloat(height))
                let videoImage = try ctx.createCGImage(ciImage, from: rect) ?? { throw CaptureError.emptyImg }()
                
                let image = UIImage.init(cgImage: videoImage)
                UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                let data = try image.pngData() ?? { throw CaptureError.emtpyPngData }()
                
                let tmpDir = try RCTTempFilePath("png", nil) ?? { throw CaptureError.emptyTmpDir }()

                try data.write(to: URL(fileURLWithPath: tmpDir))
                resolve(nil)
            } catch {
                reject("RCTVideoCapture Error", "Capture failed: \(error)", nil)
            }
        }
    }
}
