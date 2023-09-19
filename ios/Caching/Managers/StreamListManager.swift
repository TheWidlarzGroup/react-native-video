/*
See LICENSE folder for this sample’s licensing information.

Abstract:
The `StreamListManager` class manages loading reading the contents of the
 `Streams.plist` file in the application bundle.
*/

import Foundation

/// - Tag: StreamListManager
class StreamListManager {
    
    // MARK: Types
    
    /// A singleton instance of `StreamListManager`.
    static let shared: StreamListManager = StreamListManager()
    
    // MARK: Properties.
    
    /// The array of `Stream` values representing entries from the `Streams.plist` file.
    var streams: [Stream]!
    
    /// A dictionary mapping the name of a stream to its corresponding `Stream` value.
    private var streamMap = [String: Stream]()
    
    // MARK: Initialization.
    
    private init() {
        do {
            guard let streamsFilepath = Bundle.main.url(forResource: "Streams", withExtension: "plist") else { return }
            
            let data = try Data(contentsOf: streamsFilepath)
            
            let plistDecoder = PropertyListDecoder()
            
            streams = try plistDecoder.decode([Stream].self, from: data)
            
            for stream in streams {
                streamMap[stream.name] = stream
            }
        } catch {
            fatalError("An error occured when reading the Streams.plist file: \(error.localizedDescription)")
        }
    }
    
    // MARK: API.
    
    /// Returns a `Stream` value for a given name.
    ///
    /// - Parameter name: The name of the stream to lookup.
    /// - Returns: The `Stream` value.
    func stream(withName name: String) -> Stream {
        guard let stream = streamMap[name] else {
            fatalError("Could not find `Stream` with name: \(name)")
        }
        
        return stream
    }
}
