package androidx.media3.exoplayer.dash.manifest

import androidx.collection.CircularArray

class AdaptationSet {
    var type: Int = 0
    var representations: CircularArray<Representation?>? =
        null
}
