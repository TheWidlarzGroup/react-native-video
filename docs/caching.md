# Caching

Caching is currently only supported on `iOS` platforms with a CocoaPods setup.

# Technology

The cache is backed by [SPTPersistentCache](https://github.com/spotify/SPTPersistentCache) and [DVAssetLoaderDelegate](https://github.com/vdugnist/DVAssetLoaderDelegate).

# How Does It Work

The caching is based on the url of the asset.
SPTPersistentCache is a LRU ([last recently used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))) cache.

# Restrictions

Currenly the uri of the resource that should be cached needs to have the appropriate file extension (one of `mp4`, `m4v` or `mov`). In order to be cached. In future versions (once dependencies allow access to the `content-type` header) this will no longer be necessary. You will also receive warnings in the xcode logs by using the `debug` mode. So if you are not 100% sure if your video is cached, check your xcode logs!

By default files expire after 30 days and the maxmimum cache size is 100mb.

In a future release the cache might have more configurable options.
