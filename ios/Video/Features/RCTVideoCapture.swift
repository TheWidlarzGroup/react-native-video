import AVFoundation

// MARK: - CaptureError

enum CaptureError: Error {
    case emptyPlayerItem
    case emptyPlayerItemOutput
    case emptyBuffer
    case emptyImg
    case emtpyPngData
    case emptyTmpDir
}

// MARK: - RCTVideoCapture

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
                let output = AVPlayerItemVideoOutput(pixelBufferAttributes: settings)
                let buffer = try playerOutput.copyPixelBuffer(forItemTime: currentTime, itemTimeForDisplay: nil) ?? { throw CaptureError.emptyBuffer }()

                let ciImage = CIImage(cvPixelBuffer: buffer)
                let ctx = CIContext(options: nil)
                let width = CVPixelBufferGetWidth(buffer)
                let height = CVPixelBufferGetHeight(buffer)
                let rect = CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height))
                let videoImage = try ctx.createCGImage(ciImage, from: rect) ?? { throw CaptureError.emptyImg }()

                let image = UIImage(cgImage: videoImage)
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
