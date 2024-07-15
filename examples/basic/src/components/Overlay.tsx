import React, {
  forwardRef,
  memo,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
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
  type MultiValueControlPropType,
} from '../MultiValueControl.tsx';
import {
  ResizeMode,
  VideoRef,
  SelectedTrackType,
  SelectedVideoTrackType,
  VideoDecoderProperties,
  type EnumValues,
  type TextTrack,
  type SelectedVideoTrack,
  type SelectedTrack,
  type VideoTrack,
  type AudioTrack,
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
  setFullscreen: Dispatch<SetStateAction<boolean>>;
  controls: boolean;
  setControls: Dispatch<SetStateAction<boolean>>;
  showNotificationControls: boolean;
  setShowNotificationControls: Dispatch<SetStateAction<boolean>>;
  selectedAudioTrack: SelectedTrack | undefined;
  setSelectedAudioTrack: Dispatch<SetStateAction<SelectedTrack | undefined>>;
  selectedTextTrack: SelectedTrack | undefined;
  setSelectedTextTrack: (value: SelectedTrack | undefined) => void;
  selectedVideoTrack: SelectedVideoTrack;
  setSelectedVideoTrack: (value: SelectedVideoTrack) => void;
  setIsSeeking: Dispatch<SetStateAction<boolean>>;
  rate: number;
  setRate: Dispatch<SetStateAction<number>>;
  volume: number;
  setVolume: (value: number) => void;
  resizeMode: EnumValues<ResizeMode>;
  setResizeMode: Dispatch<SetStateAction<EnumValues<ResizeMode>>>;
  isLoading: boolean;
  srcListId: number;
  useCache: boolean;
  setUseCache: Dispatch<SetStateAction<boolean>>;
  paused: boolean;
  setPaused: Dispatch<SetStateAction<boolean>>;
  repeat: boolean;
  setRepeat: Dispatch<SetStateAction<boolean>>;
  poster: string | undefined;
  setPoster: Dispatch<SetStateAction<string | undefined>>;
  muted: boolean;
  setMuted: Dispatch<SetStateAction<boolean>>;
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
    setControls,
    controls,
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
    setFullscreen(prev => !prev);
  };
  const toggleControls = () => {
    setControls(prev => !prev);
  };

  const openDecoration = () => {
    typeof ref !== 'function' && ref?.current?.setFullScreen(true);
  };

  const toggleShowNotificationControls = () => {
    setShowNotificationControls(prev => !prev);
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
    typeof ref !== 'function' && ref?.current?.seek(position);
  };

  const onRateSelected = (value: number) => {
    setRate(value);
  };

  const onVolumeSelected = (value: number) => {
    setVolume(value);
  };

  const onResizeModeSelected = (value: EnumValues<ResizeMode>) => {
    setResizeMode(value);
  };

  const toggleCache = () => setUseCache(prev => !prev);

  const togglePause = () => setPaused(prev => !prev);

  const toggleRepeat = () => setRepeat(prev => !prev);

  const togglePoster = () =>
    setPoster(prev => (prev ? undefined : samplePoster));

  const toggleMuted = () => setMuted(prev => !prev);

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
              <ToggleControl onPress={openDecoration} text="decoration" />
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
                    typeof ref !== 'function' &&
                      ref?.current
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
