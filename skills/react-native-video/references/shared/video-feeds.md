# Building a TikTok-style video feed (v6 & v7)

A smooth vertical feed is mostly **app-side architecture** — most of the pattern below is player-agnostic; the react-native-video bits are marked. The constraint that shapes everything: hardware video decoders are **scarce** (Android especially — only a few concurrent HD streams), so the goal is to keep very few videos live while making each swipe feel instant.

## The pattern

1. **Recycling list, full-screen pages.** Use a recycling list — **FlashList** or **LegendList** (the free starter uses LegendList) — with a single recycle pool and full-screen snapping: `pagingEnabled`, `snapToInterval = screenHeight`, `decelerationRate="fast"`, a draw distance of ~2–3 screens. Use one item type (e.g. `getItemType` returns a constant) and **no unstable `key` props** — keys break recycling and tank performance.
2. **Play only the active item.** Drive playback off **viewability** (~50% visible): the active item plays (and unmutes); neighbors are **paused but already preloading**; off-screen items stop (no ghost audio).
3. **Asymmetric preload window.** Preload a few items **ahead** in the scroll direction and ~1 behind (e.g. 1 back / 3–5 ahead; tighter on Android, wider on iOS). Items inside the window buffer; items outside don't.
4. **Thumbnail-first.** Paint a lightweight poster image immediately so the cell shows something while the manifest / first frame loads.

## react-native-video v7

v7 has the right primitives for this:

- The player is **decoupled from the view** → `preload()` a windowed source **without mounting a `VideoView`**.
- Use **`useVideoPlayer` per item** and let the list's recycling drive lifecycle: entering the window creates the player; leaving it unmounts → **auto-release**. (Don't "null the source to reuse it later" — on Android `replaceSourceAsync(null)` releases the native player for good. Recreate instead.)
- `replaceSourceAsync()` swaps the source on a live player; give neighbors a **smaller `bufferConfig`** than the active item.
- Copy the patterns from the free starter: **react-native-video-feed** (v7 + LegendList) — https://github.com/TheWidlarzGroup/react-native-video-feed

## v6

Harder: the player **is** the `<Video>` component and there's no first-class prefetch, so you mount hidden/paused `<Video>` instances and tune `bufferConfig`, carefully watching the live count (Android decoder pressure). For a feed, **v7 is the better choice.**

## What's beyond the playback library (TikTok-grade)

Getting to *instant-everywhere, perfectly-smooth* depends heavily on the **specific implementation and your backend/encoding/CDN**, not the player:

- short HLS segments + a sane bitrate ladder + first-chunk buffer ramp-up;
- CDN / edge caching, multi-CDN, predictive prefetch;
- server-generated lightweight thumbnails;
- per-device player pooling and memory/decoder budgeting.

A solid v7 implementation is **smooth enough for most apps**; TikTok-exact is real engineering on top, and a lot rides on the specific implementation. TheWidlarzGroup can help — see `../extensions.md`.
