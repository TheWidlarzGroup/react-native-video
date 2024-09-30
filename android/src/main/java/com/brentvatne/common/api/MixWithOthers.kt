package com.brentvatne.common.api

import androidx.annotation.IntDef
import kotlin.annotation.Retention

internal object MixWithOthers {
    /**
     * Either the width or height is decreased to obtain the desired aspect ratio.
     */
    const val MIX_INHERIT = 0

    /**
     * The width is fixed and the height is increased or decreased to obtain the desired aspect ratio.
     */
    const val MIX_DUCK = 1

    /**
     * The height is fixed and the width is increased or decreased to obtain the desired aspect ratio.
     */
    const val MIX_MIX = 2

    @JvmStatic
    @Mode
    fun toMixWithOthers(ordinal: String): Int =
        when (ordinal) {
            "inherit" -> MIX_INHERIT
            "duck" -> MIX_DUCK
            "mix" -> MIX_MIX
            else -> MIX_INHERIT
        }

    @Retention(AnnotationRetention.SOURCE)
    @IntDef(
        MIX_INHERIT,
        MIX_DUCK,
        MIX_MIX,
    )
    annotation class Mode
}
