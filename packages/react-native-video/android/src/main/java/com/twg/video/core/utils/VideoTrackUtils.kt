package com.twg.video.core.utils

import androidx.media3.common.C
import androidx.media3.common.Format
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import com.margelo.nitro.video.VideoTrack
import java.util.Locale
import kotlin.math.min

/**
 * Manual (YouTube-style) video quality selection, built on Media3's track selection APIs.
 *
 * Mirrors [TextTrackUtils]: enumeration walks `player.currentTracks.groups`, selection goes
 * through a [TrackSelectionOverride]. Unlike `setMaxVideoSize`/`setMaxVideoBitrate` - which are
 * soft caps the adaptive track selector is still free to move under - an override is a hard lock:
 * ExoPlayer plays exactly the rendition it names until the override is cleared.
 */
@UnstableApi
object VideoTrackUtils {
  private const val ID_PREFIX = "video"

  /**
   * All *playable* video renditions of the current item, best first.
   *
   * Renditions the device can't decode are skipped: offering one in a quality menu would hard-lock
   * playback into a black screen, since an override has no fallback the way adaptive selection does.
   */
  fun getAvailableVideoTracks(player: ExoPlayer): Array<VideoTrack> =
    Threading.runOnMainThreadSync { enumerate(player) }

  /** The rendition ExoPlayer is actually rendering right now, or null if there is no video. */
  fun getActiveVideoTrack(player: ExoPlayer): VideoTrack? =
    Threading.runOnMainThreadSync { enumerate(player).firstOrNull { it.selected } }

  /**
   * Index of the rendition [active] corresponds to, or -1.
   *
   * `player.videoFormat` is what the *renderer* reports: derived from the media segment, not the
   * manifest entry, so it is often not `equals` to any track group format (bitrate in particular
   * regularly differs or is absent). Resolution is the reliable discriminator; bitrate only breaks
   * ties between rungs that share one.
   */
  private fun indexOfActive(formats: List<Format>, active: Format?): Int {
    if (active == null) return -1
    val exact = formats.indexOfFirst { it == active }
    if (exact >= 0) return exact

    val candidates = formats.withIndex()
      .filter { it.value.width == active.width && it.value.height == active.height }
    if (candidates.isEmpty()) return -1
    if (candidates.size == 1 || active.bitrate == Format.NO_VALUE) return candidates.first().index

    return candidates.minByOrNull { (_, format) ->
      if (format.bitrate == Format.NO_VALUE) Int.MAX_VALUE
      else kotlin.math.abs(format.bitrate - active.bitrate)
    }!!.index
  }

  /**
   * Hard-locks playback to [trackId], or restores adaptive selection when it is null.
   *
   * Returns the track that was pinned, or null when nothing was pinned - either because [trackId]
   * was null (Auto) or because it doesn't resolve against the current `currentTracks` snapshot
   * (tracks not known yet, or a snapshot from a previous media item).
   */
  fun selectVideoTrack(player: ExoPlayer, trackId: String?): VideoTrack? =
    Threading.runOnMainThreadSync {
      val builder = player.trackSelectionParameters.buildUpon()
      // Quality selection only ever swaps renditions - it must never disable video outright.
      builder.setTrackTypeDisabled(C.TRACK_TYPE_VIDEO, false)

      if (trackId == null) {
        builder.clearOverridesOfType(C.TRACK_TYPE_VIDEO)
        player.trackSelectionParameters = builder.build()
        return@runOnMainThreadSync null
      }

      val target = resolve(player, trackId) ?: return@runOnMainThreadSync null
      builder.setOverrideForType(
        TrackSelectionOverride(target.group.mediaTrackGroup, listOf(target.trackIndex))
      )
      player.trackSelectionParameters = builder.build()

      enumerate(player).firstOrNull { it.id == trackId }
    }

  /**
   * Finds [desired] again inside [available] after the track set changed.
   *
   * Track ids encode positions inside one `currentTracks` snapshot, so they can shift when the
   * source is replaced or content re-attaches after an ad break. Falling back to the rendition's
   * actual characteristics is what lets a user's pick survive those transitions.
   */
  fun findEquivalent(available: Array<VideoTrack>, desired: VideoTrack): VideoTrack? =
    available.firstOrNull { it.id == desired.id }
      ?: available.firstOrNull {
        it.width == desired.width && it.height == desired.height && it.bitrate == desired.bitrate
      }
      ?: available.firstOrNull {
        desired.width != null && it.width == desired.width && it.height == desired.height
      }

