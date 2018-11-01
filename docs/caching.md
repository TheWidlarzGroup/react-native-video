# Caching

Caching is currently only supported on `iOS` platforms with a CocoaPods setup.

# Technology

The cache is backed by [SPTPersistentCache](https://github.com/spotify/SPTPersistentCache) and [DVAssetLoaderDelegate](https://github.com/vdugnist/DVAssetLoaderDelegate).

# How Does It Work

The caching is based on the url of the asset.
SPTPersistentCache is a LRU ([Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))) cache.

# Restrictions

Currently, caching is only supported for URLs that end in a `.mp4`, `.m4v`, or `.mov` extension. In future versions, URLs that end in a query string (e.g. test.mp4?resolution=480p) will be support once dependencies allow access to the `Content-Type` header.  At this time, HLS playlists (.m3u8) and videos that sideload text tracks are not supported and will bypass the cache.

You will also receive warnings in the Xcode logs by using the `debug` mode. So if you are not 100% sure if your video is cached, check your Xcode logs!

By default files expire after 30 days and the maxmimum cache size is 100mb.

In a future release the cache might have more configurable options.
