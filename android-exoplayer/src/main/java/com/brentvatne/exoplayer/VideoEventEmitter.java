package com.brentvatne.exoplayer;

import static com.brentvatne.exoplayer.LocaleUtils.getLanguageDisplayName;

import android.net.Uri;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.annotation.StringDef;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.emsg.EventMessage;
import com.google.android.exoplayer2.metadata.id3.Id3Frame;
import com.google.android.exoplayer2.metadata.id3.TextInformationFrame;
import com.google.android.exoplayer2.source.dash.manifest.BaseUrl;
import com.google.android.exoplayer2.source.dash.manifest.Representation;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.List;
import java.util.Locale;

class VideoEventEmitter {

    private final RCTEventEmitter eventEmitter;

    private int viewId = View.NO_ID;

    VideoEventEmitter(ReactContext reactContext) {
        this.eventEmitter = reactContext.getJSModule(RCTEventEmitter.class);
    }

    private static final String EVENT_LOAD_START = "onVideoLoadStart";
    private static final String EVENT_LOAD = "onVideoLoad";
    private static final String EVENT_ERROR = "onVideoError";
    private static final String EVENT_PROGRESS = "onVideoProgress";
    private static final String EVENT_BANDWIDTH = "onVideoBandwidthUpdate";
    private static final String EVENT_SEEK = "onVideoSeek";
    private static final String EVENT_END = "onVideoEnd";
    private static final String EVENT_FULLSCREEN_WILL_PRESENT = "onVideoFullscreenPlayerWillPresent";
    private static final String EVENT_FULLSCREEN_DID_PRESENT = "onVideoFullscreenPlayerDidPresent";
    private static final String EVENT_FULLSCREEN_WILL_DISMISS = "onVideoFullscreenPlayerWillDismiss";
    private static final String EVENT_FULLSCREEN_DID_DISMISS = "onVideoFullscreenPlayerDidDismiss";

    private static final String EVENT_STALLED = "onPlaybackStalled";
    private static final String EVENT_RESUME = "onPlaybackResume";
    private static final String EVENT_READY = "onReadyForDisplay";
    private static final String EVENT_BUFFER = "onVideoBuffer";
    private static final String EVENT_IDLE = "onVideoIdle";
    private static final String EVENT_TIMED_METADATA = "onTimedMetadata";
    private static final String EVENT_AUDIO_BECOMING_NOISY = "onVideoAudioBecomingNoisy";
    private static final String EVENT_AUDIO_FOCUS_CHANGE = "onAudioFocusChanged";
    private static final String EVENT_PLAYBACK_RATE_CHANGE = "onPlaybackRateChange";
    private static final String EVENT_PLAYED_TRACKS_CHANGE = "onPlayedTracksChange";

    static final String[] Events = {
            EVENT_LOAD_START,
            EVENT_LOAD,
            EVENT_ERROR,
            EVENT_PROGRESS,
            EVENT_SEEK,
            EVENT_END,
            EVENT_FULLSCREEN_WILL_PRESENT,
            EVENT_FULLSCREEN_DID_PRESENT,
            EVENT_FULLSCREEN_WILL_DISMISS,
            EVENT_FULLSCREEN_DID_DISMISS,
            EVENT_STALLED,
            EVENT_RESUME,
            EVENT_READY,
            EVENT_BUFFER,
            EVENT_IDLE,
            EVENT_TIMED_METADATA,
            EVENT_AUDIO_BECOMING_NOISY,
            EVENT_AUDIO_FOCUS_CHANGE,
            EVENT_PLAYBACK_RATE_CHANGE,
            EVENT_PLAYED_TRACKS_CHANGE,
            EVENT_BANDWIDTH,
    };

    @Retention(RetentionPolicy.SOURCE)
    @StringDef({
            EVENT_LOAD_START,
            EVENT_LOAD,
            EVENT_ERROR,
            EVENT_PROGRESS,
            EVENT_SEEK,
            EVENT_END,
            EVENT_FULLSCREEN_WILL_PRESENT,
            EVENT_FULLSCREEN_DID_PRESENT,
            EVENT_FULLSCREEN_WILL_DISMISS,
            EVENT_FULLSCREEN_DID_DISMISS,
            EVENT_STALLED,
            EVENT_RESUME,
            EVENT_READY,
            EVENT_BUFFER,
            EVENT_IDLE,
            EVENT_TIMED_METADATA,
            EVENT_AUDIO_BECOMING_NOISY,
            EVENT_AUDIO_FOCUS_CHANGE,
            EVENT_PLAYBACK_RATE_CHANGE,
            EVENT_PLAYED_TRACKS_CHANGE,
            EVENT_BANDWIDTH,
    })
    @interface VideoEvents {
    }

