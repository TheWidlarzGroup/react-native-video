package com.brentvatne.exoplayer;

import android.content.Context;
import android.net.Uri;
import android.text.TextUtils;
import android.view.ContextThemeWrapper;

import com.brentvatne.entity.RelatedVideo;
import com.brentvatne.react.R;
import com.dice.shield.drm.entity.ActionToken;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.upstream.RawResourceDataSource;
import com.imggaming.translations.DiceLocalizedStrings;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class ReactTVExoplayerViewManager extends ViewGroupManager<ReactTVExoplayerView> {

    private static final String REACT_CLASS = "RCTVideo";

    // Source properties
    private static final String PROP_SRC = "src";
    private static final String PROP_SRC_URI = "uri";
    private static final String PROP_SRC_SUBTITLES = "subtitles";
    private static final String PROP_SRC_TYPE = "type";
    private static final String PROP_SRC_DRM = "drm";
    private static final String PROP_SRC_IMA = "ima";
    private static final String PROP_SRC_METADATA = "metadata";
    private static final String PROP_SRC_ID = "id";
    private static final String PROP_SRC_TITLE = "title";
    private static final String PROP_SRC_DESCRIPTION = "description";
    private static final String PROP_SRC_THUMBNAIL_URL = "thumbnailUrl";
    private static final String PROP_SRC_CHANNEL_LOGO_URL = "channelLogoUrl";
    private static final String PROP_SRC_CONFIG = "config";
    private static final String PROP_SRC_MUX_DATA = "muxData";
    private static final String PROP_SRC_HEADERS = "requestHeaders";

    private static final String PROP_RESIZE_MODE = "resizeMode";
    private static final String PROP_REPEAT = "repeat";
    private static final String PROP_SELECTED_AUDIO_TRACK = "selectedAudioTrack";
    private static final String PROP_SELECTED_AUDIO_TRACK_TYPE = "type";
    private static final String PROP_SELECTED_AUDIO_TRACK_VALUE = "value";
    private static final String PROP_SELECTED_TEXT_TRACK = "selectedTextTrack";
    private static final String PROP_SELECTED_TEXT_TRACK_TYPE = "type";
    private static final String PROP_SELECTED_TEXT_TRACK_VALUE = "value";
    private static final String PROP_PAUSED = "paused";
    private static final String PROP_MUTED = "muted";
    private static final String PROP_MEDIA_KEYS = "mediaKeys";
    private static final String PROP_VOLUME = "volume";
    private static final String PROP_BUFFER_CONFIG = "bufferConfig";
    private static final String PROP_BUFFER_CONFIG_MIN_BUFFER_MS = "minBufferMs";
    private static final String PROP_BUFFER_CONFIG_MAX_BUFFER_MS = "maxBufferMs";
    private static final String PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS = "bufferForPlaybackMs";
    private static final String PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = "bufferForPlaybackAfterRebufferMs";
    private static final String PROP_PROGRESS_UPDATE_INTERVAL = "progressUpdateInterval";
    private static final String PROP_SEEK = "seek";
    private static final String PROP_RATE = "rate";
    private static final String PROP_PLAY_IN_BACKGROUND = "playInBackground";
    private static final String PROP_DISABLE_FOCUS = "disableFocus";
    private static final String PROP_USE_TEXTURE_VIEW = "useTextureView";
    private static final String PROP_COLOR_PROGRESS_BAR = "colorProgressBar";
    private static final String PROP_LIVE = "live";
    private static final String PROP_EPG = "hasEpg";
    private static final String PROP_STATS = "hasStats";
    private static final String PROP_CONTROLS = "controls";
    private static final String PROP_CONTROLS_OPACITY = "controlsOpacity";
    private static final String PROP_PROGRESS_BAR_MARGIN_BOTTOM = "progressBarMarginBottom";
    private static final String PROP_STATE_OVERLAY = "stateOverlay";
    private static final String PROP_OVERLAY_AUTO_HIDE_TIMEOUT = "overlayAutoHideTimeout";
    private static final String PROP_STATE_MIDDLE_CORE_CONTROLS = "stateMiddleCoreControls";
    private static final String PROP_STATE_PROGRESS_BAR = "stateProgressBar";
    private static final String PROP_TRANSLATIONS = "translations";
    private static final String PROP_LABEL_FONT_NAME = "labelFontName";
    private static final String PROP_RELATED_VIDEOS = "relatedVideos";
    private static final String PROP_RELATED_VIDEOS_ITEMS = "items";
    private static final String PROP_RELATED_VIDEOS_HEAD_INDEX = "headIndex";
    private static final String PROP_RELATED_VIDEOS_HAS_MORE = "hasMore";
    private static final String PROP_RELATED_VIDEOS_SUBTITLE = "subtitle";
    private static final String PROP_BUTTONS = "buttons";
    private static final String PROP_WATCHLIST_BUTTON = "watchlist";
    private static final String PROP_FAVOURITE_BUTTON = "favourite";
    private static final String PROP_IS_FAVOURITE = "isFavourite";

    private static final int COMMAND_SEEK_TO_NOW = 1;
    private static final int COMMAND_SEEK_TO_TIMESTAMP = 2;
    private static final int COMMAND_SEEK_TO_POSITION = 3;

    private final ReactApplicationContext reactApplicationContext;

    public ReactTVExoplayerViewManager(ReactApplicationContext reactApplicationContext) {
        this.reactApplicationContext = reactApplicationContext;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ReactTVExoplayerView createViewInstance(ThemedReactContext themedReactContext) {

        ThemedReactContext context = new ThemedReactContext(reactApplicationContext, new ContextThemeWrapper(themedReactContext, R.style.DceTVPlayerTheme));

        return new ReactTVExoplayerView(context);
    }

    @Override
    public void onDropViewInstance(ReactTVExoplayerView view) {
        view.cleanUpResources();
    }

    @Override
    public @Nullable
    Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        MapBuilder.Builder<String, Object> builder = MapBuilder.builder();
        for (String event : VideoEventEmitter.Events) {
            builder.put(event, MapBuilder.of("registrationName", event));
        }
        return builder.build();
    }

    @Override
    public @Nullable
    Map<String, Object> getExportedViewConstants() {
        return MapBuilder.<String, Object>of(
                "ScaleNone", Integer.toString(ResizeMode.RESIZE_MODE_FIT),
                "ScaleAspectFit", Integer.toString(ResizeMode.RESIZE_MODE_FIT),
                "ScaleToFill", Integer.toString(ResizeMode.RESIZE_MODE_FILL),
                "ScaleAspectFill", Integer.toString(ResizeMode.RESIZE_MODE_CENTER_CROP)
        );
    }

    @ReactProp(name = PROP_SRC)
    public void setSrc(final ReactTVExoplayerView videoView, @Nullable ReadableMap src) {
        Context context = videoView.getContext().getApplicationContext();

        String uriString = src.hasKey(PROP_SRC_URI) ? src.getString(PROP_SRC_URI) : null;
        ReadableArray textTracks = src.hasKey(PROP_SRC_SUBTITLES) ? src.getArray(PROP_SRC_SUBTITLES) : null;
        String extension = src.hasKey(PROP_SRC_TYPE) ? src.getString(PROP_SRC_TYPE) : null;
        String drm = src.hasKey(PROP_SRC_DRM) ? src.getString(PROP_SRC_DRM) : null;
        ReadableMap ima = src.hasKey(PROP_SRC_IMA) ? src.getMap(PROP_SRC_IMA) : null;

        ReadableMap metadata = src.hasKey(PROP_SRC_METADATA) ? src.getMap(PROP_SRC_METADATA) : null;
        String id = (metadata != null && metadata.hasKey(PROP_SRC_ID)) ? metadata.getString(PROP_SRC_ID) : null;
        String title = (metadata != null && metadata.hasKey(PROP_SRC_TITLE)) ? metadata.getString(PROP_SRC_TITLE) : null;
        String description = (metadata != null && metadata.hasKey(PROP_SRC_DESCRIPTION)) ? metadata.getString(PROP_SRC_DESCRIPTION) : null;
        String type = (metadata != null && metadata.hasKey(PROP_SRC_TYPE)) ? metadata.getString(PROP_SRC_TYPE) : null;
        String thumbnailUrl = (metadata != null && metadata.hasKey(PROP_SRC_THUMBNAIL_URL)) ? metadata.getString(PROP_SRC_THUMBNAIL_URL) : null;
        String channelLogoUrl = (metadata != null && metadata.hasKey(PROP_SRC_CHANNEL_LOGO_URL)) ? metadata.getString(PROP_SRC_CHANNEL_LOGO_URL) : null;

        ReadableMap config = src.hasKey(PROP_SRC_CONFIG) ? src.getMap(PROP_SRC_CONFIG) : null;
        ReadableMap muxData = (config != null && config.hasKey(PROP_SRC_MUX_DATA)) ? config.getMap(PROP_SRC_MUX_DATA) : null;

        Map<String, String> headers = src.hasKey(PROP_SRC_HEADERS) ? toStringMap(src.getMap(PROP_SRC_HEADERS)) : null;

        if (TextUtils.isEmpty(uriString)) {
            return;
        }

        if (startsWithValidScheme(uriString)) {
            ActionToken actionToken = ActionToken.fromJson(drm);

            videoView.setSrc(uriString,
                             id,
                             extension,
                             title,
                             description,
                             type,
                             textTracks,
                             actionToken,
                             headers,
                             muxData != null ? muxData.toHashMap() : null,
                             thumbnailUrl,
                             channelLogoUrl,
                             ima != null ? ima.toHashMap() : null);
        } else {
            int identifier = context.getResources().getIdentifier(
                    uriString,
                    "drawable",
                    context.getPackageName()
            );
            if (identifier == 0) {
                identifier = context.getResources().getIdentifier(
                        uriString,
                        "raw",
                        context.getPackageName()
                );
            }
            if (identifier > 0) {
                Uri srcUri = RawResourceDataSource.buildRawResourceUri(identifier);
                if (srcUri != null) {
                    videoView.setRawSrc(srcUri, extension);
                }
            }
        }
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    public void setResizeMode(final ReactTVExoplayerView videoView, final String resizeModeOrdinalString) {
        videoView.setResizeModeModifier(convertToIntDef(resizeModeOrdinalString));
    }

    @ReactProp(name = PROP_REPEAT, defaultBoolean = false)
    public void setRepeat(final ReactTVExoplayerView videoView, final boolean repeat) {
        videoView.setRepeatModifier(repeat);
    }

    @ReactProp(name = PROP_SELECTED_AUDIO_TRACK)
    public void setSelectedAudioTrack(final ReactTVExoplayerView videoView,
                                      @Nullable ReadableMap selectedAudioTrack) {
        String typeString = null;
        Dynamic value = null;
        if (selectedAudioTrack != null) {
            typeString = selectedAudioTrack.hasKey(PROP_SELECTED_AUDIO_TRACK_TYPE)
                         ? selectedAudioTrack.getString(PROP_SELECTED_AUDIO_TRACK_TYPE) : null;
            value = selectedAudioTrack.hasKey(PROP_SELECTED_AUDIO_TRACK_VALUE)
                    ? selectedAudioTrack.getDynamic(PROP_SELECTED_AUDIO_TRACK_VALUE) : null;
        }
        videoView.setSelectedAudioTrack(typeString, value);
    }

    @ReactProp(name = PROP_SELECTED_TEXT_TRACK)
    public void setSelectedTextTrack(final ReactTVExoplayerView videoView,
                                     @Nullable ReadableMap selectedTextTrack) {
        String typeString = null;
        Dynamic value = null;
        if (selectedTextTrack != null) {
            typeString = selectedTextTrack.hasKey(PROP_SELECTED_TEXT_TRACK_TYPE)
                         ? selectedTextTrack.getString(PROP_SELECTED_TEXT_TRACK_TYPE) : null;
            value = selectedTextTrack.hasKey(PROP_SELECTED_TEXT_TRACK_VALUE)
                    ? selectedTextTrack.getDynamic(PROP_SELECTED_TEXT_TRACK_VALUE) : null;
        }
        videoView.setSelectedTextTrack(typeString, value);
    }

    @ReactProp(name = PROP_PAUSED, defaultBoolean = false)
    public void setPaused(final ReactTVExoplayerView videoView, final boolean paused) {
        videoView.setPausedModifier(paused);
    }

    @ReactProp(name = PROP_MUTED, defaultBoolean = false)
    public void setMuted(final ReactTVExoplayerView videoView, final boolean muted) {
        videoView.setMutedModifier(muted);
    }

    @ReactProp(name = PROP_MEDIA_KEYS, defaultBoolean = true)
    public void setMediaKeys(final ReactTVExoplayerView videoView, final boolean visible) {
        videoView.setMediaKeysListener(visible);
    }

    @ReactProp(name = PROP_VOLUME, defaultFloat = 1.0f)
    public void setVolume(final ReactTVExoplayerView videoView, final float volume) {
        videoView.setVolumeModifier(volume);
    }

    @ReactProp(name = PROP_PROGRESS_UPDATE_INTERVAL, defaultFloat = 250.0f)
    public void setProgressUpdateInterval(final ReactTVExoplayerView videoView, final float progressUpdateInterval) {
        videoView.setProgressUpdateInterval(progressUpdateInterval);
    }

    @ReactProp(name = PROP_SEEK)
    public void setSeek(final ReactTVExoplayerView videoView, final float seek) {
        videoView.setShouldSeekTo(Math.round(seek * 1000f));
    }

    @ReactProp(name = PROP_RATE)
    public void setRate(final ReactTVExoplayerView videoView, final float rate) {
        videoView.setRateModifier(rate);
    }

    @ReactProp(name = PROP_PLAY_IN_BACKGROUND, defaultBoolean = false)
    public void setPlayInBackground(final ReactTVExoplayerView videoView, final boolean playInBackground) {
        videoView.setPlayInBackground(playInBackground);
    }

    @ReactProp(name = PROP_DISABLE_FOCUS, defaultBoolean = false)
    public void setDisableFocus(final ReactTVExoplayerView videoView, final boolean disableFocus) {
        videoView.setDisableFocus(disableFocus);
    }

    @ReactProp(name = PROP_COLOR_PROGRESS_BAR)
    public void setColorProgressBar(final ReactTVExoplayerView videoView, final String color) {
        videoView.setColorProgressBar(color);
    }

    @ReactProp(name = PROP_LABEL_FONT_NAME)
    public void setLabelFont(final ReactTVExoplayerView videoView, final String fontName) {
        videoView.setLabelFont(fontName);
    }

    @ReactProp(name = PROP_LIVE, defaultBoolean = false)
    public void setLive(final ReactTVExoplayerView videoView, final boolean live) {
        videoView.setLive(live);
    }

    @ReactProp(name = PROP_EPG, defaultBoolean = false)
    public void setEpg(final ReactTVExoplayerView videoView, final boolean hasEpg) {
        videoView.setEpg(hasEpg);
    }

    @ReactProp(name = PROP_STATS, defaultBoolean = false)
    public void setStats(final ReactTVExoplayerView videoView, final boolean hasStats) {
        videoView.setStats(hasStats);
    }

    @ReactProp(name = PROP_CONTROLS)
    public void setControls(final ReactTVExoplayerView videoView, final boolean visible) {
        videoView.setControls(visible);
    }

    @ReactProp(name = PROP_CONTROLS_OPACITY)
    public void setControlsOpacity(final ReactTVExoplayerView videoView, final float opacity) {
        videoView.setControlsOpacity(opacity);
    }

    @ReactProp(name = PROP_USE_TEXTURE_VIEW, defaultBoolean = false)
    public void setUseTextureView(final ReactTVExoplayerView videoView, final boolean useTextureView) {
        videoView.setUseTextureView(useTextureView);
    }

    @ReactProp(name = PROP_BUFFER_CONFIG)
    public void setBufferConfig(final ReactTVExoplayerView videoView, @Nullable ReadableMap bufferConfig) {
        int minBufferMs = DefaultLoadControl.DEFAULT_MIN_BUFFER_MS;
        int maxBufferMs = DefaultLoadControl.DEFAULT_MAX_BUFFER_MS;
        int bufferForPlaybackMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS;
        int bufferForPlaybackAfterRebufferMs = DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS;
        if (bufferConfig != null) {
            minBufferMs = bufferConfig.hasKey(PROP_BUFFER_CONFIG_MIN_BUFFER_MS)
                          ? bufferConfig.getInt(PROP_BUFFER_CONFIG_MIN_BUFFER_MS) : minBufferMs;
            maxBufferMs = bufferConfig.hasKey(PROP_BUFFER_CONFIG_MAX_BUFFER_MS)
                          ? bufferConfig.getInt(PROP_BUFFER_CONFIG_MAX_BUFFER_MS) : maxBufferMs;
            bufferForPlaybackMs = bufferConfig.hasKey(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS)
                                  ? bufferConfig.getInt(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_MS) : bufferForPlaybackMs;
            bufferForPlaybackAfterRebufferMs = bufferConfig.hasKey(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS)
                                               ? bufferConfig.getInt(PROP_BUFFER_CONFIG_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS) : bufferForPlaybackAfterRebufferMs;
            videoView.setBufferConfig(minBufferMs, maxBufferMs, bufferForPlaybackMs, bufferForPlaybackAfterRebufferMs);
        }
    }

    @ReactProp(name = PROP_PROGRESS_BAR_MARGIN_BOTTOM, defaultInt = 0)
    public void setProgressBarMarginBottom(final ReactTVExoplayerView videoView, final int margin) {
        videoView.setProgressBarMarginBottom(margin);
    }

    @ReactProp(name = PROP_STATE_OVERLAY)
    public void setStateOverlay(final ReactTVExoplayerView videoView, final String state) {
        videoView.setStateOverlay(state);
    }

    @ReactProp(name = PROP_OVERLAY_AUTO_HIDE_TIMEOUT)
    public void setOverlayAutoHideTimeout(final ReactTVExoplayerView videoView, final Integer hideTimeout) {
        if (hideTimeout != null) {
            videoView.setOverlayAutoHideTimeout(Long.valueOf(hideTimeout));
        } else {
            videoView.setOverlayAutoHideTimeout(null);
        }
    }

    @ReactProp(name = PROP_STATE_MIDDLE_CORE_CONTROLS)
    public void setStateMiddleCoreControls(final ReactTVExoplayerView videoView, final String state) {
        videoView.setStateMiddleCoreControls(state);
    }

    @ReactProp(name = PROP_STATE_PROGRESS_BAR)
    public void setStateProgressBar(final ReactTVExoplayerView videoView, final String state) {
        videoView.setStateProgressBar(state);
    }

    @ReactProp(name = PROP_TRANSLATIONS)
    public void setTranslations(final ReactTVExoplayerView videoView, @Nullable ReadableMap translations) {
        DiceLocalizedStrings.getInstance().updateTranslations(toStringMap(translations));
        videoView.applyTranslations(translations != null ? translations.toHashMap() : null);
    }

    @ReactProp(name = PROP_RELATED_VIDEOS)
    public void setRelatedVideos(final ReactTVExoplayerView videoView, @Nullable ReadableMap relatedVideosMap) {
        List<RelatedVideo> relatedVideos = new ArrayList<>();
        int headIndex = -1;
        boolean hasMore = false;

        if (relatedVideosMap != null) {
            ReadableArray relatedVideosArray = relatedVideosMap.getArray(PROP_RELATED_VIDEOS_ITEMS);
            for (int i = 0; i < relatedVideosArray.size(); i++) {
                ReadableMap relatedVideo = relatedVideosArray.getMap(i);

                String title = relatedVideo.hasKey(PROP_SRC_TITLE) ? relatedVideo.getString(PROP_SRC_TITLE) : null;
                String subtitle = relatedVideo.hasKey(PROP_RELATED_VIDEOS_SUBTITLE) ? relatedVideo.getString(PROP_RELATED_VIDEOS_SUBTITLE) : null;
                String thumbnailUrl = relatedVideo.hasKey(PROP_SRC_THUMBNAIL_URL) ? relatedVideo.getString(PROP_SRC_THUMBNAIL_URL) : null;

                relatedVideos.add(new RelatedVideo(title,
                                                   subtitle,
                                                   thumbnailUrl,
                                                   relatedVideo.toHashMap()));
            }
            headIndex = relatedVideosMap.hasKey(PROP_RELATED_VIDEOS_HEAD_INDEX) ? relatedVideosMap.getInt(PROP_RELATED_VIDEOS_HEAD_INDEX) : -1;
            hasMore = relatedVideosMap.hasKey(PROP_RELATED_VIDEOS_HAS_MORE) && relatedVideosMap.getBoolean(PROP_RELATED_VIDEOS_HAS_MORE);
        }

        videoView.setRelatedVideos(relatedVideos, headIndex, hasMore);
    }

    @ReactProp(name = PROP_BUTTONS)
    public void setButtons(final ReactTVExoplayerView videoView, @Nullable ReadableMap buttons) {
        boolean showFavouriteButton = (buttons != null && buttons.hasKey(PROP_FAVOURITE_BUTTON)) && buttons.getBoolean(PROP_FAVOURITE_BUTTON);
        boolean showWatchlistButton = (buttons != null && buttons.hasKey(PROP_WATCHLIST_BUTTON)) && buttons.getBoolean(PROP_WATCHLIST_BUTTON);
        videoView.setButtons(showFavouriteButton, showWatchlistButton);
    }

    @ReactProp(name = PROP_IS_FAVOURITE)
    public void setIsFavourite(final ReactTVExoplayerView videoView, final boolean isFavourite) {
        videoView.setIsFavourite(isFavourite);
    }

    private boolean startsWithValidScheme(String uriString) {
        if (uriString == null) {
            return false;
        }

        return uriString.startsWith("http://")
                || uriString.startsWith("https://")
                || uriString.startsWith("content://")
                || uriString.startsWith("file://")
                || uriString.startsWith("asset://");
    }

    private @ResizeMode.Mode
    int convertToIntDef(String resizeModeOrdinalString) {
        if (!TextUtils.isEmpty(resizeModeOrdinalString)) {
            int resizeModeOrdinal = Integer.parseInt(resizeModeOrdinalString);
            return ResizeMode.toResizeMode(resizeModeOrdinal);
        }
        return ResizeMode.RESIZE_MODE_FIT;
    }

    /**
     * toStringMap converts a {@link ReadableMap} into a HashMap.
     *
     * @param readableMap The ReadableMap to be conveted.
     * @return A HashMap containing the data that was in the ReadableMap.
     * @see 'Adapted from https://github.com/artemyarulin/react-native-eval/blob/master/android/src/main/java/com/evaluator/react/ConversionUtil.java'
     */
    public static Map<String, String> toStringMap(@Nullable ReadableMap readableMap) {
        if (readableMap == null)
            return null;

        com.facebook.react.bridge.ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
        if (!iterator.hasNextKey())
            return null;

        Map<String, String> result = new HashMap<>();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            result.put(key, readableMap.getString(key));
        }

        return result;
    }

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
                "seekToNow",
                COMMAND_SEEK_TO_NOW,
                "seekToTimestamp",
                COMMAND_SEEK_TO_TIMESTAMP,
                "seekToPosition",
                COMMAND_SEEK_TO_POSITION
        );
    }

    @Override
    public void receiveCommand(final ReactTVExoplayerView root, int commandId, @Nullable ReadableArray args) {
        // This will be called whenever a command is sent from react-native.
        switch (commandId) {
            case COMMAND_SEEK_TO_NOW:
                root.seekTo(C.TIME_UNSET);
                break;
            case COMMAND_SEEK_TO_TIMESTAMP:
                root.seekTo(args.getString(0));
                break;
            case COMMAND_SEEK_TO_POSITION:
                root.seekTo(args.getInt(0));
                break;
        }
    }
}
