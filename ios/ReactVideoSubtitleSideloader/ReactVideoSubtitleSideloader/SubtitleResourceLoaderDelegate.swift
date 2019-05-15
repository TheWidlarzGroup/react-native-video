//
//  SubtitleResourceLoaderDelegate.swift
//  External WebVTT Example
//
//  Created by Lukasz on 17/04/2019.
//  Copyright © 2019 Endeavor Streaming. All rights reserved.
//

import UIKit
import AVFoundation

/**
 * AVAssetResourceLoaderDelegate class that allows to sideload subtitles for
 * HLS streams, which is not possible via AVComposition.
 * This is a workaround and it is working only for a small subset of HLS specification.
 */
@objc public class SubtitleResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate {
    static let mainScheme = "mainm3u8"
    
    private let subtitlesScheme = "subtitlesm3u8"
    private let extInfPrefix = "#EXTINF:"
    
    private var m3u8URL: URL
    @objc public private(set) var redirectURL: URL
    
    private var m3u8String: String? = nil
    
    private var playlistDuration: Double = 0.0
    
    @objc private(set) var subtitles:[SubtitleTrack]?
    
    @objc private(set) var errorLog: Array<Error> = []
    
    public enum ErrorCode: Int {
        case InvalidServerResponse = -10
        case InvalidServerResponseBody = -11
        case StringToDataConvertionFailure = -200
    }

    /**
     * Creates instance of SubtitleResourceLoaderDelegate
     * - Parameters:
     *      - m3u8URL: URL for the master playlist file
     *      - subtitles: subtitle tracks to be side loaded this nees to be Array of SubtitleTrack
     *
     * - Attention: Make sure that this delegate and the player itself is using the same
     *           User-Agent string, otherwise tokenized urls will not work causing HTTP/403 errors
     *
     */
    @objc public init(m3u8URL: URL, subtitles:NSArray) {
        self.m3u8URL = m3u8URL
        self.redirectURL = SubtitleResourceLoaderDelegate.getRedirectURL(m3u8URL: m3u8URL)!
        
        self.subtitles = subtitles.map { $0 as! SubtitleTrack }
        super.init()
    }
    
    @objc public static func createSubtitleTracks(fromArray array:NSArray) -> Array<SubtitleTrack> {
        var subs = Array<SubtitleTrack>()
        for s in array {
            if let s = s as? NSDictionary, let sub = SubtitleTrack.from(dict: s) {
                subs.append(sub)
            }
        }
        return subs
    }
    
    private static func createError(code: ErrorCode, message: String, cause: Error? = nil) -> Error {
        var userInfo: [String: Any] = [NSLocalizedDescriptionKey: message]
        if let e = cause {
            userInfo[NSUnderlyingErrorKey] = e
        }
        let error = NSError(domain: "SubtitleResourceLoaderDelegate", code: code.rawValue, userInfo: userInfo)
        return error
    }
    
    /**
     * Creates a redirect URL with a custom scheme that will force AVURLAsset to
     * use the delegate.
     */
    private static func getRedirectURL(m3u8URL: URL) -> URL? {
        var components = URLComponents(url: m3u8URL, resolvingAgainstBaseURL: true)
        components?.scheme = SubtitleResourceLoaderDelegate.mainScheme
        return components?.url
    }
    
    public func resourceLoader(_ resourceLoader: AVAssetResourceLoader, shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        
        guard let scheme = loadingRequest.request.url?.scheme else {
            return false
        }
        
        switch (scheme) {
        case SubtitleResourceLoaderDelegate.mainScheme:
            return handleMainRequest(loadingRequest)
        case subtitlesScheme:
            return handleSubtitles(loadingRequest)
        default:
            return false
        }
    }
    
