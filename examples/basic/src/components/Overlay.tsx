import React, {forwardRef, memo, useCallback} from 'react';
import {Indicator} from './Indicator.tsx';
import {View} from 'react-native';
import styles from '../styles.tsx';
import ToggleControl from '../ToggleControl.tsx';
import {
  isAndroid,
  isIos,
  samplePoster,
  textTracksSelectionBy,
} from '../constants';
import MultiValueControl, {
  MultiValueControlPropType,
} from '../MultiValueControl.tsx';
import {
  AudioTrack,
  EnumValues,
  ResizeMode,
  SelectedTrack,
  SelectedTrackType,
  SelectedVideoTrack,
  SelectedVideoTrackType,
  TextTrack,
  VideoDecoderProperties,
  VideoRef,
  VideoTrack,
} from 'react-native-video';
import {
  toast,
  Seeker,
  AudioTrackSelector,
  TextTrackSelector,
  VideoTrackSelector,
  TopControl,
} from '../components';

type Props = {
  channelDown: () => void;
  channelUp: () => void;
  fullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  controls: boolean;
  setControls: (value: boolean) => void;
  decoration: boolean;
  setDecoration: (value: boolean) => void;
  showNotificationControls: boolean;
  setShowNotificationControls: (value: boolean) => void;
  selectedAudioTrack: SelectedTrack | undefined;
  setSelectedAudioTrack: (value: SelectedTrack | undefined) => void;
  selectedTextTrack: SelectedTrack | undefined;
  setSelectedTextTrack: (value: SelectedTrack | undefined) => void;
  selectedVideoTrack: SelectedVideoTrack;
  setSelectedVideoTrack: (value: SelectedVideoTrack) => void;
  setIsSeeking: (value: boolean) => void;
  rate: number;
  setRate: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  resizeMode: EnumValues<ResizeMode>;
  setResizeMode: (value: EnumValues<ResizeMode>) => void;
  isLoading: boolean;
  srcListId: number;
  useCache: boolean;
  setUseCache: (value: boolean) => void;
  paused: boolean;
  setPaused: (value: boolean) => void;
  repeat: boolean;
  setRepeat: (value: boolean) => void;
  poster: string | undefined;
  setPoster: (value: string | undefined) => void;
  muted: boolean;
  setMuted: (value: boolean) => void;
  currentTime: number;
  duration: number;
  isSeeking: boolean;
  audioTracks: AudioTrack[];
  textTracks: TextTrack[];
  videoTracks: VideoTrack[];
};

