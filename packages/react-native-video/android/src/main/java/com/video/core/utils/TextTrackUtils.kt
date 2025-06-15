package com.video.core.utils

import androidx.media3.common.C
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import com.margelo.nitro.video.HybridVideoPlayerSourceSpec
import com.margelo.nitro.video.TextTrack

@UnstableApi
object TextTrackUtils {
    fun getAvailableTextTracks(player: ExoPlayer, source: HybridVideoPlayerSourceSpec): Array<TextTrack> {
        return Threading.runOnMainThreadSync {
            val tracks = mutableListOf<TextTrack>()
            val currentTracks = player.currentTracks

            // Get all text tracks from the current player tracks (includes both built-in and external)
            for (trackGroup in currentTracks.groups) {
                if (trackGroup.type == C.TRACK_TYPE_TEXT) {
                    for (trackIndex in 0 until trackGroup.length) {
                        val format = trackGroup.getTrackFormat(trackIndex)
                        val trackId = format.id ?: "text-$trackIndex"
                        val label = format.label ?: "Unknown ${trackIndex + 1}"
                        val language = format.language
                        val isSelected = trackGroup.isTrackSelected(trackIndex)

                        // Determine if this is an external track by checking if it matches external subtitle labels
                        val isExternal = source.config.externalSubtitles?.any { subtitle ->
                            label.contains(subtitle.label, ignoreCase = true)
                        } ?: false

                        val finalTrackId = if (isExternal) "external-$trackIndex" else trackId

                        tracks.add(
                            TextTrack(
                                id = finalTrackId,
                                label = label,
                                language = language,
                                selected = isSelected
                            )
                        )
                    }
                }
            }

            tracks.toTypedArray()
        }
    }

    fun selectTextTrack(
        player: ExoPlayer,
        textTrack: TextTrack?,
        source: HybridVideoPlayerSourceSpec,
        onTrackChange: (TextTrack?) -> Unit,
    ): Int? {
        return Threading.runOnMainThreadSync {
            val trackSelector = player.trackSelectionParameters.buildUpon()

            // If textTrack is null, disable all text tracks
            if (textTrack == null) {
                trackSelector.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
                player.trackSelectionParameters = trackSelector.build()
                onTrackChange(null)
                return@runOnMainThreadSync null
            }

            if (textTrack.id.isEmpty()) {
                // Disable all text tracks
                trackSelector.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
                player.trackSelectionParameters = trackSelector.build()
                onTrackChange(null)
                return@runOnMainThreadSync null
            }

            val currentTracks = player.currentTracks
            var trackFound = false
            var selectedExternalTrackIndex: Int? = null

            // Find and select the specific text track
            for (trackGroup in currentTracks.groups) {
                if (trackGroup.type == C.TRACK_TYPE_TEXT) {
                    for (trackIndex in 0 until trackGroup.length) {
                        val format = trackGroup.getTrackFormat(trackIndex)
                        val currentTrackId = format.id ?: "text-$trackIndex"
                        val label = format.label ?: "Unknown ${trackIndex + 1}"

                        // Check if this matches our target track (either by original ID or by external ID)
                        val isExternal = source.config.externalSubtitles?.any { subtitle ->
                            label.contains(subtitle.label, ignoreCase = true)
                        } == true

                        val finalTrackId =
                            if (isExternal) "external-$trackIndex" else currentTrackId

                        if (finalTrackId == textTrack.id) {
                            // Enable this specific track
                            trackSelector.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
                            trackSelector.setOverrideForType(
                                TrackSelectionOverride(
                                    trackGroup.mediaTrackGroup,
                                    listOf(trackIndex)
                                )
                            )

                            // Update selection state
                            selectedExternalTrackIndex = if (isExternal) {
                                trackIndex
                            } else {
                                null
                            }

                            onTrackChange(textTrack)
                            trackFound = true
                            break
                        }
                    }
                    if (trackFound) {
                        break
                    }
                }
            }

            // Apply the track selection parameters regardless of whether we found a track
            player.trackSelectionParameters = trackSelector.build()
            selectedExternalTrackIndex
        }
    }

    fun getSelectedTrack(player: ExoPlayer, source: HybridVideoPlayerSourceSpec): TextTrack? {
        return Threading.runOnMainThreadSync {
            val currentTracks = player.currentTracks

            // Find the currently selected text track
            for (trackGroup in currentTracks.groups) {
                if (trackGroup.type == C.TRACK_TYPE_TEXT && trackGroup.isSelected) {
                    for (trackIndex in 0 until trackGroup.length) {
                        if (trackGroup.isTrackSelected(trackIndex)) {
                            val format = trackGroup.getTrackFormat(trackIndex)
                            val trackId = format.id ?: "text-$trackIndex"
                            val label = format.label ?: "Unknown ${trackIndex + 1}"
                            val language = format.language

                            // Determine if this is an external track by checking if it matches external subtitle labels
                            val isExternal = source.config.externalSubtitles?.any { subtitle ->
                                label.contains(subtitle.label, ignoreCase = true)
                            } == true

                            val finalTrackId = if (isExternal) "external-$trackIndex" else trackId

                            return@runOnMainThreadSync TextTrack(
                                id = finalTrackId,
                                label = label,
                                language = language,
                                selected = true
                            )
                        }
                    }
                }
            }

            null
        }
    }
}
