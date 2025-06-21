//  Source: https://github.com/jbweimar/external-webvtt-example/blob/master/External%20WebVTT%20Example/CustomResourceLoaderDelegate.swift

import AVFoundation
import AVKit
import Foundation

extension PlayerItem {
    static let hlsCommonScheme = "rnvideo-hls"
    private static let hlsSubtitlesScheme = "rnvideo-hls-subtitles"
    private static let hlsSubtitleGroupID = "rnvideo-sub"

    func handleHLSRequest(loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        guard let url = loadingRequest.request.url else {
            return false
        }

        switch url.scheme {
        case Self.hlsCommonScheme:
            return handleM3U8(url, loadingRequest)
        case Self.hlsSubtitlesScheme:
            return handleSubtitleM3U8(url, loadingRequest)
        default:
            return false
        }
    }

    private func downloadM3U8(_ url: URL, _ downloaded: @escaping (Result<Data, Error>) -> Void) -> Bool {
        let task = URLSession.shared.dataTask(with: url) { data, _, error in
            if let error {
                downloaded(.failure(error))
                return
            }

            downloaded(.success(data ?? .init()))
        }
        task.priority = URLSessionTask.highPriority
        task.resume()
        return true
    }

    private func handleM3U8(_ requestingUrl: URL, _ loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        guard let m3u8Uri = URL(string: payload.uri ?? "") else {
            return false
        }
        // Check if the requested url is the initial modified link
        if requestingUrl == payload.modifiedLink {
            return downloadM3U8(m3u8Uri) { [weak self] result in
                switch result {
                case let .success(data):
                    guard let string = String(data: data, encoding: .utf8) else {
                        loadingRequest.finishLoading(with: nil)
                        return
                    }

                    let playlistData: Data

                    if string.contains("#EXT-X-STREAM-INF") {
                        let mainM3U8 = self?.parseMainMultiVariantPlaylist(string)
                        playlistData = mainM3U8?.data(using: .utf8) ?? data
                    } else {
                        let m3u8 = self?.convertMainPlaylistToMultivariant(string)
                        playlistData = m3u8?.data(using: .utf8) ?? data
                    }

                    loadingRequest.contentInformationRequest?.contentType = "public.m3u-playlist"
                    loadingRequest.contentInformationRequest?.contentLength = Int64(data.count)
                    loadingRequest.contentInformationRequest?.isByteRangeAccessSupported = true

                    loadingRequest.dataRequest?.respond(with: playlistData)
                    loadingRequest.finishLoading()

                case let .failure(error):
                    loadingRequest.finishLoading(with: error)
                }
            }
        } else {
            var request = URLRequest(url: requestingUrl.recoveryScheme)
            request.httpMethod = "GET"
            request.allHTTPHeaderFields = loadingRequest.request.allHTTPHeaderFields ?? [:]
            loadingRequest.redirect = request

            loadingRequest.response = HTTPURLResponse(
                url: requestingUrl.recoveryScheme,
                statusCode: 302,
                httpVersion: nil,
                headerFields: loadingRequest.request.allHTTPHeaderFields ?? [:]
            )

            loadingRequest.finishLoading()
        }

        return true
    }

