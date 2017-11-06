package com.brentvatne.exoplayer;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.source.TrackGroup;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.MappingTrackSelector;

public class TrackHelper {

    private static final String TAG = TrackHelper.class.getSimpleName();

    private MappingTrackSelector trackSelector;

    public TrackHelper(MappingTrackSelector trackSelector) {
        this.trackSelector = trackSelector;
    }

    public WritableArray parseTracks() {
        WritableArray trackData = Arguments.createArray();
        MappingTrackSelector.MappedTrackInfo trackInfo = trackSelector.getCurrentMappedTrackInfo();

        for (int rendererIndex = 0; rendererIndex < trackInfo.length; rendererIndex++) {
            WritableArray rendererArray = Arguments.createArray();
            TrackGroupArray trackGroupArray = trackInfo.getTrackGroups(rendererIndex);

            for (int trackGroupIndex = 0; trackGroupIndex < trackGroupArray.length; trackGroupIndex++) {
                WritableArray formats = Arguments.createArray();
                TrackGroup trackGroup = trackGroupArray.get(trackGroupIndex);

                for (int formatIndex = 0; formatIndex < trackGroup.length; formatIndex++) {
                    Format format = trackGroup.getFormat(formatIndex);
                    WritableMap formatMap = mapFormatData(format);

                    formats.pushMap(formatMap);
                }

                rendererArray.pushArray(formats);
            }

            trackData.pushArray(rendererArray);
        }

        return trackData;
    }

    private WritableMap mapFormatData(Format format) {
        WritableMap formatMap = Arguments.createMap();
        formatMap.putString("id", format.id);
        formatMap.putString("sampleMimeType", format.sampleMimeType);
        formatMap.putString("language", format.language);
        return formatMap;
    }

}
