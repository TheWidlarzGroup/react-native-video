//
//  WatermarkManager.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 26.05.2022.
//

import Foundation
import UIKit

enum WatermarkDimension: String {
    case width
    case height
}

enum WatermarkPosition: String {
    case topLeft = "TOP_LEFT"
    case topRight = "TOP_RIGHT"
    case bottomLeft = "BOTTOM_LEFT"
    case bottomRight = "BOTTOM_RIGHT"
}

@objc public
class WatermarkManager: NSObject {
    private static var widthConstraint: NSLayoutConstraint?
    private static var heightConstraint: NSLayoutConstraint?
    private static var imageLoadingTask: URLSessionDataTask?
    
    static func add(watermarkView: UIImageView,
                    imageURLString: String?,
                    staticDimension: WatermarkDimension,
                    position: WatermarkPosition,
                    ratioToSuperview: Double,
                    to parent: UIView) {
        watermarkView.removeFromSuperview()
        
        let imageURL: URL?
        let scale = UIScreen.main.scale
        
        switch staticDimension {
        case .width:
            let watermarkWidth = Double(parent.bounds.width) * ratioToSuperview
            //multiply by scale cause image sizes are in pixels
            imageURL = UIImageView.createDynamicImageUrlWithFixedWidth(watermarkWidth * Double(scale), imageUriString: imageURLString)
            
        case .height:
            let watermarkHeight = Double(parent.bounds.height) * ratioToSuperview
            //multiply by scale cause image sizes are in pixels
            imageURL = UIImageView.createDynamicImageUrlWithFixedHeight(watermarkHeight * Double(scale), imageUriString: imageURLString)
        }
                
        if let url = imageURL {
            imageLoadingTask?.cancel()
            imageLoadingTask = URLSession.shared.dataTask(with: url) { data, _, _ in
                guard let imageData = data, let image = UIImage(data: imageData)
                else { return }
                
                DispatchQueue.main.async {
                    watermarkView.image = image
                    
                    if let widthConstraint = widthConstraint {
                        watermarkView.removeConstraint(widthConstraint)
                    }
                    
                    if let heightConstraint = heightConstraint {
                        watermarkView.removeConstraint(heightConstraint)
                    }
                    
                    //divide by scale cause constrains are in points
                    widthConstraint = watermarkView.widthAnchor.constraint(equalToConstant: image.size.width / scale)
                    heightConstraint = watermarkView.heightAnchor.constraint(equalToConstant: image.size.height / scale)
                    NSLayoutConstraint.activate([widthConstraint!, heightConstraint!])
                }
            }
            imageLoadingTask?.resume()
        }
        
        var constraints: [NSLayoutConstraint] = []
        
        switch position {
        case .topLeft:
            constraints.append(contentsOf: [
                watermarkView.leftAnchor.constraint(equalTo: parent.leftAnchor, constant: 16),
                watermarkView.topAnchor.constraint(equalTo: parent.topAnchor, constant: 16),
            ])
        case .topRight:
            constraints.append(contentsOf: [
                watermarkView.rightAnchor.constraint(equalTo: parent.rightAnchor, constant: -16),
                watermarkView.topAnchor.constraint(equalTo: parent.topAnchor, constant: 16),
            ])
        case .bottomLeft:
            constraints.append(contentsOf: [
                watermarkView.leftAnchor.constraint(equalTo: parent.leftAnchor, constant: 16),
                watermarkView.bottomAnchor.constraint(equalTo: parent.bottomAnchor, constant: -16),
            ])
        case .bottomRight:
            constraints.append(contentsOf: [
                watermarkView.rightAnchor.constraint(equalTo: parent.rightAnchor, constant: -16),
                watermarkView.bottomAnchor.constraint(equalTo: parent.bottomAnchor, constant: -16),
            ])
        }
        
        parent.addSubview(watermarkView)
        NSLayoutConstraint.activate(constraints)
    }
    
    @objc public
    static func setupWatermarkFromSource(source: NSDictionary?, watermarkView: UIImageView, parent: UIView) {
        guard
            let source = source,
            let metadata = source["metadata"] as? NSDictionary,
            let logoUrl = metadata["logoUrl"] as? String,
            let logoPosition = metadata["logoPosition"] as? String,
            let logoStaticDimention = metadata["logoStaticDimension"] as? String,
            let ratioToSuperview = metadata["logoPlayerSizeRatio"] as? Double,
            let staticDimention = WatermarkDimension(rawValue: logoStaticDimention),
            let position = WatermarkPosition(rawValue: logoPosition)
        else {
            return
        }
        
        DispatchQueue.main.async {
            WatermarkManager.add(watermarkView: watermarkView,
                                 imageURLString: logoUrl,
                                 staticDimension: staticDimention,
                                 position: position,
                                 ratioToSuperview: ratioToSuperview,
                                 to: parent)
        }
    }
}


extension UIImageView {
    static func createDynamicImageUrlWithFixedWidth(_ width: Double, imageUriString: String?) -> URL? {
        guard let imageUriString = imageUriString else {
            return nil
        }
        return URL(string: imageUriString.replacingOccurrences(of: "/original/", with: "/\(Int(width))xAUTO/"))
    }
    
    static func createDynamicImageUrlWithFixedHeight(_ height: Double, imageUriString: String?) -> URL? {
        guard let imageUriString = imageUriString else {
            return nil
        }
        return URL(string: imageUriString.replacingOccurrences(of: "/original/", with: "/AUTOx\(Int(height))/"))
    }
}