    private static final String EVENT_PROP_FAST_FORWARD = "canPlayFastForward";
    private static final String EVENT_PROP_SLOW_FORWARD = "canPlaySlowForward";
    private static final String EVENT_PROP_SLOW_REVERSE = "canPlaySlowReverse";
    private static final String EVENT_PROP_REVERSE = "canPlayReverse";
    private static final String EVENT_PROP_STEP_FORWARD = "canStepForward";
    private static final String EVENT_PROP_STEP_BACKWARD = "canStepBackward";

    private static final String EVENT_PROP_DURATION = "duration";
    private static final String EVENT_PROP_PLAYABLE_DURATION = "playableDuration";
    private static final String EVENT_PROP_SEEKABLE_DURATION = "seekableDuration";
    private static final String EVENT_PROP_CURRENT_TIME = "currentTime";
    private static final String EVENT_PROP_CURRENT_PLAYBACK_TIME = "currentPlaybackTime";
    private static final String EVENT_PROP_SEEK_TIME = "seekTime";
    private static final String EVENT_PROP_NATURAL_SIZE = "naturalSize";
    private static final String EVENT_PROP_TRACK_ID = "trackId";
    private static final String EVENT_PROP_WIDTH = "width";
    private static final String EVENT_PROP_HEIGHT = "height";
    private static final String EVENT_PROP_ORIENTATION = "orientation";
    private static final String EVENT_PROP_VIDEO_TRACKS = "videoTracks";
    private static final String EVENT_PROP_VIDEO_TRACK = "videoTrack";
    private static final String EVENT_PROP_AUDIO_TRACKS = "audioTracks";
    private static final String EVENT_PROP_AUDIO_TRACK = "audioTrack";
    private static final String EVENT_PROP_TEXT_TRACKS = "textTracks";
    private static final String EVENT_PROP_TEXT_TRACK = "textTrack";
    private static final String EVENT_PROP_HAS_AUDIO_FOCUS = "hasAudioFocus";
    private static final String EVENT_PROP_IS_BUFFERING = "isBuffering";
    private static final String EVENT_PROP_PLAYBACK_RATE = "playbackRate";

    private static final String EVENT_PROP_ERROR = "error";
    private static final String EVENT_PROP_ERROR_STRING = "errorString";
    private static final String EVENT_PROP_ERROR_EXCEPTION = "errorException";

    private static final String EVENT_PROP_TIMED_METADATA = "metadata";

    private static final String EVENT_PROP_BITRATE = "bitrate";


    void setViewId(int viewId) {
        this.viewId = viewId;
    }

    void loadStart() {
        receiveEvent(EVENT_LOAD_START, null);
    }