    private func handleMainRequest(_ loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        guard let url = loadingRequest.request.url else {
            return false
        }
        guard let userAgentString = loadingRequest.request.allHTTPHeaderFields?["User-Agent"] else {
            return false
        }
        DICELog.d("Processing: \(url.absoluteString)")
        let lpc = url.lastPathComponent
        if !lpc.hasSuffix("m3u8") {
            return false
        }
        let mainPlaylist: Bool
        var r: URLRequest
        if url.absoluteString == redirectURL.absoluteString {
            // this is the main manifest and the rewrite is needed
            r = URLRequest(url: m3u8URL)
            mainPlaylist = true
        } else {
            // this are the sub manigests and only urls needed to be rewriten or resolved
            let scheme = m3u8URL.scheme ?? "https"
            let urlString = url.absoluteString.replacingOccurrences(of: SubtitleResourceLoaderDelegate.mainScheme, with: scheme)
            r = URLRequest(url: URL(string: urlString)!)
            mainPlaylist = false
        }
        
        r.setValue(userAgentString, forHTTPHeaderField: "User-Agent")
        r.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        let task = URLSession.shared.dataTask(with: r) { [weak self] (data, response, error) in
            guard error == nil,
                let data = data else {
                    DICELog.e("finishLoading(with: error) \(String(describing: error))")
                    loadingRequest.finishLoading(with: error)
                    return
            }
            
            if let resp = response as? HTTPURLResponse, resp.statusCode >= 300 {
                let e = SubtitleResourceLoaderDelegate.createError(code: .InvalidServerResponse, message: "Non 200 server response")
                self?.errorLog.append(e)
                DICELog.e("finishLoading(with: error) \(e)")
                loadingRequest.finishLoading(with: e)
                return
            }

            if mainPlaylist {
                guard let rURL = r.url, let responseData = self?.processPlaylistWithData(data, rURL) else {
                    let e = SubtitleResourceLoaderDelegate.createError(code: .InvalidServerResponseBody, message: "Unable to process response body")
                    self?.errorLog.append(e)
                    DICELog.e("finishLoading(with: error) \(e)")
                    loadingRequest.finishLoading(with: e)
                    return
                }
                loadingRequest.dataRequest?.respond(with: responseData)
                loadingRequest.finishLoading()
            } else {
                guard let rURL = r.url, let responseData = self?.rewriteURLs(forPlaylistData: data, rURL) else {
                    let e = SubtitleResourceLoaderDelegate.createError(code: .InvalidServerResponseBody, message: "Unable to process response body")
                    loadingRequest.finishLoading(with: e)
                    DICELog.e("finishLoading(with: error) \(e)")
                    self?.errorLog.append(e)
                    return
                }
                loadingRequest.dataRequest?.respond(with: responseData)
                loadingRequest.finishLoading()
            }
        }
        task.resume()
        return true
    }
    
    private func handleSubtitles(_ loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        guard let url = loadingRequest.request.url else {
            return false
        }
        let lastPathIndex = Int(url.lastPathComponent) ?? 0
        guard let subs = subtitles, subs.count > lastPathIndex else {
            return false
        }
        
        // currently setting duration value to a big number due to lack of duration information
        // in DICE masterplaylists. 50400 seconds = 14 hours
        let resp = getSubtitlem3u8WithDuration(50400, subsURL: subs[lastPathIndex].url)
        guard let data = resp.data(using: .utf8) else {
            let e = SubtitleResourceLoaderDelegate.createError(code: .StringToDataConvertionFailure, message: "Unable to create Data from string for subtitle manifest response")
            errorLog.append(e)
            DICELog.e("finishLoading(with: error) \(e)")
            loadingRequest.finishLoading(with: e)
            return false
        }
        loadingRequest.dataRequest?.respond(with: data)
        loadingRequest.finishLoading()
        return true
        
    }
    
    /**
     * Processing playlist/manifests and rewrites all urls to contain full path
     * removing the custom schema taken from the custom rewrite URL.
     */
    private func rewriteURLs(forPlaylistData data: Data, _ loadingRequestURL: URL) -> Data? {
        guard let string = String(data: data, encoding: .utf8) else { return nil}
        let lines = string.components(separatedBy: "\n")
        var newLines = [String]()
        var iterator = lines.makeIterator()
        
        while let line = iterator.next() {
            if line.starts(with: "#EXT-X-STREAM-INF:") || line.starts(with: "#EXTINF:") {
                newLines.append(line)
                while let newLine = iterator.next() {
                    if newLine.hasPrefix("#") {
                        newLines.append(newLine)
                        continue
                    }
                    newLines.append(appendBasePath(newLine, loadingRequestURL))
                    break;
                }
                continue
            } else {
                if let l = ManifestLine(line: line) {
                    if l.isTag && l.tagName == "#EXT-X-MAP" {
                        if let uri = l.tagAttributes?["URI"] {
                            l.setAttribute(name: "URI", value: appendBasePath(uri, loadingRequestURL))
                            newLines.append(l.getLine())
                            continue
                        }
                    }
                }
                newLines.append(line)
            }
        
        }
        
        let newPlaylist = newLines.joined(separator: "\n")
        return newPlaylist.data(using: .utf8)
    }
    
