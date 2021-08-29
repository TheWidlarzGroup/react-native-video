# Caching

Caching is currently supported on `Android ExoPlayer` platforms with SimpleCache.

# Technology

The caching in Android works in a way similar to [ExoPlayer Cache](https://stackoverflow.com/questions/28700391/using-cache-in-exoplayer).

# How Does It Work

The caching is based on the url of the asset.
LeastRecentlyUsedEvictor is a LRU ([Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))) cache.

# Features

Caching in Android works on all kind of urls supported by ExoPlayer(Tested with: `.mp4`, `.m3u8`, `.mov`).

There are customisable props to determine if the video should be cached or not at runtime and determine the maximum size of the cache to be used according to the device.

By default the maximum cache size is 100MB and a maximum of 200MB is recommended. Also, if you are using large mp4 files, the maximum cache file size for each file can be increased but is recommended to keep as small as possible.
