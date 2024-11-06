package com.dice.messaging

import androidx.media3.common.C.TRACK_TYPE_AUDIO
import androidx.media3.common.C.TRACK_TYPE_TEXT
import androidx.media3.common.Format
import com.dice.dicemessaging.PlayerAudioTracksInfo
import com.dice.dicemessaging.PlayerTextTracksInfo
import com.dice.dicemessaging.SetPlayerAnnotationsInfo
import com.diceplatform.doris.DorisPlayer
import com.diceplatform.doris.custom.ui.entity.annotation.Annotation
import com.diceplatform.doris.entity.Track


internal fun DorisPlayer.getMessagingAudioTracks(): List<PlayerAudioTracksInfo.AudioTrack>? {
    return getAudioTrackFormats()?.map { it.toMessagingAudioTrack() }
}

internal fun DorisPlayer.getSelectedMessagingAudioTrack(): PlayerAudioTracksInfo.AudioTrack? {
    return getSelectedAudioTrackFormat()?.toMessagingAudioTrack()
}

internal fun Track.toMessagingAudioTrack(id: String) = PlayerAudioTracksInfo.AudioTrack(
    id = id,
    label = name,
    lang = language,
)

internal fun Format.toMessagingAudioTrack() = PlayerAudioTracksInfo.AudioTrack(
    id = id,
    label = label,
    lang = language,
)

internal fun Format.toMediaAudioTrack(selected: Boolean) = toMediaTrack(TRACK_TYPE_AUDIO, selected)

internal fun DorisPlayer.getMessagingTextTracks(): List<PlayerTextTracksInfo.TextTrack>? {
    val languageUriMap = getTextTrackConfigurations()
        ?.filter { it.language != null }
        ?.associate { it.language to it.uri.toString() }

    return getTextTrackFormats()?.map { format ->
        val src = format.language?.let { languageUriMap?.get(it) }
        format.toMessagingTextTrack(src)
    }
}

internal fun DorisPlayer.getSelectedMessagingTextTrack(): PlayerTextTracksInfo.TextTrack? {
    return getSelectedTextTrackFormat()
        ?.let { it.toMessagingTextTrack(getTextTrackUri(it.language)?.toString()) }
}

internal const val TEXT_TRACK_KIND_SUBTITLE = "subtitles"
internal const val TEXT_TRACK_KIND_CC = "cc"

internal fun Track.toMessagingTextTrack(src: String?) = PlayerTextTracksInfo.TextTrack(
    kind = TEXT_TRACK_KIND_SUBTITLE,
    label = name,
    lang = language,
    src = src,
)

internal fun Format.toMessagingTextTrack(src: String?) = PlayerTextTracksInfo.TextTrack(
    kind = TEXT_TRACK_KIND_SUBTITLE,
    label = label,
    lang = language,
    src = src,
)

internal fun Format.toMediaTextTrack(selected: Boolean) = toMediaTrack(TRACK_TYPE_TEXT, selected)

internal fun Format.toMediaTrack(type: Int, selected: Boolean) = Track(
    type,
    label,
    language,
    selected,
)

internal fun SetPlayerAnnotationsInfo.PlayerAnnotation.toDorisAnnotation() = Annotation.Builder()
    .setType(
        when (type) {
            SetPlayerAnnotationsInfo.AnnotationType.TEXT -> Annotation.Type.TEXT
            SetPlayerAnnotationsInfo.AnnotationType.DRAWABLE -> Annotation.Type.DRAWABLE
            else -> Annotation.Type.RECTANGLE
        }
    )
    .setVerticalPosition(
        when (verticalPosition) {
            SetPlayerAnnotationsInfo.VerticalPosition.BOTTOM -> Annotation.VerticalPosition.BOTTOM
            SetPlayerAnnotationsInfo.VerticalPosition.CENTER -> Annotation.VerticalPosition.CENTER
            else -> Annotation.VerticalPosition.TOP
        }
    )
    .setHorizontalPosition(
        when (horizontalPosition) {
            SetPlayerAnnotationsInfo.HorizontalPosition.START -> Annotation.HorizontalPosition.START
            SetPlayerAnnotationsInfo.HorizontalPosition.END -> Annotation.HorizontalPosition.END
            else -> Annotation.HorizontalPosition.CENTER
        }
    )
    .setPosition(position)
    .setMarginVerticalDp(marginVerticalDp)
    .setShowOnFullScreenOnly(showOnFullScreenOnly)
    .setScrubSticky(scrubSticky)
    .setClickable(clickable)
    .setName(name)
    .setThumbnailUrl(thumbnailUrl)
    .setDrawableResId(drawableResId)
    .setDrawableSizeInDp(drawableSizeInDp)
    .setText(text)
    .setTextSizeSp(textSizeSp)
    .setTextColor(textColor)
    .build()
