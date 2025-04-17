package androidx.media3.exoplayer.dash.manifest

class DashManifest {
    val periodCount: Int
        get() = 0

    fun getPeriod(index: Int): Period? {
        return null
    }
}