const _Overlay = forwardRef<VideoRef, Props>((props, ref) => {
  const {
    channelUp,
    channelDown,
    setFullscreen,
    fullscreen,
    setControls,
    controls,
    setDecoration,
    decoration,
    setShowNotificationControls,
    showNotificationControls,
    setSelectedAudioTrack,
    setSelectedTextTrack,
    setSelectedVideoTrack,
    setIsSeeking,
    rate,
    setRate,
    volume,
    setVolume,
    resizeMode,
    setResizeMode,
    isLoading,
    srcListId,
    setUseCache,
    useCache,
    paused,
    setPaused,
    setRepeat,
    repeat,
    setPoster,
    poster,
    setMuted,
    muted,
    duration,
    isSeeking,
    currentTime,
    textTracks,
    videoTracks,
    audioTracks,
    selectedAudioTrack,
    selectedVideoTrack,
    selectedTextTrack,
  } = props;
  const popupInfo = useCallback(() => {
    VideoDecoderProperties.getWidevineLevel().then((widevineLevel: number) => {
      VideoDecoderProperties.isHEVCSupported().then((hevc: string) => {
        VideoDecoderProperties.isCodecSupported('video/avc', 1920, 1080).then(
          (avc: string) => {
            toast(
              true,
              'Widevine level: ' +
                widevineLevel +
                '\n hevc: ' +
                hevc +
                '\n avc: ' +
                avc,
            );
          },
        );
      });
    });
  }, []);

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  const toggleControls = () => {
    setControls(!controls);
  };

  const toggleDecoration = () => {
    setDecoration(!decoration);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    ref.current?.setFullScreen(!decoration);
  };

  const toggleShowNotificationControls = () => {
    setShowNotificationControls(!showNotificationControls);
  };

  const onSelectedAudioTrackChange = (itemValue: string) => {
    console.log('on audio value change ' + itemValue);
    if (itemValue === 'none') {
      setSelectedAudioTrack({
        type: SelectedTrackType.DISABLED,
      });
    } else {
      setSelectedAudioTrack({
        type: SelectedTrackType.INDEX,
        value: itemValue,
      });
    }
  };

  const onSelectedTextTrackChange = (itemValue: string) => {
    console.log('on value change ' + itemValue);
    const type =
      textTracksSelectionBy === 'index'
        ? SelectedTrackType.INDEX
        : SelectedTrackType.LANGUAGE;
    setSelectedTextTrack({type, value: itemValue});
  };

  const onSelectedVideoTrackChange = (itemValue: string) => {
    console.log('on value change ' + itemValue);
    if (itemValue === undefined || itemValue === 'auto') {
      setSelectedVideoTrack({
        type: SelectedVideoTrackType.AUTO,
      });
    } else {
      setSelectedVideoTrack({
        type: SelectedVideoTrackType.INDEX,
        value: itemValue,
      });
    }
  };

  const videoSeek = (position: number) => {
    setIsSeeking(true);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    ref.current?.seek(position);
  };

  const onRateSelected = (value: MultiValueControlPropType) => {
    if (typeof value === 'number') {
      setRate(value);
    }
  };

  const onVolumeSelected = (value: MultiValueControlPropType) => {
    if (typeof value === 'number') {
      setVolume(value);
    }
  };

  const onResizeModeSelected = (value: MultiValueControlPropType) => {
    if (typeof value === 'string') {
      setResizeMode(value as EnumValues<ResizeMode>);
    }
  };

  const toggleCache = () => setUseCache(!useCache);

  const togglePause = () => setPaused(!paused);

  const toggleRepeat = () => setRepeat(!repeat);

  const togglePoster = () => setPoster(poster ? undefined : samplePoster);

  const toggleMuted = () => setMuted(!muted);

  return (
    <>
      <Indicator isLoading={isLoading} />
      <View style={styles.topControls}>
        <View style={styles.resizeModeControl}>
          <TopControl
            srcListId={srcListId}
            showRNVControls={controls}
            toggleControls={toggleControls}
          />
        </View>
      </View>
      {!controls ? (
        <>
          <View style={styles.leftControls}>
            <ToggleControl onPress={channelDown} text="ChDown" />
          </View>
          <View style={styles.rightControls}>
            <ToggleControl onPress={channelUp} text="ChUp" />
          </View>
          <View style={styles.bottomControls}>
            <View style={styles.generalControls}>
              {isAndroid ? (
                <View style={styles.generalControls}>
                  <ToggleControl onPress={popupInfo} text="decoderInfo" />
                  <ToggleControl
                    isSelected={useCache}
                    onPress={toggleCache}
                    selectedText="enable cache"
                    unselectedText="disable cache"
                  />
                </View>
              ) : null}
              <ToggleControl
                isSelected={paused}
                onPress={togglePause}
                selectedText="pause"
                unselectedText="playing"
              />
              <ToggleControl
                isSelected={repeat}
                onPress={toggleRepeat}
                selectedText="loop enable"
                unselectedText="loop disable"
              />
              <ToggleControl onPress={toggleFullscreen} text="fullscreen" />
              <ToggleControl onPress={toggleDecoration} text="decoration" />
              <ToggleControl
                isSelected={!!poster}
                onPress={togglePoster}
                selectedText="poster"
                unselectedText="no poster"
              />
              <ToggleControl
                isSelected={showNotificationControls}
                onPress={toggleShowNotificationControls}
                selectedText="hide notification controls"
                unselectedText="show notification controls"
              />
            </View>
            <View style={styles.generalControls}>
              {/* shall be replaced by slider */}
              <MultiValueControl
                values={[0, 0.25, 0.5, 1.0, 1.5, 2.0]}
                onPress={onRateSelected}
                selected={rate}
              />
              {/* shall be replaced by slider */}
              <MultiValueControl
                values={[0.5, 1, 1.5]}
                onPress={onVolumeSelected}
                selected={volume}
              />
              <MultiValueControl
                values={[
                  ResizeMode.COVER,
                  ResizeMode.CONTAIN,
                  ResizeMode.STRETCH,
                ]}
                onPress={onResizeModeSelected}
                selected={resizeMode}
              />
              <ToggleControl
                isSelected={muted}
                onPress={toggleMuted}
                text="muted"
              />
              {isIos ? (
                <ToggleControl
                  isSelected={paused}
                  onPress={() => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    ref.current
                      ?.save({})
                      ?.then((response: unknown) => {
                        console.log('Downloaded URI', response);
                      })
                      .catch((error: unknown) => {
                        console.log('error during save ', error);
                      });
                  }}
                  text="save"
                />
              ) : null}
            </View>
            <Seeker
              currentTime={currentTime}
              duration={duration}
              isLoading={isLoading}
              videoSeek={prop => videoSeek(prop)}
              isUISeeking={isSeeking}
            />
            <View style={styles.generalControls}>
              <AudioTrackSelector
                audioTracks={audioTracks}
                selectedAudioTrack={selectedAudioTrack}
                onValueChange={onSelectedAudioTrackChange}
              />
              <TextTrackSelector
                textTracks={textTracks}
                selectedTextTrack={selectedTextTrack}
                onValueChange={onSelectedTextTrackChange}
                textTracksSelectionBy={textTracksSelectionBy}
              />
              <VideoTrackSelector
                videoTracks={videoTracks}
                selectedVideoTrack={selectedVideoTrack}
                onValueChange={onSelectedVideoTrackChange}
              />
            </View>
          </View>
        </>
      ) : null}
    </>
  );
});

export const Overlay = memo(_Overlay);
