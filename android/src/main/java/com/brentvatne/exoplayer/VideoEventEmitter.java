package com.brentvatne.exoplayer;

import androidx.annotation.StringDef;
import android.view.View;

import com.brentvatne.common.Track;
import com.brentvatne.common.VideoTrack;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.emsg.EventMessage;
import com.google.android.exoplayer2.metadata.id3.Id3Frame;
import com.google.android.exoplayer2.metadata.id3.TextInformationFrame;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.io.StringWriter;
import java.io.PrintWriter;
import java.util.ArrayList;

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
    private static final String EVENT_PLAYBACK_STATE_CHANGED = "onVideoPlaybackStateChanged";
    private static final String EVENT_IDLE = "onVideoIdle";
    private static final String EVENT_TIMED_METADATA = "onTimedMetadata";
    private static final String EVENT_AUDIO_BECOMING_NOISY = "onVideoAudioBecomingNoisy";
    private static final String EVENT_AUDIO_FOCUS_CHANGE = "onAudioFocusChanged";
    private static final String EVENT_PLAYBACK_RATE_CHANGE = "onPlaybackRateChange";
    private static final String EVENT_AUDIO_TRACKS = "onAudioTracks";
    private static final String EVENT_TEXT_TRACKS = "onTextTracks";
    private static final String EVENT_VIDEO_TRACKS = "onVideoTracks";
    private static final String EVENT_ON_RECEIVE_AD_EVENT = "onReceiveAdEvent";

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
            EVENT_PLAYBACK_STATE_CHANGED,
            EVENT_IDLE,
            EVENT_TIMED_METADATA,
            EVENT_AUDIO_BECOMING_NOISY,
            EVENT_AUDIO_FOCUS_CHANGE,
            EVENT_PLAYBACK_RATE_CHANGE,
            EVENT_AUDIO_TRACKS,
            EVENT_TEXT_TRACKS,
            EVENT_VIDEO_TRACKS,
            EVENT_BANDWIDTH,
            EVENT_ON_RECEIVE_AD_EVENT
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
            EVENT_PLAYBACK_STATE_CHANGED,
            EVENT_IDLE,
            EVENT_TIMED_METADATA,
            EVENT_AUDIO_BECOMING_NOISY,
            EVENT_AUDIO_FOCUS_CHANGE,
            EVENT_PLAYBACK_RATE_CHANGE,
            EVENT_AUDIO_TRACKS,
            EVENT_TEXT_TRACKS,
            EVENT_VIDEO_TRACKS,
            EVENT_BANDWIDTH,
            EVENT_ON_RECEIVE_AD_EVENT
    })
    @interface VideoEvents {
    }

    private static final String EVENT_PROP_FAST_FORWARD = "canPlayFastForward";
    private static final String EVENT_PROP_SLOW_FORWARD = "canPlaySlowForward";
    private static final String EVENT_PROP_SLOW_REVERSE = "canPlaySlowReverse";
    private static final String EVENT_PROP_REVERSE = "canPlayReverse";
    private static final String EVENT_PROP_STEP_FORWARD = "canStepForward";
    private static final String EVENT_PROP_STEP_BACKWARD = "canStepBackward";

    private static final String EVENT_PROP_BUFFER_START = "bufferStart";
    private static final String EVENT_PROP_BUFFER_END = "bufferEnd";
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
    private static final String EVENT_PROP_AUDIO_TRACKS = "audioTracks";
    private static final String EVENT_PROP_TEXT_TRACKS = "textTracks";
    private static final String EVENT_PROP_HAS_AUDIO_FOCUS = "hasAudioFocus";
    private static final String EVENT_PROP_IS_BUFFERING = "isBuffering";
    private static final String EVENT_PROP_PLAYBACK_RATE = "playbackRate";

    private static final String EVENT_PROP_ERROR = "error";
    private static final String EVENT_PROP_ERROR_STRING = "errorString";
    private static final String EVENT_PROP_ERROR_EXCEPTION = "errorException";
    private static final String EVENT_PROP_ERROR_TRACE = "errorStackTrace";
    private static final String EVENT_PROP_ERROR_CODE = "errorCode";

    private static final String EVENT_PROP_TIMED_METADATA = "metadata";

    private static final String EVENT_PROP_BITRATE = "bitrate";

    private static final String EVENT_PROP_IS_PLAYING = "isPlaying";

    void setViewId(int viewId) {
        this.viewId = viewId;
    }

    void loadStart() {
        receiveEvent(EVENT_LOAD_START, null);
    }

    WritableMap aspectRatioToNaturalSize(int videoWidth, int videoHeight) {
        WritableMap naturalSize = Arguments.createMap();
        naturalSize.putInt(EVENT_PROP_WIDTH, videoWidth);
        naturalSize.putInt(EVENT_PROP_HEIGHT, videoHeight);
        if (videoWidth > videoHeight) {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "landscape");
        } else if (videoWidth < videoHeight) {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "portrait");
        } else {
            naturalSize.putString(EVENT_PROP_ORIENTATION, "square");
        }
        return naturalSize;
    }

    WritableArray audioTracksToArray(ArrayList<Track> audioTracks) {
        WritableArray waAudioTracks = Arguments.createArray();
        if( audioTracks != null ){
            for (int i = 0; i < audioTracks.size(); ++i) {
                Track format = audioTracks.get(i);
                WritableMap audioTrack = Arguments.createMap();
                audioTrack.putInt("index", i);
                audioTrack.putString("title", format.m_title != null ? format.m_title : "");
                audioTrack.putString("type", format.m_mimeType != null ? format.m_mimeType : "");
                audioTrack.putString("language", format.m_language != null ? format.m_language : "");
                audioTrack.putInt("bitrate", format.m_bitrate);
                audioTrack.putBoolean("selected", format.m_isSelected);
                waAudioTracks.pushMap(audioTrack);
            }
        }
        return waAudioTracks;
    }

    WritableArray videoTracksToArray(ArrayList<VideoTrack> videoTracks) {
        WritableArray waVideoTracks = Arguments.createArray();
        if( videoTracks != null ){
            for (int i = 0; i < videoTracks.size(); ++i) {
                VideoTrack vTrack = videoTracks.get(i);
                WritableMap videoTrack = Arguments.createMap();
                videoTrack.putInt("width", vTrack.m_width);
                videoTrack.putInt("height",vTrack.m_height);
                videoTrack.putInt("bitrate", vTrack.m_bitrate);
                videoTrack.putString("codecs", vTrack.m_codecs);
                videoTrack.putInt("trackId",vTrack.m_id);
                videoTrack.putBoolean("selected", vTrack.m_isSelected);
                waVideoTracks.pushMap(videoTrack);
            }
        }
        return waVideoTracks;
    }

    WritableArray textTracksToArray(ArrayList<Track> textTracks) {
        WritableArray waTextTracks = Arguments.createArray();
        if (textTracks != null) {
            for (int i = 0; i < textTracks.size(); ++i) {
                Track format = textTracks.get(i);
                WritableMap textTrack = Arguments.createMap();
                textTrack.putInt("index", i);
                textTrack.putString("title", format.m_title != null ? format.m_title : "");
                textTrack.putString("type", format.m_mimeType != null ? format.m_mimeType : "");
                textTrack.putString("language", format.m_language != null ? format.m_language : "");
                textTrack.putBoolean("selected", format.m_isSelected);
                waTextTracks.pushMap(textTrack);
            }
        }
        return waTextTracks;
    }

    public void load(double duration, double currentPosition, int videoWidth, int videoHeight,
                     ArrayList<Track> audioTracks, ArrayList<Track> textTracks, ArrayList<VideoTrack> videoTracks, String trackId){
        WritableArray waAudioTracks = audioTracksToArray(audioTracks);
        WritableArray waVideoTracks = videoTracksToArray(videoTracks);
        WritableArray waTextTracks = textTracksToArray(textTracks);

        load( duration,  currentPosition,  videoWidth,  videoHeight, waAudioTracks,  waTextTracks,  waVideoTracks, trackId);
    }


    private void load(double duration, double currentPosition, int videoWidth, int videoHeight,
              WritableArray audioTracks, WritableArray textTracks, WritableArray videoTracks, String trackId) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_DURATION, duration / 1000D);
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000D);

        WritableMap naturalSize = aspectRatioToNaturalSize(videoWidth, videoHeight);
        event.putMap(EVENT_PROP_NATURAL_SIZE, naturalSize);
        event.putString(EVENT_PROP_TRACK_ID, trackId);
        event.putArray(EVENT_PROP_VIDEO_TRACKS, videoTracks);
        event.putArray(EVENT_PROP_AUDIO_TRACKS, audioTracks);
        event.putArray(EVENT_PROP_TEXT_TRACKS, textTracks);

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



    WritableMap arrayToObject(String field, WritableArray array) {
        WritableMap event = Arguments.createMap();
        event.putArray(field, array);
        return event;
    }

    public void audioTracks(ArrayList<Track> audioTracks){
        receiveEvent(EVENT_AUDIO_TRACKS, arrayToObject(EVENT_PROP_AUDIO_TRACKS, audioTracksToArray(audioTracks)));
    }

    public void textTracks(ArrayList<Track> textTracks){
        receiveEvent(EVENT_TEXT_TRACKS, arrayToObject(EVENT_PROP_TEXT_TRACKS, textTracksToArray(textTracks)));
    }

    public void videoTracks(ArrayList<VideoTrack> videoTracks){
        receiveEvent(EVENT_VIDEO_TRACKS, arrayToObject(EVENT_PROP_VIDEO_TRACKS, videoTracksToArray(videoTracks)));
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

    void playbackStateChanged(boolean isPlaying) {
        WritableMap map = Arguments.createMap();
        map.putBoolean(EVENT_PROP_IS_PLAYING, isPlaying);
        receiveEvent(EVENT_PLAYBACK_STATE_CHANGED, map);
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
        _error(errorString, exception, "0001");
    }

    void error(String errorString, Exception exception, String errorCode) {
        _error(errorString, exception, errorCode);
    }

    void _error(String errorString, Exception exception, String errorCode) {
        // Prepare stack trace
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        exception.printStackTrace(pw);
        String stackTrace = sw.toString();

        WritableMap error = Arguments.createMap();
        error.putString(EVENT_PROP_ERROR_STRING, errorString);
        error.putString(EVENT_PROP_ERROR_EXCEPTION, exception.toString());
        error.putString(EVENT_PROP_ERROR_CODE, errorCode);
        error.putString(EVENT_PROP_ERROR_TRACE, stackTrace);
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

    void receiveAdEvent(String event) {
        WritableMap map = Arguments.createMap();
        map.putString("event", event);

        receiveEvent(EVENT_ON_RECEIVE_AD_EVENT, map);
    }

    private void receiveEvent(@VideoEvents String type, WritableMap event) {
        eventEmitter.receiveEvent(viewId, type, event);
    }
}
