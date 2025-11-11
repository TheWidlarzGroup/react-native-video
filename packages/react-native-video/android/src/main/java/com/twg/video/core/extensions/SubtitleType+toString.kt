package com.twg.video.core.extensions

import com.margelo.nitro.video.SubtitleType

fun SubtitleType.toStringExtension(): String {
  return when {
    this == SubtitleType.AUTO -> "auto"
    this == SubtitleType.VTT -> "vtt"
    this == SubtitleType.SRT -> "srt"
    this == SubtitleType.SSA -> "ssa"
    this == SubtitleType.ASS -> "ass"
    else -> throw IllegalArgumentException("Unknown SubtitleType: $this")
  }
}
