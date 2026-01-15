package com.brentvatne.common.api

import android.net.Uri
import android.text.TextUtils
import com.brentvatne.common.toolbox.ReactBridgeUtils
import com.facebook.react.bridge.ReadableMap
import java.util.Objects

class AdsProps {
    var type: String? = null
    var streamType: String? = null
    var adTagUrl: Uri? = null
    var adLanguage: String? = null
    var contentSourceId: String? = null
    var videoId: String? = null
    var assetKey: String? = null
    var format: String? = null
    var adTagParameters: Map<String, String>? = null
    var fallbackUri: String? = null

    fun isCSAI(): Boolean = type == "csai" && adTagUrl != null
    fun isDAI(): Boolean = type == "ssai"
    fun isDAIVod(): Boolean = type == "ssai" && streamType == "vod"
    fun isDAILive(): Boolean = type == "ssai" && streamType == "live"

    override fun equals(other: Any?): Boolean {
        if (other == null || other !is AdsProps) return false
        return (
            type == other.type &&
                streamType == other.streamType &&
                adTagUrl == other.adTagUrl &&
                adLanguage == other.adLanguage &&
                contentSourceId == other.contentSourceId &&
                videoId == other.videoId &&
                assetKey == other.assetKey &&
                format == other.format &&
                adTagParameters == other.adTagParameters &&
                fallbackUri == other.fallbackUri
            )
    }

    override fun hashCode(): Int =
        Objects.hash(
            type, streamType, adTagUrl, adLanguage, contentSourceId, videoId, assetKey, format, adTagParameters, fallbackUri
        )

    companion object {
        private const val PROP_TYPE = "type"
        private const val PROP_STREAM_TYPE = "streamType"
        private const val PROP_AD_TAG_URL = "adTagUrl"
        private const val PROP_AD_LANGUAGE = "adLanguage"
        private const val PROP_CONTENT_SOURCE_ID = "contentSourceId"
        private const val PROP_VIDEO_ID = "videoId"
        private const val PROP_ASSET_KEY = "assetKey"
        private const val PROP_FORMAT = "format"
        private const val PROP_AD_TAG_PARAMETERS = "adTagParameters"
        private const val PROP_FALLBACK_URI = "fallbackUri"

        @JvmStatic
        fun parse(src: ReadableMap?): AdsProps {
            val adsProps = AdsProps()
            if (src != null) {
                adsProps.type = ReactBridgeUtils.safeGetString(src, PROP_TYPE)
                adsProps.streamType = ReactBridgeUtils.safeGetString(src, PROP_STREAM_TYPE)

                val uriString = ReactBridgeUtils.safeGetString(src, PROP_AD_TAG_URL)
                if (!TextUtils.isEmpty(uriString)) {
                    adsProps.adTagUrl = Uri.parse(uriString)
                }

                val languageString = ReactBridgeUtils.safeGetString(src, PROP_AD_LANGUAGE)
                if (!TextUtils.isEmpty(languageString)) {
                    adsProps.adLanguage = languageString
                }

                adsProps.contentSourceId = ReactBridgeUtils.safeGetString(src, PROP_CONTENT_SOURCE_ID)
                adsProps.videoId = ReactBridgeUtils.safeGetString(src, PROP_VIDEO_ID)
                adsProps.assetKey = ReactBridgeUtils.safeGetString(src, PROP_ASSET_KEY)
                adsProps.format = ReactBridgeUtils.safeGetString(src, PROP_FORMAT)
                adsProps.fallbackUri = ReactBridgeUtils.safeGetString(src, PROP_FALLBACK_URI)

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
                            adsProps.adTagParameters = params
                        }
                    }
                }
            }
            return adsProps
        }
    }
}