  private class Resolved(val group: Tracks.Group, val trackIndex: Int)

  private fun resolve(player: ExoPlayer, trackId: String): Resolved? {
    val parts = trackId.split('-')
    if (parts.size != 3 || parts[0] != ID_PREFIX) return null
    val groupIndex = parts[1].toIntOrNull() ?: return null
    val trackIndex = parts[2].toIntOrNull() ?: return null

    val group = player.currentTracks.groups.getOrNull(groupIndex) ?: return null
    if (group.type != C.TRACK_TYPE_VIDEO) return null
    if (trackIndex < 0 || trackIndex >= group.length) return null
    if (!group.isTrackSupported(trackIndex)) return null

    return Resolved(group, trackIndex)
  }

  private class Entry(
    val id: String,
    val language: String?,
    val selected: Boolean,
    val width: Int?,
    val height: Int?,
    val bitrate: Int?,
  ) {
    /**
     * Resolution as a viewer names it - the short edge, so portrait content reads "1080p" too.
     */
    val shortEdge: Int? = if (width != null && height != null) min(width, height) else null
  }

  private fun enumerate(player: ExoPlayer): Array<VideoTrack> {
    val formats = mutableListOf<Format>()
    val ids = mutableListOf<String>()

    player.currentTracks.groups.forEachIndexed { groupIndex, group ->
      if (group.type != C.TRACK_TYPE_VIDEO) return@forEachIndexed
      for (trackIndex in 0 until group.length) {
        if (!group.isTrackSupported(trackIndex)) continue
        formats.add(group.getTrackFormat(trackIndex))
        // Deliberately positional rather than Format.id: manifest-provided ids are neither
        // stable nor meaningful across the content pipelines this ships against.
        ids.add("$ID_PREFIX-$groupIndex-$trackIndex")
      }
    }

    // NOT Tracks.Group.isTrackSelected: for video that reports membership of the *adaptive* track
    // selection, so every rung of the ladder comes back selected while playback is on Auto. The
    // rendition actually on screen is the renderer's current input format.
    val activeIndex = indexOfActive(formats, player.videoFormat)

    val entries = formats.mapIndexed { index, format ->
      Entry(
        id = ids[index],
        language = format.language,
        selected = index == activeIndex,
        width = format.width.takeIf { it != Format.NO_VALUE },
        height = format.height.takeIf { it != Format.NO_VALUE },
        bitrate = format.bitrate.takeIf { it != Format.NO_VALUE && it > 0 },
      )
    }.toMutableList()

    entries.sortWith(
      compareByDescending<Entry> { (it.width ?: 0).toLong() * (it.height ?: 0).toLong() }
        .thenByDescending { it.bitrate ?: 0 }
    )

    // Several renditions can share a resolution line (same height, different bitrate ladder rung),
    // which happens on real streams - disambiguate only those, so the common case stays "1080p".
    val ambiguousShortEdges = entries
      .mapNotNull { it.shortEdge }
      .groupingBy { it }
      .eachCount()
      .filterValues { it > 1 }
      .keys

    return entries.mapIndexed { index, entry ->
      VideoTrack(
        id = entry.id,
        label = labelFor(entry, index, ambiguousShortEdges.contains(entry.shortEdge)),
        language = entry.language,
        selected = entry.selected,
        width = entry.width?.toDouble(),
        height = entry.height?.toDouble(),
        bitrate = entry.bitrate?.toDouble(),
      )
    }.toTypedArray()
  }

  private fun labelFor(entry: Entry, index: Int, ambiguous: Boolean): String {
    val resolution = entry.shortEdge?.let { "${it}p" }
    val bitrate = entry.bitrate?.let { formatMbps(it) }
    return when {
      resolution != null && ambiguous && bitrate != null -> "$resolution - $bitrate"
      resolution != null -> resolution
      bitrate != null -> bitrate
      else -> "Track ${index + 1}"
    }
  }

  private fun formatMbps(bitrate: Int): String =
    String.format(Locale.US, "%.1f Mbps", bitrate / 1_000_000.0)
}
