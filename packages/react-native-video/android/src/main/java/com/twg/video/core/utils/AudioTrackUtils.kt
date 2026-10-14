package com.twg.video.core.utils

import androidx.media3.common.C
import androidx.media3.common.Format
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import com.margelo.nitro.video.AudioTrack

/**
 * Alternate audio track selection, built on Media3's track selection APIs.
 *
 * This is [TextTrackUtils]' mechanism: picking an audio track is a real, exact operation - one of
 * a set of genuinely different tracks (a dub, a commentary, a described mix) - rather than a cap
 * on an adaptive ladder. So a [TrackSelectionOverride] here means what it says, and
 * `Tracks.Group.isTrackSelected` is the right "which one is playing" signal.
 *
 * The one place this differs from text tracks is the null/clear case. Text can be genuinely off, so
 * [TextTrackUtils] clears by `setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)`. Audio can not - there
 * is always some audio track selected - so null here means "back to ExoPlayer's default choice"
 * (locale/`selectUndeterminedTextLanguage` preferences), never "mute".
 */
@UnstableApi
object AudioTrackUtils {
  private const val ID_PREFIX = "audio"

  /**
   * All *playable* audio tracks of the current item, in manifest order.
   *
   * Tracks the device has no decoder for are omitted - offering one would let a menu hard-fail
   * playback outright. See the note in [enumerate].
   */
  fun getAvailableAudioTracks(player: ExoPlayer): Array<AudioTrack> =
    Threading.runOnMainThreadSync { enumerate(player).map { it.track }.toTypedArray() }

  /**
   * Selects [trackId], or restores ExoPlayer's default audio selection when it is null.
   *
   * Returns the track that was selected, or null when nothing was - either because [trackId] was
   * null, or because it doesn't resolve against the current `currentTracks` snapshot (tracks not
   * known yet, or a snapshot from a previous media item).
   */
  fun selectAudioTrack(player: ExoPlayer, trackId: String?): AudioTrack? =
    Threading.runOnMainThreadSync {
      val builder = player.trackSelectionParameters.buildUpon()
      // Audio selection only ever swaps tracks - it must never disable audio outright.
      builder.setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, false)

      if (trackId == null) {
        builder.clearOverridesOfType(C.TRACK_TYPE_AUDIO)
        player.trackSelectionParameters = builder.build()
        return@runOnMainThreadSync null
      }

      val target = enumerate(player).firstOrNull { it.track.id == trackId }
        ?: return@runOnMainThreadSync null

      builder.setOverrideForType(
        TrackSelectionOverride(target.group.mediaTrackGroup, listOf(target.trackIndex))
      )
      player.trackSelectionParameters = builder.build()

      target.track
    }

  /** The audio track ExoPlayer is actually playing, or null if there is no audio. */
  fun getSelectedAudioTrack(player: ExoPlayer): AudioTrack? =
    Threading.runOnMainThreadSync { enumerate(player).firstOrNull { it.track.selected }?.track }

  /**
   * Finds [desired] again inside [available] after the track set changed.
   *
   * Ids prefer `Format.id`, which for audio is a manifest-declared rendition identity and so
   * usually survives a re-prepare of the same content - but it is optional, and the positional
   * fallback is not stable at all. Matching on the track's actual characteristics is what lets a
   * user's pick survive a source replacement or content re-attaching after an ad break.
   */
  fun findEquivalent(available: Array<AudioTrack>, desired: AudioTrack): AudioTrack? =
    available.firstOrNull { it.id == desired.id }
      ?: available.firstOrNull {
        it.language == desired.language && it.label == desired.label &&
          it.channels == desired.channels
      }
      ?: available.firstOrNull { desired.language != null && it.language == desired.language }

  private class Entry(val group: Tracks.Group, val trackIndex: Int, val track: AudioTrack)

  private fun enumerate(player: ExoPlayer): List<Entry> {
    val groups = mutableListOf<Tracks.Group>()
    val indices = mutableListOf<Int>()
    val formats = mutableListOf<Format>()
    // Positional ids, used only where Format.id is absent or ambiguous.
    val positional = mutableListOf<String>()

    player.currentTracks.groups.forEachIndexed { groupIndex, group ->
      if (group.type != C.TRACK_TYPE_AUDIO) return@forEachIndexed
      for (trackIndex in 0 until group.length) {
        // Tracks the device can't decode are skipped. An override has no fallback the way default
        // selection does, so
        // forcing one onto an unsupported track makes MediaCodecAudioRenderer fail to initialise a
        // decoder, and that surfaces as an ExoPlaybackException that kills the whole playback -
        // video with it - and leaves the player in a state where no later selection is honoured.
        // Verified on a Pixel 6 Pro API 34 emulator against Apple's Dolby Vision/Atmos example,
        // whose ac-3 and e-ac-3 renditions report format_supported=NO_UNSUPPORTED_SUBTYPE: this is
        // ordinary on real devices too, since AC-3/E-AC-3/DTS decoders are far from universal.
        if (!group.isTrackSupported(trackIndex)) continue
        groups.add(group)
        indices.add(trackIndex)
        formats.add(group.getTrackFormat(trackIndex))
        positional.add("$ID_PREFIX-$groupIndex-$trackIndex")
      }
    }

    // Unlike video renditions, an audio track's Format.id is a meaningful rendition identity
    // (the HLS EXT-X-MEDIA / DASH AdaptationSet entry), so it is preferred - it survives a
    // re-prepare where a position does not. It is still optional and not guaranteed unique,
    // so it is only used where it is present on every track and distinct across all of them.
    val manifestIds = formats.map { it.id }
    val useManifestIds = manifestIds.isNotEmpty() &&
      manifestIds.all { it != null } &&
      manifestIds.distinct().size == manifestIds.size

    return formats.mapIndexed { index, format ->
      val channels = format.channelCount.takeIf { it != Format.NO_VALUE && it > 0 }
      Entry(
        group = groups[index],
        trackIndex = indices[index],
        track = AudioTrack(
          id = if (useManifestIds) manifestIds[index]!! else positional[index],
          label = labelFor(format, index, channels),
          language = format.language,
          // Correct for audio (see the class doc): audio groups hold genuinely different
          // tracks, so there is no adaptive-membership ambiguity the way there is for video.
          selected = groups[index].isTrackSelected(indices[index]),
          channels = channels?.toDouble(),
        ),
      )
    }
  }

  /**
   * How a viewer names the track. `Format.label` is the manifest's own NAME where there is one;
   * the language code is the next best thing, and the channel count only disambiguates tracks
   * that would otherwise read identically (a stereo and a 5.1 mix of the same language).
   */
  private fun labelFor(format: Format, index: Int, channels: Int?): String {
    val base = format.label ?: format.language ?: "Audio ${index + 1}"
    val suffix = when (channels) {
      null, 1, 2 -> null
      6 -> "5.1"
      8 -> "7.1"
      else -> "${channels}ch"
    } ?: return base
    // Manifest labels often already spell the mix out - don't say it twice.
    return if (base.contains(suffix, ignoreCase = true)) base else "$base $suffix"
  }
}
