package com.brentvatne.exoplayer;

import android.support.annotation.StringDef;
import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.id3.Id3Frame;
import com.google.android.exoplayer2.metadata.id3.TextInformationFrame;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

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
    private static final String EVENT_SEEK = "onVideoSeek";
    private static final String EVENT_END = "onVideoEnd";
    private static final String EVENT_STALLED = "onPlaybackStalled";
    private static final String EVENT_RESUME = "onPlaybackResume";
    private static final String EVENT_READY = "onReadyForDisplay";
    private static final String EVENT_BUFFER = "onVideoBuffer";
    private static final String EVENT_IDLE = "onVideoIdle";
    private static final String EVENT_TIMED_METADATA = "onTimedMetadata";
    private static final String EVENT_AUDIO_BECOMING_NOISY = "onAudioBecomingNoisy";
    private static final String EVENT_AUDIO_FOCUS_CHANGE = "onAudioFocusChanged";
    private static final String EVENT_PLAYBACK_RATE_CHANGE = "onPlaybackRateChange";

    static final String[] Events = {
            EVENT_LOAD_START,
            EVENT_LOAD,
            EVENT_ERROR,
            EVENT_PROGRESS,
            EVENT_SEEK,
            EVENT_END,
            EVENT_STALLED,
            EVENT_RESUME,
            EVENT_READY,
            EVENT_BUFFER,
            EVENT_IDLE,
            EVENT_TIMED_METADATA,
            EVENT_AUDIO_BECOMING_NOISY,
            EVENT_AUDIO_FOCUS_CHANGE,
            EVENT_PLAYBACK_RATE_CHANGE,
    };

    @Retention(RetentionPolicy.SOURCE)
    @StringDef({
            EVENT_LOAD_START,
            EVENT_LOAD,
            EVENT_ERROR,
            EVENT_PROGRESS,
            EVENT_SEEK,
            EVENT_END,
            EVENT_STALLED,
            EVENT_RESUME,
            EVENT_READY,
            EVENT_BUFFER,
            EVENT_IDLE,
            EVENT_TIMED_METADATA,
            EVENT_AUDIO_BECOMING_NOISY,
            EVENT_AUDIO_FOCUS_CHANGE,
            EVENT_PLAYBACK_RATE_CHANGE,
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
    private static final String EVENT_PROP_CURRENT_TIME = "currentTime";
    private static final String EVENT_PROP_SEEK_TIME = "seekTime";
    private static final String EVENT_PROP_NATURAL_SIZE = "naturalSize";
    private static final String EVENT_PROP_WIDTH = "width";
    private static final String EVENT_PROP_HEIGHT = "height";
    private static final String EVENT_PROP_ORIENTATION = "orientation";
    private static final String EVENT_PROP_HAS_AUDIO_FOCUS = "hasAudioFocus";
    private static final String EVENT_PROP_IS_BUFFERING = "isBuffering";
    private static final String EVENT_PROP_PLAYBACK_RATE = "playbackRate";

    private static final String EVENT_PROP_ERROR = "error";
    private static final String EVENT_PROP_ERROR_STRING = "errorString";
    private static final String EVENT_PROP_ERROR_EXCEPTION = "";

    private static final String EVENT_PROP_TIMED_METADATA = "metadata";


    void setViewId(int viewId) {
        this.viewId = viewId;
    }

    void loadStart() {
        receiveEvent(EVENT_LOAD_START, null);
    }

    void load(double duration, double currentPosition, int videoWidth, int videoHeight) {
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

    void progressChanged(double currentPosition, double bufferedDuration) {
        WritableMap event = Arguments.createMap();
        event.putDouble(EVENT_PROP_CURRENT_TIME, currentPosition / 1000D);
        event.putDouble(EVENT_PROP_PLAYABLE_DURATION, bufferedDuration / 1000D);
        receiveEvent(EVENT_PROGRESS, event);
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

    void error(String errorString, Exception exception) {
        WritableMap error = Arguments.createMap();
        error.putString(EVENT_PROP_ERROR_STRING, errorString);
        error.putString(EVENT_PROP_ERROR_EXCEPTION, exception.getMessage());
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


            Id3Frame frame = (Id3Frame) metadata.get(i);

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
}