    private func handleSubtitleM3U8(_ requestingUrl: URL, _ loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        guard let withoutSchema = requestingUrl.absoluteString.components(separatedBy: "://").last else {
            return false
        }

        guard let index = withoutSchema.components(separatedBy: ".").first.flatMap({ Int($0) }) else {
            return false
        }

        guard let textTrack = payload.textTracks.enumerated().first(where: { $0.offset == index })?.element else {
            return false
        }

        guard let textTrackUri = URL(string: textTrack.uri) else {
            return false
        }

        let task = URLSession.shared.dataTask(with: .init(url: textTrackUri)) { data, _, error in
            guard error == nil else {
                return loadingRequest.finishLoading(with: error)
            }

            guard let vttString = String(data: data ?? .init(), encoding: .utf8) else {
                return loadingRequest.finishLoading(with: nil)
            }

            let lastTimeStampString = (
                try? NSRegularExpression(pattern: "(?:(\\d+):)?(\\d+):([\\d\\.]+)")
                    .matches(
                        in: vttString,
                        range: .init(location: 0, length: vttString.utf16.count)
                    )
                    .last
                    .flatMap { Range($0.range, in: vttString) }
                    .flatMap { String(vttString[$0]) }
            ) ?? "0.000"

            let duration = lastTimeStampString.components(separatedBy: ":").reversed()
                .compactMap { Double($0) }
                .enumerated()
                .map { pow(60.0, Double($0.offset)) * $0.element }
                .reduce(0, +)

            let m3u8Subtitle = """
            #EXTM3U
            #EXT-X-VERSION:3
            #EXT-X-MEDIA-SEQUENCE:1
            #EXT-X-PLAYLIST-TYPE:VOD
            #EXT-X-ALLOW-CACHE:NO
            #EXT-X-TARGETDURATION:\(Int(duration))
            #EXTINF:\(String(format: "%.3f", duration)), no desc
            \(textTrackUri.absoluteString)
            #EXT-X-ENDLIST
            """

            let m3u8Data = m3u8Subtitle.data(using: .utf8) ?? .init()

            loadingRequest.dataRequest?.respond(with: m3u8Data)

            loadingRequest.contentInformationRequest?.contentType = "public.m3u-playlist"
            loadingRequest.contentInformationRequest?.contentLength = Int64(m3u8Data.count)
            loadingRequest.contentInformationRequest?.isByteRangeAccessSupported = true

            loadingRequest.finishLoading()
        }
        task.resume()
        return true
    }

    private func parseMainMultiVariantPlaylist(_ m3u8String: String) -> String {
        var lines = m3u8String.split(separator: "\n", omittingEmptySubsequences: false).map { String($0) }
        var lastPositionMedia: Int?
        var firstPositionInf = 1

        for (idx, line) in lines.enumerated() {
            if line.hasPrefix("#EXT-X-STREAM-INF") {
                firstPositionInf = idx
                break
            } else if line.hasPrefix("#EXT-X-MEDIA") {
                lastPositionMedia = idx + 1
            }
        }

        var subtitlePosition = lastPositionMedia ?? firstPositionInf

        for (idx, subtitle) in payload.textTracks.enumerated() {
            let m3u8SubtitlesString = makeSubtitleTypes(idx, subtitle)
            if subtitlePosition <= lines.endIndex {
                lines.insert(m3u8SubtitlesString, at: subtitlePosition)
            } else {
                lines.append(m3u8SubtitlesString)
            }
            subtitlePosition += 1
        }

        for (idx, line) in lines.enumerated() where line.contains("#EXT-X-STREAM-INF") {
            lines[idx] = line + "," + "SUBTITLES=\"\(Self.hlsSubtitleGroupID)\""
        }

        return lines.joined(separator: "\n")
    }

    private func convertMainPlaylistToMultivariant(_: String) -> String {
        // Build a multivariant playlist out of a single main playlist
        let subtitlesMediaStrings = payload.textTracks.enumerated()
            .map(makeSubtitleTypes)

        return """
        #EXTM3U
        \(subtitlesMediaStrings.joined(separator: "\n"))
        #EXT-X-STREAM-INF:BANDWIDTH=640000,SUBTITLES="\(Self.hlsSubtitleGroupID)"
        \(payload.uri ?? "")
        """
    }

    private func makeSubtitleTypes(_ idx: Int, _ textTrack: TextTrack) -> String {
        "#EXT-X-MEDIA:" + [
            "TYPE": "SUBTITLES",
            "GROUP-ID": "\"\(Self.hlsSubtitleGroupID)\"",
            "NAME": "\"\(textTrack.title)\"",
            "CHARACTERISTICS": "\"public.accessibility.transcribes-spoken-dialog\"",
            "DEFAULT": idx == 0 ? "YES" : "NO",
            "AUTOSELECT": idx == 0 ? "YES" : "NO",
            "FORCED": idx == 0 ? "YES" : "NO",
            "URI": "\"\(Self.hlsSubtitlesScheme)://\(idx).subtitle.m3u8\"",
            "LANGUAGE": "\"\(textTrack.language)\"",
        ]
        .map { "\($0.key)=\($0.value)" }
        .joined(separator: ",")
    }
}
