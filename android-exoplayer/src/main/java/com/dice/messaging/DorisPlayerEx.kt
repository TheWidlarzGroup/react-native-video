@file:SuppressLint("UnsafeOptInUsageError")

package com.dice.messaging

import android.annotation.SuppressLint
import android.net.Uri
import androidx.media3.common.C
import androidx.media3.common.C.TRACK_TYPE_AUDIO
import androidx.media3.common.C.TRACK_TYPE_TEXT
import androidx.media3.common.Format
import androidx.media3.common.Tracks.Group
import androidx.media3.exoplayer.ExoPlayer
import com.diceplatform.doris.DorisPlayer
import com.diceplatform.doris.entity.Track

internal fun DorisPlayer.getAudioTrackFormats(): List<Format>? = exoPlayer?.getTrackFormats(TRACK_TYPE_AUDIO)
internal fun DorisPlayer.getSelectedAudioTrackFormat(): Format? = exoPlayer?.getSelectedTrackFormat(TRACK_TYPE_AUDIO)
internal fun DorisPlayer.findAudioTrackFormat(id: String): Format? = exoPlayer?.getTrackFormats(TRACK_TYPE_AUDIO)?.find { it.id == id }

internal fun DorisPlayer.getTextTrackFormats(): List<Format>? = exoPlayer?.getTrackFormats(TRACK_TYPE_TEXT)
internal fun DorisPlayer.getSelectedTextTrackFormat(): Format? = exoPlayer?.getSelectedTrackFormat(TRACK_TYPE_TEXT)
internal fun DorisPlayer.findTextTrackFormat(language: String): Format? = exoPlayer?.getTrackFormats(TRACK_TYPE_TEXT)?.find { it.language == language }

internal fun DorisPlayer.getTextTrackConfigurations() = exoPlayer?.currentMediaItem?.localConfiguration?.subtitleConfigurations
internal fun DorisPlayer.getTextTrackUri(language: String?): Uri? = getTextTrackConfigurations()?.find { it.language == language }?.uri


internal fun DorisPlayer.isTrackTypeDisabled(
    trackType: @C.TrackType Int,
    defaultValue: Boolean = true,
): Boolean = trackSelector
    ?.parameters
    ?.disabledTrackTypes
    ?.contains(trackType)
    ?: defaultValue

internal fun ExoPlayer.getSelectedTrackFormat(trackType: @C.TrackType Int): Format? {
    return currentTracks
        .groups
        .filter { it.type == trackType }
        .find { it.isSelected }
        ?.getSelectedFormats()
        ?.firstOrNull()
}

internal fun ExoPlayer.getTrackFormats(trackType: @C.TrackType Int): List<Format> {
    return currentTracks
        .groups
        .filter { it.type == trackType }
        .flatMap { it.getFormats() }
}

internal fun Group.getFormats(): List<Format> {
    val retList = mutableListOf<Format>()
    for (i in 0 until length) {
        retList.add(getTrackFormat(i))
    }

    return retList
}

internal fun Group.getSelectedFormats(): List<Format> = filterFormatIndexed { index, _ -> isTrackSelected(index) }
internal fun Group.filterFormatIndexed(predicate: (Int, Format) -> Boolean): List<Format> {
    val retList = mutableListOf<Format>()
    for (i in 0 until length) {
        val trackFormat = getTrackFormat(i)
        if (predicate(i, trackFormat)) {
            retList.add(trackFormat)
        }
    }

    return retList
}

internal fun createOffTextTrack(isSelected: Boolean = true): Track = createOffTrack(TRACK_TYPE_TEXT, isSelected)
internal fun createOffAudioTrack(isSelected: Boolean = true): Track = createOffTrack(TRACK_TYPE_AUDIO, isSelected)

internal const val OFF_TRACK_NAME = "OFF"
internal fun createOffTrack(trackType: Int, isSelected: Boolean = true): Track = Track(
    /* trackType = */ trackType,
    /* name = */ OFF_TRACK_NAME,
    /* language = */ "",
    /* isSelected = */ isSelected,
    /* isOff = */ true,
)
