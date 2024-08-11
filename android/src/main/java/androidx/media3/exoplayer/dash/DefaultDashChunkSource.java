package androidx.media3.exoplayer.dash;

import androidx.annotation.Nullable;
import androidx.media3.common.Format;
import androidx.media3.datasource.DataSource;
import androidx.media3.datasource.TransferListener;
import androidx.media3.exoplayer.analytics.PlayerId;
import androidx.media3.exoplayer.dash.manifest.DashManifest;
import androidx.media3.exoplayer.trackselection.ExoTrackSelection;
import androidx.media3.exoplayer.upstream.CmcdConfiguration;
import androidx.media3.exoplayer.upstream.LoaderErrorThrower;

import java.util.List;

public class DefaultDashChunkSource {
    public static final class Factory implements DashChunkSource.Factory {
        public Factory(DataSource.Factory mediaDataSourceFactory) {
        }

        @Override
        public DashChunkSource createDashChunkSource(LoaderErrorThrower manifestLoaderErrorThrower, DashManifest manifest, BaseUrlExclusionList baseUrlExclusionList, int periodIndex, int[] adaptationSetIndices, ExoTrackSelection trackSelection, int trackType, long elapsedRealtimeOffsetMs, boolean enableEventMessageTrack, List<Format> closedCaptionFormats, @Nullable PlayerEmsgHandler.PlayerTrackEmsgHandler playerEmsgHandler, @Nullable TransferListener transferListener, PlayerId playerId, @Nullable CmcdConfiguration cmcdConfiguration) {
            return null;
        }
    }
}
