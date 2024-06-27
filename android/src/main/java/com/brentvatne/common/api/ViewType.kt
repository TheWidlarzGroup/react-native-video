package com.brentvatne.common.api

internal object ViewType {
    /**
     * View used will be a TextureView.
     */
    const val VIEW_TYPE_TEXTURE = 0

    /**
     * View used will be a SurfaceView.
     */
    const val VIEW_TYPE_SURFACE = 1

    /**
     * View used will be a SurfaceView with secure flag set.
     */
    const val VIEW_TYPE_SURFACE_SECURE = 2
    annotation class ViewType
}
