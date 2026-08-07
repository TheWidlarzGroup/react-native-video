import Foundation

// Stress harness for the VideoManager registry race. See README.md.
// The "unsafe" arm is a bare NSHashTable control that must crash; "safe" drives the real
// SynchronizedHashTable and must survive.

final class StressPlayer {
  var ignoreSilentSwitchMode: Int32 = 0
}

let arm = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "safe"
let seconds = CommandLine.arguments.count > 2 ? Double(CommandLine.arguments[2])! : 15.0
let deadline = Date().addingTimeInterval(seconds)

let unsafeTable = NSHashTable<StressPlayer>.weakObjects()
let safeTable = SynchronizedHashTable<StressPlayer>(weakObjects: true)

@inline(never) func register(_ p: StressPlayer) {
  if arm == "unsafe" { unsafeTable.add(p) } else { safeTable.add(p) }
}

@inline(never) func unregister(_ p: StressPlayer) {
  if arm == "unsafe" { unsafeTable.remove(p) } else { safeTable.remove(p) }
}

// Mirrors the audio-session refresh's read of the registry.
@inline(never) func configureAudioSession() {
  if arm == "unsafe" {
    _ = unsafeTable.allObjects.contains { $0.ignoreSilentSwitchMode == 1 }
  } else {
    _ = safeTable.allObjects.contains { $0.ignoreSilentSwitchMode == 1 }
  }
}

// Writer == registration on the JS thread, release from whichever thread drops the last
// reference. Half are explicitly unregistered, half only deallocated — both mutate the table.
let jsThread = DispatchQueue(label: "com.facebook.react.runtime.JavaScript")
jsThread.async {
  var keep: [StressPlayer] = []
  while Date() < deadline {
    autoreleasepool {
      for _ in 0..<128 {
        let p = StressPlayer()
        register(p)
        keep.append(p)
      }
      for p in keep.prefix(64) { unregister(p) }
      keep.removeAll(keepingCapacity: true)
    }
  }
}

// Reader == the audio-session refresh, from a Swift closure on the main queue.
func tick() {
  if Date() >= deadline {
    FileHandle.standardError.write("[\(arm)] SURVIVED\n".data(using: .utf8)!)
    exit(arm == "unsafe" ? 2 : 0)
  }
  configureAudioSession()
  DispatchQueue.main.async(execute: tick)
}

FileHandle.standardError.write("[\(arm)] starting, \(seconds)s\n".data(using: .utf8)!)
DispatchQueue.main.async(execute: tick)
dispatchMain()