    /**
     * Processing master playlist file to add sideloaded subtitle tracks.
     */
    private func processPlaylistWithData(_ data: Data, _ loadingRequestURL: URL) -> Data? {
        guard let string = String(data: data, encoding: .utf8) else { return nil }
        let lines = string.components(separatedBy: "\n")
        var newLines = [String]()
        var preLines = [String]()
        var postLines =  [String]()
        var iterator = lines.makeIterator()

        var pre = true
        while let line = iterator.next() {
            if line.starts(with: "#EXT-X-STREAM-INF:") {
                pre = false
                newLines.append(line)
                if let newLine = iterator.next() { // Next line contains path
                    newLines.append(appendBasePath(newLine, loadingRequestURL))
                }
                continue
            }
            if pre {
                preLines.append(line)
            } else {
                postLines.append(line)
            }
        }
        
        var finalLines = [String]()
        finalLines.append(contentsOf: preLines)
        
        let subtitleGroupID = extractSubtitleGroupId(fromLines: lines) ?? "\"sub\""
        
        if let subs = subtitles {
            var index = 0
            // adding subtitle tracks
            for sub in subs {
                let l = "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\(subtitleGroupID),LANGUAGE=\"\(sub.isoCode)\",NAME=\"\(sub.name)\",AUTOSELECT=YES,DEFAULT=YES,FORCED=NO,URI=\"subtitlesm3u8://foo.com/\(index)\""
                index += 1
                finalLines.append(l)
            }
            index = 0
            finalLines.append("")
            for newLine in newLines {
                // adding/setting correct subtitle group-ids for trakcs
                if let ml = ManifestLine(line: newLine) {
                    if ml.isTag && ml.tagName == "#EXT-X-STREAM-INF" {
                        ml.setAttribute(name: "SUBTITLES", value: subtitleGroupID)
                        finalLines.append(ml.getLine())
                    } else {
                        finalLines.append(newLine)
                    }
                } else {
                    finalLines.append(newLine)
                    DICELog.v("FAILED to parse line")
                }
            }
            finalLines.append("")
            index += 1
        } else {
            finalLines.append(contentsOf: newLines)
        }
        
        m3u8String = finalLines.joined(separator: "\n")
        let data = m3u8String?.data(using: .utf8)
        return data
    }
    
    /**
     * Scans the manifest lines is search for already defined subtitles. Returns first GROUP_ID
     * of the subtitle group it will find.
     * - Parameters:
     *      - lines: all lines from the manifest file
     */
    private func extractSubtitleGroupId(fromLines lines: Array<String>) -> String? {
        //find existing subtitles and extract GROUP-ID
        //this will allow to merge the subtitles with existing ones
        var subtitleGroupID: String? = nil
        for line in lines {
            if let ml = ManifestLine(line: line) {
                if ml.isTag && ml.tagName == "#EXT-X-MEDIA" {
                    if let type = ml.tagAttributes?["TYPE"], type == "SUBTITLES" {
                        if let gID = ml.tagAttributes?["GROUP-ID"] {
                            subtitleGroupID = gID
                            break
                        }
                    }
                }
            }
        }
        return subtitleGroupID
    }
    
    /**
     * Prepends (adds prefix) for the string. If string is quoted, prefix is added inside the quotes
     * - Parameters:
     *      - string: the string/path that needs to be prefixed
     *      - loadingRequestURL: the origin URL that will be used to extract base path
     */
    private func appendBasePath(_ string: String, _ loadingRequestURL: URL) -> String {
        var string = string
        var prefix = ""
        let isQuoted = string.hasPrefix("\"")
        if isQuoted {
            string = String(string.dropFirst())
            prefix = "\""
        }
        if string.starts(with: "http") {
            // url rewrite is not required
            return prefix + string
            
        }
        // this means we deal with relative urls so we need to change them into absolute ones
        var components = URLComponents(string: loadingRequestURL.absoluteString)
        components?.query = nil
        let path = components!.url!.deletingLastPathComponent().absoluteString
        return prefix + path + string
    }
    
    /**
     * Returns contents of sub-manifest for side loaded subtitles
     * - Parameters:
     *      - duration: duration of entire movie
     *      - subsURL: url for the side loaded VTTs
     */
    private func getSubtitlem3u8WithDuration(_ duration: Double, subsURL: URL) -> String {
        let durationString = String(format: "%.3f", duration)
        let intDuration = Int(duration)
        let subtitlem3u8 = """
        #EXTM3U
        #EXT-X-VERSION:3
        #EXT-X-MEDIA-SEQUENCE:1
        #EXT-X-PLAYLIST-TYPE:VOD
        #EXT-X-ALLOW-CACHE:NO
        #EXT-X-TARGETDURATION:\(intDuration)
        #EXTINF:\(durationString), no desc
        \(subsURL.absoluteString)
        #EXT-X-ENDLIST
        """
        return subtitlem3u8
    }

}
