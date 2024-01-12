package com.brentvatne.exoplayer;

import androidx.annotation.StringDef;
import androidx.media3.common.Metadata;

import android.view.View;

import com.brentvatne.common.api.TimedMetadata;
import com.brentvatne.common.api.Track;
import com.brentvatne.common.api.VideoTrack;
import com.brentvatne.exoplayer.events.OnAudioFocusChangedEvent;
import com.brentvatne.exoplayer.events.OnAudioTracksEvent;
import com.brentvatne.exoplayer.events.OnPlaybackRateChangeEvent;
import com.brentvatne.exoplayer.events.OnReadyForDisplayEvent;
import com.brentvatne.exoplayer.events.OnReceiveAdEventEvent;
import com.brentvatne.exoplayer.events.OnTextTracksEvent;
import com.brentvatne.exoplayer.events.OnTimedMetadataEvent;
import com.brentvatne.exoplayer.events.OnVideoAudioBecomingNoisyEvent;
import com.brentvatne.exoplayer.events.OnVideoBandwidthUpdateEvent;
import com.brentvatne.exoplayer.events.OnVideoBufferEvent;
import com.brentvatne.exoplayer.events.OnVideoEndEvent;
import com.brentvatne.exoplayer.events.OnVideoErrorEvent;
import com.brentvatne.exoplayer.events.OnVideoFullscreenPlayerDidDismissEvent;
import com.brentvatne.exoplayer.events.OnVideoFullscreenPlayerDidPresentEvent;
import com.brentvatne.exoplayer.events.OnVideoFullscreenPlayerWillDismissEvent;
import com.brentvatne.exoplayer.events.OnVideoFullscreenPlayerWillPresentEvent;
import com.brentvatne.exoplayer.events.OnVideoIdleEvent;
import com.brentvatne.exoplayer.events.OnVideoLoadEvent;
import com.brentvatne.exoplayer.events.OnVideoLoadStartEvent;
import com.brentvatne.exoplayer.events.OnVideoPlaybackStateChangedEvent;
import com.brentvatne.exoplayer.events.OnVideoProgressEvent;
import com.brentvatne.exoplayer.events.OnVideoSeekEvent;
import com.brentvatne.exoplayer.events.OnVideoTracksEvent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.ArrayList;

class VideoEventEmitter {

    private final RCTEventEmitter eventEmitter;

    private int viewId = View.NO_ID;
    private ReactContext context = null;

    VideoEventEmitter(ReactContext reactContext) {
        this.eventEmitter = reactContext.getJSModule(RCTEventEmitter.class);
        this.context = reactContext;
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

    void setViewId(int viewId) {
        this.viewId = viewId;
    }

    void loadStart() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoLoadStartEvent(viewId));
    }

    WritableArray audioTracksToArray(ArrayList<Track> audioTracks) {
        WritableArray waAudioTracks = Arguments.createArray();
        if( audioTracks != null ){
            for (int i = 0; i < audioTracks.size(); ++i) {
                Track format = audioTracks.get(i);
                WritableMap audioTrack = Arguments.createMap();
                audioTrack.putInt("index", i);
                audioTrack.putString("title", format.getTitle() != null ? format.getTitle() : "");
                audioTrack.putString("type", format.getMimeType() != null ? format.getMimeType() : "");
                audioTrack.putString("language", format.getLanguage() != null ? format.getLanguage() : "");
                audioTrack.putInt("bitrate", format.getBitrate());
                audioTrack.putBoolean("selected", format.isSelected());
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
                videoTrack.putInt("width", vTrack.getWidth());
                videoTrack.putInt("height",vTrack.getHeight());
                videoTrack.putInt("bitrate", vTrack.getBitrate());
                videoTrack.putString("codecs", vTrack.getCodecs());
                videoTrack.putInt("trackId",vTrack.getId());
                videoTrack.putBoolean("selected", vTrack.isSelected());
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
                textTrack.putString("title", format.getTitle() != null ? format.getTitle() : "");
                textTrack.putString("type", format.getMimeType() != null ? format.getMimeType() : "");
                textTrack.putString("language", format.getLanguage() != null ? format.getLanguage() : "");
                textTrack.putBoolean("selected", format.isSelected());
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

        load(duration,  currentPosition,  videoWidth,  videoHeight, waAudioTracks,  waTextTracks,  waVideoTracks, trackId);
    }


    private void load(double duration, double currentPosition, int videoWidth, int videoHeight,
              WritableArray audioTracks, WritableArray textTracks, WritableArray videoTracks, String trackId) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoLoadEvent(viewId, duration, currentPosition, videoWidth, videoHeight, audioTracks, textTracks, videoTracks, trackId));
    }

    WritableMap arrayToObject(String field, WritableArray array) {
        WritableMap event = Arguments.createMap();
        event.putArray(field, array);
        return event;
    }

    public void audioTracks(ArrayList<Track> audioTracks){
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnAudioTracksEvent(viewId, audioTracks));
    }

    public void textTracks(ArrayList<Track> textTracks){
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnTextTracksEvent(viewId, textTracks));
    }

    public void videoTracks(ArrayList<VideoTrack> videoTracks){
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoTracksEvent(viewId, videoTracks));
    }

    void progressChanged(double currentPosition, double bufferedDuration, double seekableDuration, double currentPlaybackTime) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoProgressEvent(viewId, currentPosition, bufferedDuration, seekableDuration, currentPlaybackTime));
    }

    void bandwidthReport(double bitRateEstimate, int height, int width, String id) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoBandwidthUpdateEvent(viewId, bitRateEstimate, height, width, id));
    }    

    void seek(long currentPosition, long seekTime, boolean finished) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoSeekEvent(viewId, currentPosition, seekTime, finished));
    }

    void ready() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnReadyForDisplayEvent(viewId));
    }

    void buffering(boolean isBuffering) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoBufferEvent(viewId, isBuffering));
    }

    void playbackStateChanged(boolean isPlaying) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoPlaybackStateChangedEvent(viewId, isPlaying));
    }

    void idle() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoIdleEvent(viewId));
    }

    void end() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoEndEvent(viewId));
    }

    void fullscreenWillPresent() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoFullscreenPlayerWillPresentEvent(viewId));
    }

    void fullscreenDidPresent() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoFullscreenPlayerDidPresentEvent(viewId));
    }

    void fullscreenWillDismiss() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoFullscreenPlayerWillDismissEvent(viewId));
    }

    void fullscreenDidDismiss() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoFullscreenPlayerDidDismissEvent(viewId));
    }

    void error(String errorString, Exception exception) {
        _error(errorString, exception, "0001");
    }

    void error(String errorString, Exception exception, String errorCode) {
        _error(errorString, exception, errorCode);
    }

    void _error(String errorString, Exception exception, String errorCode) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoErrorEvent(viewId, errorString, exception, errorCode));
    }

    void playbackRateChange(float rate) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnPlaybackRateChangeEvent(viewId, rate));
    }

    void timedMetadata(ArrayList<TimedMetadata> metadata) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnTimedMetadataEvent(viewId, metadata));
    }

    void audioFocusChanged(boolean hasFocus) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnAudioFocusChangedEvent(viewId, hasFocus));
    }

    void audioBecomingNoisy() {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnVideoAudioBecomingNoisyEvent(viewId));
    }

    void receiveAdEvent(String event) {
        EventDispatcher eventDispatcher =
                UIManagerHelper.getEventDispatcherForReactTag(this.context, viewId);
        eventDispatcher.dispatchEvent(new OnReceiveAdEventEvent(viewId, event));
    }
}
