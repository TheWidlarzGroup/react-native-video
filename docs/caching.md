# Caching

Caching is currently only supported on `iOS` platforms with a CocoaPods setup.

# Technology

The cache is backed by [SPTPersistentCache](https://github.com/spotify/SPTPersistentCache) and [DVAssetLoaderDelegate](https://github.com/vdugnist/DVAssetLoaderDelegate).

# How Does It Work

The caching is based on the url of the asset.
SPTPersistentCache is a LRU ([last recently used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))) cache.

By default files expire after 30 days and the maxmimum cache size is 100mb.

In a future release the cache might have more configurable options.
