package com.brentvatne.common.api

import com.brentvatne.common.toolbox.DebugLog

/**
 * Define how exoplayer with load data and parsing helper
 */

class BufferingStrategy {

    /**
     * Define how exoplayer with load data
     */
    enum class BufferingStrategyEnum {
        /**
         * default exoplayer strategy
         */
        Default,

        /**
         * never load more than needed
         */
        DisableBuffering,

        /**
         * use default strategy but pause loading when available memory is low
         */
        DependingOnMemory
    }

    companion object {
        private const val TAG = "BufferingStrategy"

        /**
         * companion function to transform input string to enum
         */
        fun parse(src: String?): BufferingStrategyEnum {
            if (src == null) return BufferingStrategyEnum.Default
            return try {
                BufferingStrategyEnum.valueOf(src)
            } catch (e: Exception) {
                DebugLog.e(TAG, "cannot parse buffering strategy " + src)
                BufferingStrategyEnum.Default
            }
        }
    }
}
