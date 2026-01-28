package com.dice.messaging

import com.dice.dicemessaging.PlayerAudioTracksInfo
import com.dice.dicemessaging.PlayerTextTracksInfo
import com.dice.dicemessaging.SetPlayerAnnotationsInfo
import com.diceplatform.doris.custom.ui.entity.annotation.Annotation
import com.diceplatform.doris.entity.Track


internal fun Track.toMessagingAudioTrack(id: String? = this.id) = PlayerAudioTracksInfo.AudioTrack(
    id = id,
    label = name,
    lang = language,
)

internal const val TEXT_TRACK_KIND_SUBTITLE = "subtitles"

internal fun Track.toMessagingTextTrack(src: String?) = PlayerTextTracksInfo.TextTrack(
    kind = TEXT_TRACK_KIND_SUBTITLE,
    label = name,
    lang = language,
    src = src,
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
    .setLiveTimestamp(liveTimestamp)
    .setMarginVerticalDp(marginVerticalDp)
    .setShowOnFullScreenOnly(showOnFullScreenOnly)
    .setScrubSticky(scrubSticky)
    .setClickable(clickable)
    .setCanDrawOutsideBounds(canDrawOutsideBounds)
    .setMinWidthInDp(minWidthInDp)
    .setName(name)
    .setThumbnailUrl(thumbnailUrl)
    .setDrawableResId(drawableResId)
    .setDrawableSizeInDp(drawableSizeInDp)
    .setText(text)
    .setTextSizeSp(textSizeSp)
    .setTextColor(textColor)
    .build()
