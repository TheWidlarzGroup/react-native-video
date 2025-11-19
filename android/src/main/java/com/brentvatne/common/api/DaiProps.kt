package com.brentvatne.common.api

import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap

class DaiProps {
    var contentSourceId: String? = null
    var videoId: String? = null
    var assetKey: String? = null
    var adTagParameters: Map<String, String>? = null
    var backupStreamUri: String? = null

    override fun equals(other: Any?): Boolean {
        if (other == null || other !is DaiProps) return false
        return (
            contentSourceId == other.contentSourceId &&
                videoId == other.videoId &&
                assetKey == other.assetKey &&
                adTagParameters == other.adTagParameters &&
                backupStreamUri == other.backupStreamUri
            )
    }

    companion object {
        private const val PROP_CONTENT_SOURCE_ID = "contentSourceId"
        private const val PROP_VIDEO_ID = "videoId"
        private const val PROP_ASSET_KEY = "assetKey"
        private const val PROP_AD_TAG_PARAMETERS = "adTagParameters"
        private const val PROP_BACKUP_STREAM_URI = "backupStreamUri"

        @JvmStatic
        fun parse(src: ReadableMap?): DaiProps {
            val daiProps = DaiProps()
            if (src != null) {
                daiProps.contentSourceId = ReactBridgeUtils.safeGetString(src, PROP_CONTENT_SOURCE_ID)
                daiProps.videoId = ReactBridgeUtils.safeGetString(src, PROP_VIDEO_ID)
                daiProps.assetKey = ReactBridgeUtils.safeGetString(src, PROP_ASSET_KEY)
                daiProps.backupStreamUri = ReactBridgeUtils.safeGetString(src, PROP_BACKUP_STREAM_URI)

                if (src.hasKey(PROP_AD_TAG_PARAMETERS)) {
                    val adTagParamsMap = src.getMap(PROP_AD_TAG_PARAMETERS)
                    if (adTagParamsMap != null) {
                        val params = mutableMapOf<String, String>()
                        val iterator = adTagParamsMap.keySetIterator()
                        while (iterator.hasNextKey()) {
                            val key = iterator.nextKey()
                            val value = adTagParamsMap.getString(key)
                            if (value != null) {
                                params[key] = value
                            }
                        }
                        if (params.isNotEmpty()) {
                            daiProps.adTagParameters = params
                        }
                    }
                }
            }
            return daiProps
        }
    }
}