    void load(
            double duration,
            double currentPosition,
            int videoWidth,
            int videoHeight,
            List<TrackInfo> audioTracks,
            List<TrackInfo> textTracks,
            List<TrackInfo> videoTracks,
            String trackId) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_DURATION, duration / 1000D);
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000D);

        WritableMap naturalSize = Arguments.createMap();
        naturalSize.putInt(EVENT_PROP_WIDTH, videoWidth);
        naturalSize.putInt(EVENT_PROP_HEIGHT, videoHeight);
        if (videoWidth > videoHeight) {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "landscape");
        } else {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "portrait");
        }
        event.putMap(EVENT_PROP_NATURAL_SIZE, naturalSize);
        event.putString(EVENT_PROP_TRACK_ID, trackId);
        WritableArray videoTrackArray = Arguments.createArray();
        for (TrackInfo track : videoTracks) {
            videoTrackArray.pushMap(createVideoTrackInfo(track));
        }
        event.putArray(EVENT_PROP_VIDEO_TRACKS, videoTrackArray);
        WritableArray audioTrackArray = Arguments.createArray();
        for (TrackInfo track : audioTracks) {
            audioTrackArray.pushMap(createAudioTrackInfo(track, null));
        }
        event.putArray(EVENT_PROP_AUDIO_TRACKS, audioTrackArray);
        WritableArray textTrackArray = Arguments.createArray();
        for (TrackInfo track : textTracks) {
            textTrackArray.pushMap(createTextTrackInfo(track));
        }
        event.putArray(EVENT_PROP_TEXT_TRACKS, textTrackArray);

        // TODO: Actually check if you can.
        event.putBoolean(EVENT_PROP_FAST_FORWARD, true);
        event.putBoolean(EVENT_PROP_SLOW_FORWARD, true);
        event.putBoolean(EVENT_PROP_SLOW_REVERSE, true);
        event.putBoolean(EVENT_PROP_REVERSE, true);
        event.putBoolean(EVENT_PROP_FAST_FORWARD, true);
        event.putBoolean(EVENT_PROP_STEP_BACKWARD, true);
        event.putBoolean(EVENT_PROP_STEP_FORWARD, true);

        receiveEvent(EVENT_LOAD, event);
    }

    void tracksChange(Object manifest, TrackInfo audioTrack, TrackInfo textTrack, TrackInfo videoTrack) {
        WritableMap event = Arguments.createMap();
        event.putMap(EVENT_PROP_AUDIO_TRACK, createAudioTrackInfo(audioTrack, manifest));
        event.putMap(EVENT_PROP_VIDEO_TRACK, createVideoTrackInfo(videoTrack));
        event.putMap(EVENT_PROP_TEXT_TRACK, createTextTrackInfo(textTrack));

        receiveEvent(EVENT_PLAYED_TRACKS_CHANGE, event);
    }

    void progressChanged(double currentPosition, double bufferedDuration, double seekableDuration, double currentPlaybackTime) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000D);
        event.putDouble(EVENT_PROP_PLAYABLE_DURATION, bufferedDuration / 1000D);
        event.putDouble(EVENT_PROP_SEEKABLE_DURATION, seekableDuration / 1000D);
        event.putDouble(EVENT_PROP_CURRENT_PLAYBACK_TIME, currentPlaybackTime);
        receiveEvent(EVENT_PROGRESS, event);
    }

    void bandwidthReport(double bitRateEstimate, int height, int width, String id) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_BITRATE, bitRateEstimate);
        event.putInt(EVENT_PROP_WIDTH, width);
        event.putInt(EVENT_PROP_HEIGHT, height);
        event.putString(EVENT_PROP_TRACK_ID, id);
        receiveEvent(EVENT_BANDWIDTH, event);
    }    

    void seek(long currentPosition, long seekTime) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000D);
        event.putDouble(EVENT_PROP_SEEK_TIME, seekTime / 1000D);
        receiveEvent(EVENT_SEEK, event);
    }

    void ready() {
        receiveEvent(EVENT_READY, null);
    }

    void buffering(boolean isBuffering) {
        WritableMap map = Arguments.createMap();
        map.putBoolean(EVENT_PROP_IS_BUFFERING, isBuffering);
        receiveEvent(EVENT_BUFFER, map);
    }

    void idle() {
        receiveEvent(EVENT_IDLE, null);
    }

    void end() {
        receiveEvent(EVENT_END, null);
    }

    void fullscreenWillPresent() {
        receiveEvent(EVENT_FULLSCREEN_WILL_PRESENT, null);
    }

    void fullscreenDidPresent() {
        receiveEvent(EVENT_FULLSCREEN_DID_PRESENT, null);
    }

    void fullscreenWillDismiss() {
        receiveEvent(EVENT_FULLSCREEN_WILL_DISMISS, null);
    }

    void fullscreenDidDismiss() {
        receiveEvent(EVENT_FULLSCREEN_DID_DISMISS, null);
    }

    void error(String errorString, Exception exception) {
        WritableMap error = Arguments.createMap();
        error.putString(EVENT_PROP_ERROR_STRING, errorString);
        error.putString(EVENT_PROP_ERROR_EXCEPTION, exception.toString());
        WritableMap event = Arguments.createMap();
        event.putMap(EVENT_PROP_ERROR, error);
        receiveEvent(EVENT_ERROR, event);
    }

    void playbackRateChange(float rate) {
        WritableMap map = Arguments.createMap();
        map.putDouble(EVENT_PROP_PLAYBACK_RATE, (double)rate);
        receiveEvent(EVENT_PLAYBACK_RATE_CHANGE, map);
    }

    void timedMetadata(Metadata metadata) {
        WritableArray metadataArray = Arguments.createArray();

        for (int i = 0; i < metadata.length(); i++) {
            
            Metadata.Entry entry = metadata.get(i);

            if (entry instanceof Id3Frame) {

                Id3Frame frame = (Id3Frame) entry;

                String value = "";

                if (frame instanceof TextInformationFrame) {
                    TextInformationFrame txxxFrame = (TextInformationFrame) frame;
                    value = txxxFrame.value;
                }

                String identifier = frame.id;

                WritableMap map = Arguments.createMap();
                map.putString("identifier", identifier);
                map.putString("value", value);

                metadataArray.pushMap(map);
                
            } else if (entry instanceof EventMessage) {
                
                EventMessage eventMessage = (EventMessage) entry;
                
                WritableMap map = Arguments.createMap();
                map.putString("identifier", eventMessage.schemeIdUri);
                map.putString("value", eventMessage.value);
                metadataArray.pushMap(map);
                
            }
        }

        WritableMap event = Arguments.createMap();
        event.putArray(EVENT_PROP_TIMED_METADATA, metadataArray);
        receiveEvent(EVENT_TIMED_METADATA, event);
    }

    void audioFocusChanged(boolean hasFocus) {
        WritableMap map = Arguments.createMap();
        map.putBoolean(EVENT_PROP_HAS_AUDIO_FOCUS, hasFocus);
        receiveEvent(EVENT_AUDIO_FOCUS_CHANGE, map);
    }

    void audioBecomingNoisy() {
        receiveEvent(EVENT_AUDIO_BECOMING_NOISY, null);
    }

    private void receiveEvent(@VideoEvents String type, WritableMap event) {
        eventEmitter.receiveEvent(viewId, type, event);
    }

    @Nullable
    private static WritableMap createAudioTrackInfo(TrackInfo track, Object manifest) {
        if (track == null) return null;
        long complexIndex = track.complexIndex;
        Format format = track.format;
        WritableMap audioTrack = Arguments.createMap();
        audioTrack.putDouble("index", complexIndex);
        audioTrack.putString("trackId", format.id != null ? format.id : "");
        audioTrack.putString("title", getLanguageDisplayName(format.language));
        audioTrack.putString("type", format.sampleMimeType);
        audioTrack.putString("language", format.language != null ? format.language : "");
        audioTrack.putString("bitrate", format.bitrate == Format.NO_VALUE ? ""
                : String.format(Locale.US, "%.2fMbps", format.bitrate / 1000000f));
        if (manifest != null) {
            Representation representation = ManifestUtils.getRepresentationOf(manifest, track);
            if (representation != null && representation.baseUrls.size() > 0) {
                BaseUrl baseUrl = representation.baseUrls.get(0);
                String file = Uri.parse(baseUrl.url).getLastPathSegment();
                audioTrack.putString("file", file);
            }
        }
        return audioTrack;
    }

    @Nullable
    private static WritableMap createVideoTrackInfo(TrackInfo track) {
        if (track == null) return null;
        long complexIndex = track.complexIndex;
        Format format = track.format;
        WritableMap videoTrack = Arguments.createMap();
        videoTrack.putDouble("index", complexIndex);
        videoTrack.putString("trackId", format.id != null ? format.id : "");
        videoTrack.putInt("width", format.width == Format.NO_VALUE ? 0 : format.width);
        videoTrack.putInt("height", format.height == Format.NO_VALUE ? 0 : format.height);
        videoTrack.putInt("bitrate", format.bitrate == Format.NO_VALUE ? 0 : format.bitrate);
        videoTrack.putString("codecs", format.codecs != null ? format.codecs : "");
        return videoTrack;
    }

    @Nullable
    private static WritableMap createTextTrackInfo(TrackInfo track) {
        if (track == null) return null;
        long complexIndex = track.complexIndex;
        Format format = track.format;
        WritableMap textTrack = Arguments.createMap();
        textTrack.putDouble("index", complexIndex);
        textTrack.putString("trackId", format.id != null ? format.id : "");
        textTrack.putString("title", getLanguageDisplayName(format.language));
        textTrack.putString("type", format.sampleMimeType);
        textTrack.putString("language", format.language != null ? format.language : "");
        return textTrack;
    }
}
