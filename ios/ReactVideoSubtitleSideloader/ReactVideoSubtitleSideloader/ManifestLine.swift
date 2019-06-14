//
//  ManifestLine.swift
//  RNDReactNativeDiceVideo
//
//  Created by Lukasz on 24/04/2019.
//  Copyright © 2019 Endeavor Streaming. All rights reserved.
//

import UIKit

class ManifestLine: NSObject {
    public let isTag: Bool
    public let tagName: String
    public let tagValue: String?
    public private(set) var tagAttributes: Dictionary<String, String>?
    public private(set) var tagAttributesOrder: [String]?
    public let value: String
    
    public init?(line: String) {
        value = line
        if line.hasPrefix("#") {
            isTag = true
            let components:Array<Substring> = line.split(separator: ":", maxSplits: 1)
            if components.count == 1 {
                tagName = String(components[0])
                tagValue = nil
                self.tagAttributes = nil
                tagAttributesOrder = nil
                super.init()
                return
            } else if components.count != 2 {
                return nil
            }
            tagName = String(components[0])
            tagValue = String(components[1])
            var tagAttributes: Dictionary<String, String>?
            if tagValue!.contains(",") {
                tagAttributes = [:]
                tagAttributesOrder = []
                let params = tagValue!.components(separatedBy: ",")
                // now we need to ignore quotted ","
                var newParams:[String] = []
                var iterator = params.makeIterator()
                while let p = iterator.next() {
                    if p.contains("\"") {
                        var newP = p
                        while newP.components(separatedBy: "\"").count < 3 {
                            if let n = iterator.next() {
                                newP += "," + n
                            } else {
                                break;
                            }
                        }
                        newParams.append(newP)
                    } else {
                        newParams.append(p)
                    }
                }
                for param in newParams {
                    let pair = param.split(separator: "=")
                    if pair.count == 2 {
                        tagAttributes![String(pair[0])] = String(pair[1])
                        tagAttributesOrder!.append(String(pair[0]))
                    } else {
                        return nil
                    }
                    
                }
            } else if tagValue!.contains("=") {
                tagAttributes = [:]
                tagAttributesOrder = []
                let pair = tagValue!.split(separator: "=")
                if pair.count == 2 {
                    tagAttributes![String(pair[0])] = String(pair[1])
                    tagAttributesOrder!.append(String(pair[0]))
                } else {
                    return nil
                }
            }
            self.tagAttributes = tagAttributes
        } else {
            isTag = false
            tagName = ""
            tagValue = nil
            tagAttributes = nil
        }
        super.init()
    }
    
    public func setAttribute(name: String, value: String) {
        self.tagAttributes?[name] = value
        if !(tagAttributesOrder?.contains(name) ?? true) {
            self.tagAttributesOrder?.append(name)
        }
    }
    
    public func removeAttribute(name: String) {
        self.tagAttributes?.removeValue(forKey: name)
        self.tagAttributesOrder?.removeAll(where: { (value) -> Bool in
            return value == name
        })
    }
    
    public func getLine() -> String {
        if isTag {
            var line = tagName
            if let ta = tagAttributes, let tagAttributesOrder = tagAttributesOrder, ta.count > 0, tagAttributesOrder.count > 0 {
                line += ":"
                for key in tagAttributesOrder {
                    line += key + "=" + (ta[key] ?? "") + ","
                }
                line = String(line.dropLast())
            } else {
                line += ":" + (tagValue ?? "")
            }
            return line
        } else {
            return value
        }
    }
}
