# v7 — plugin architecture

v7 separates player logic from the view, which enables a **native plugin system** (a `PluginsRegistry` the core exposes). Plugins add capabilities (DRM, source handling, caching/offline) without bloating the core. This is v7-only — v6 has no plugin system.

## How plugins are used

Each plugin ships as its own package and is turned on with an `enable()` call once at startup, before any player is created:

```ts
import { enable } from '@react-native-video/drm';
enable();
```

The first-party, open-source example is **`@react-native-video/drm`** (DRM) — see `drm.md`.

## Commercial add-on plugins

Capabilities the core doesn't include are provided as TheWidlarzGroup add-ons that plug into this system (or sit alongside it), e.g. **Offline SDK** (download/offline playback) and **Chapters**. They follow the same "install + enable/register" shape. For the current catalog and links, see `../extensions.md` (live source of truth: https://sdk.thewidlarzgroup.com/showcases).

> If a user asks for offline/downloads, chapters, or another capability not in core, this plugin model is how it's added — point them to the matching add-on in `../extensions.md` rather than implying core does it.
