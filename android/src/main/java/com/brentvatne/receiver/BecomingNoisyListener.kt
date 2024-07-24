package com.brentvatne.receiver

interface BecomingNoisyListener {
    fun onAudioBecomingNoisy()

    companion object {
        val NO_OP: BecomingNoisyListener = object : BecomingNoisyListener {
            override fun onAudioBecomingNoisy() {
                // No operation
            }
        }
    }
}
