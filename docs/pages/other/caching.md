# Caching

Caching is supported on `iOS` platforms with a CocoaPods setup and on `Android` using `SimpleCache`.

## Android

Android uses an LRU `SimpleCache` with a variable cache size, which can be specified by `bufferConfig - cacheSizeMB`. This creates a folder named `RNVCache` inside the app's `cache` directory.

Note that `react-native-video` does not currently offer a native method to flush the cache, but it can be cleared by manually clearing the app's cache.

Additionally, this resolves the issue in RNV6 where the source URI was repeatedly called when looping a video on Android.

## iOS

### Technology

The cache is backed by [SPTPersistentCache](https://github.com/spotify/SPTPersistentCache) and [DVAssetLoaderDelegate](https://github.com/vdugnist/DVAssetLoaderDelegate).

### How It Works

Caching is based on the asset's URL. `SPTPersistentCache` uses an LRU ([Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))) caching policy.

### Restrictions

Currently, caching is only supported for URLs ending in `.mp4`, `.m4v`, or `.mov`. In future versions, URLs with query strings (e.g., `test.mp4?resolution=480p`) will be supported once dependencies allow access to the `Content-Type` header.

At this time, HLS playlists (`.m3u8`) and videos with sideloaded text tracks are not supported and will bypass the cache.

You will see warnings in the Xcode logs when using `debug` mode. If you're unsure whether your video is cached, check your Xcode logs.

By default, files expire after 30 days, and the maximum cache size is 100MB.

Future updates may include more configurable caching options.
