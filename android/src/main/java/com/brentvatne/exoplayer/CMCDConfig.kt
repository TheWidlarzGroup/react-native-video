package com.brentvatne.exoplayer

import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.upstream.CmcdConfiguration
import com.brentvatne.common.api.CMCDProps
import com.brentvatne.common.toolbox.DebugLog
import com.google.common.collect.ImmutableListMultimap

class CMCDConfig(private val props: CMCDProps) {
    fun toCmcdConfigurationFactory(): CmcdConfiguration.Factory = CmcdConfiguration.Factory(::createCmcdConfiguration)

    private fun createCmcdConfiguration(mediaItem: MediaItem): CmcdConfiguration =
        CmcdConfiguration(
            java.util.UUID.randomUUID().toString(),
            mediaItem.mediaId,
            object : CmcdConfiguration.RequestConfig {
                override fun getCustomData(): ImmutableListMultimap<String, String> = buildCustomData()
            },
            intToCmcdMode(props.mode)
        )

    private fun intToCmcdMode(mode: Int): Int =
        when (mode) {
            0 -> CmcdConfiguration.MODE_REQUEST_HEADER

            1 -> CmcdConfiguration.MODE_QUERY_PARAMETER

            else -> {
                DebugLog.e("CMCDConfig", "Unsupported mode: $mode, fallback on MODE_REQUEST_HEADER")
                CmcdConfiguration.MODE_REQUEST_HEADER
            }
        }

    private fun buildCustomData(): ImmutableListMultimap<String, String> =
        ImmutableListMultimap.builder<String, String>().apply {
            addFormattedData(this, CmcdConfiguration.KEY_CMCD_OBJECT, props.cmcdObject)
            addFormattedData(this, CmcdConfiguration.KEY_CMCD_REQUEST, props.cmcdRequest)
            addFormattedData(this, CmcdConfiguration.KEY_CMCD_SESSION, props.cmcdSession)
            addFormattedData(this, CmcdConfiguration.KEY_CMCD_STATUS, props.cmcdStatus)
        }.build()

    private fun addFormattedData(builder: ImmutableListMultimap.Builder<String, String>, key: String, dataList: List<Pair<String, Any>>) {
        dataList.forEach { (dataKey, dataValue) ->
            builder.put(key, formatKeyValue(dataKey, dataValue))
        }
    }

    private fun formatKeyValue(key: String, value: Any): String =
        when (value) {
            is String -> "$key=\"$value\""
            is Number -> "$key=$value"
            else -> throw IllegalArgumentException("Unsupported value type: ${value::class.java}")
        }
}
