'use strict';

import React, {
  Component
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  PanResponder,
  ToastAndroid,
} from 'react-native';

import { Picker } from '@react-native-picker/picker'

import Video, { VideoDecoderProperties, TextTrackType } from 'react-native-video';

class VideoPlayer extends Component {

  state = {
    rate: 1,
    volume: 1,
    muted: false,
    resizeMode: 'contain',
    duration: 0.0,
    currentTime: 0.0,
    videoWidth: 0,
    videoHeight: 0,
    paused: false,
    fullscreen: true,
    decoration: true,
    isLoading: false,
    seekerFillWidth: 0,
    seekerPosition: 0,
    seekerOffset: 0,
    seeking: false,
    audioTracks: [],
    textTracks: [],
    selectedAudioTrack: undefined,
    selectedTextTrack: undefined,
    srcListId: 0,
    loop: false,
  };

  seekerWidth = 0

  srcList = [
    require('./broadchurch.mp4'),
    {
      description: '(dash) sintel subtitles',
      uri: 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
    },
    {
      description: '(mp4) big buck bunny',
      uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
    },
    {
      description: '(hls|live) red bull tv',
      uri: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_928.m3u8'
    },
    {
      description: '(mp4|subtitles) demo with sintel Subtitles',
      uri:
        'http://www.youtube.com/api/manifest/dash/id/bf5bb2419360daf1/source/youtube?as=fmp4_audio_clear,fmp4_sd_hd_clear&sparams=ip,ipbits,expire,source,id,as&ip=0.0.0.0&ipbits=0&expire=19000000000&signature=51AF5F39AB0CEC3E5497CD9C900EBFEAECCCB5C7.8506521BFC350652163895D4C26DEE124209AA9E&key=ik0',
      type: 'mpd',
    },
    { description: '(no url) Stopped playback', uri: undefined },
    {
      description: '(no view) no View',
      noView: true,
    },
  ]

  video: Video;
  seekPanResponder: PanResponder | undefined;

  popupInfo = () => {
    VideoDecoderProperties.getWidevineLevel().then((widevineLevel: number) => {
      VideoDecoderProperties.isHEVCSupported().then((hevcSupported: boolean) => {
        VideoDecoderProperties.isCodecSupported('video/avc', 1920, 1080).then(
          (avcSupported: boolean) => {
            this.toast(
              true,
              'Widevine level: ' +
              widevineLevel +
              '\n hevc: ' +
              (hevcSupported ? '' : 'NOT') +
              'supported' +
              '\n avc: ' +
              (avcSupported ? '' : 'NOT') +
              'supported',
            )
          },
        )
      })
    })
  }

  onLoad = (data: any) => {
    this.setState({ duration: data.duration, loading: false, });
    this.onAudioTracks(data.audioTracks)
    this.onTextTracks(data.textTracks)
  };

  onProgress = (data: any) => {
    if (!this.state.seeking) {
      const position = this.calculateSeekerPosition()
      this.setSeekerPosition(position)
    }
    this.setState({ currentTime: data.currentTime })
  };


  onVideoLoadStart = () => {
    console.log('onVideoLoadStart')
    this.setState({ isLoading: true })
  }


  onAudioTracks = (data: any) => {
    const selectedTrack = data.audioTracks?.find((x: any) => {
      return x.selected
    })
    this.setState({
      audioTracks: data,
    })
    if (selectedTrack?.language) {
      this.setState({
        selectedAudioTrack: {
          type: 'language',
          value: selectedTrack?.language,
        },
      })

    }
  }

  onTextTracks = (data: any) => {
    const selectedTrack = data.textTracks?.find((x: any) => {
      return x.selected
    })

    this.setState({
      textTracks: data,
    })
    if (selectedTrack?.language) {
      this.setState({
        textTracks: data,
        selectedTextTrack: {
          type: 'language',
          value: selectedTrack?.language,
        },
      })
    }
  }

  onAspectRatio = (data: any) => {
    console.log('onAspectRadio called ' + JSON.stringify(data))
    this.setState({
      videoWidth: data.width,
      videoHeight: data.height,
    })
  }

  onVideoBuffer = (param: any) => {
    console.log('onVideoBuffer')

    this.setState({ isLoading: param.isBuffering })
  }


  onReadyForDisplay = () => {
    console.log('onReadyForDisplay')

    this.setState({ isLoading: false })
  }


  onAudioBecomingNoisy = () => {
    this.setState({ paused: true })
  };

  onAudioFocusChanged = (event: { hasAudioFocus: boolean }) => {
    this.setState({ paused: !event.hasAudioFocus })
  };

  getCurrentTimePercentage = () => {
    if (this.state.currentTime > 0 && this.state.duration !== 0) {
      return this.state.currentTime / this.state.duration;
    }
    return 0;
  };

  renderRateControl(rate: number) {
    const isSelected = (this.state.rate === rate);

    return (
      <TouchableOpacity onPress={() => { this.setState({ rate }) }}>
        <Text style={[styles.controlOption, { fontWeight: isSelected ? 'bold' : 'normal' }]}>
          {rate}
        </Text>
      </TouchableOpacity>
    );
  }

  renderResizeModeControl(resizeMode: string) {
    const isSelected = (this.state.resizeMode === resizeMode);

    return (
      <TouchableOpacity onPress={() => { this.setState({ resizeMode }) }}>
        <Text style={[styles.controlOption, { fontWeight: isSelected ? 'bold' : 'normal' }]}>
          {resizeMode}
        </Text>
      </TouchableOpacity>
    )
  }

  renderVolumeControl(volume: number) {
    const isSelected = (this.state.volume === volume);

    return (
      <TouchableOpacity onPress={() => { this.setState({ volume }) }}>
        <Text style={[styles.controlOption, { fontWeight: isSelected ? 'bold' : 'normal' }]}>
          {volume * 100}%
        </Text>
      </TouchableOpacity>
    )
  }


  toast = (visible: boolean, message: string) => {
    if (visible) {
      ToastAndroid.showWithGravityAndOffset(
        message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
        25,
        50,
      )
      return null
    }
    return null
  }

  onError = (err: any) => {
    console.log(JSON.stringify(err))
    this.toast(true, 'error: ' + err?.error?.code)
  }

  onEnd = () => {
    this.channelUp()
  };


  toggleFullscreen() {
    this.setState({ fullscreen: !this.state.fullscreen })
  }

  toggleDecoration() {
    this.setState({ decoration: !this.state.decoration })
    if (this.state.decoration) {
      this.video.dismissFullscreenPlayer()
    } else {
      this.video.presentFullscreenPlayer()
    }
  }

  goToChannel(channel: any) {
    this.setState({
      srcListId: channel,
      duration: 0.0,
      currentTime: 0.0,
      videoWidth: 0,
      videoHeight: 0,
      isLoading: false,
      audioTracks: [],
      textTracks: [],
      selectedAudioTrack: undefined,
      selectedTextTrack: undefined,
    })
  }


  channelUp() {
    console.log('channel up')
    this.goToChannel((this.state.srcListId + 1) % this.srcList.length)
  }

  channelDown() {
    console.log('channel down')
    this.goToChannel((this.state.srcListId + this.srcList.length - 1) % this.srcList.length)
  }

  componentDidMount() {
    this.initSeekPanResponder()
  }

  renderDecorationsControl() {
    return (
      <TouchableOpacity
        onPress={() => {
          this.toggleDecoration()
        }}
      >
        <Text style={[styles.controlOption]}>{'decoration'}</Text>
      </TouchableOpacity>
    )
  }

  renderInfoControl() {
    return (
      <TouchableOpacity
        onPress={() => {
          this.popupInfo()
        }}
      >
        <Text style={[styles.controlOption]}>{'decoderInfo'}</Text>
      </TouchableOpacity>
    )
  }

  renderFullScreenControl() {
    return (
      <TouchableOpacity
        onPress={() => {
          this.toggleFullscreen()
        }}
      >
        <Text style={[styles.controlOption]}>{'fullscreen'}</Text>
      </TouchableOpacity>
    )
  }

  renderPause() {
    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ paused: !this.state.paused })
        }}
      >
        <Text style={[styles.controlOption]}>
          {this.state.paused ? 'pause' : 'playing'}
        </Text>
      </TouchableOpacity>
    )
  }

  renderRepeatModeControl() {
    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ loop: !this.state.loop })
        }}
      >
        <Text style={[styles.controlOption]}>
          {this.state.loop ? 'loop enable' : 'loop disable'}
        </Text>
      </TouchableOpacity>
    )
  }

  renderLeftControl() {
    return (
      <View>
        <TouchableOpacity
          onPress={() => {
            this.channelDown()
          }}
        >
          <Text style={[styles.leftRightControlOption]}>{'ChDown'}</Text>
        </TouchableOpacity>
      </View>
      // onTimelineUpdated
    )
  }

  renderRightControl() {
    return (
      <View>
        <TouchableOpacity
          onPress={() => {
            this.channelUp()
          }}
        >
          <Text style={[styles.leftRightControlOption]}>{'ChUp'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  /**
   * Render the seekbar and attach its handlers
   */

  /**
   * Constrain the location of the seeker to the
   * min/max value based on how big the
   * seeker is.
   *
   * @param {float} val position of seeker handle in px
   * @return {float} constrained position of seeker handle in px
   */
  constrainToSeekerMinMax(val = 0) {
    if (val <= 0) {
      return 0
    } else if (val >= this.seekerWidth) {
      return this.seekerWidth
    }
    return val
  }

  /**
   * Set the position of the seekbar's components
   * (both fill and handle) according to the
   * position supplied.
   *
   * @param {float} position position in px of seeker handle}
   */
  setSeekerPosition(position = 0) {
    const state = this.state
    position = this.constrainToSeekerMinMax(position)

    state.seekerFillWidth = position
    state.seekerPosition = position

    if (!state.seeking) {
      state.seekerOffset = position
    }

    this.setState(state)
  }

  /**
   * Calculate the position that the seeker should be
   * at along its track.
   *
   * @return {float} position of seeker handle in px based on currentTime
   */
  calculateSeekerPosition() {
    const percent = this.state.currentTime / this.state.duration
    return this.seekerWidth * percent
  }

  /**
   * Return the time that the video should be at
   * based on where the seeker handle is.
   *
   * @return {float} time in ms based on seekerPosition.
   */
  calculateTimeFromSeekerPosition() {
    const percent = this.state.seekerPosition / this.seekerWidth
    return this.state.duration * percent
  }

  /**
   * Get our seekbar responder going
   */
  initSeekPanResponder() {
    this.seekPanResponder = PanResponder.create({
      // Ask to be the responder.
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,

      /**
       * When we start the pan tell the machine that we're
       * seeking. This stops it from updating the seekbar
       * position in the onProgress listener.
       */
      onPanResponderGrant: (evt, gestureState) => {
        const state = this.state
        // this.clearControlTimeout()
        const position = evt.nativeEvent.locationX
        this.setSeekerPosition(position)
        state.seeking = true
        this.setState(state)
      },

      /**
       * When panning, update the seekbar position, duh.
       */
      onPanResponderMove: (evt, gestureState) => {
        const position = this.state.seekerOffset + gestureState.dx
        this.setSeekerPosition(position)
      },

      /**
       * On release we update the time and seek to it in the video.
       * If you seek to the end of the video we fire the
       * onEnd callback
       */
      onPanResponderRelease: (evt, gestureState) => {
        const time = this.calculateTimeFromSeekerPosition()
        const state = this.state
        if (time >= state.duration && !state.isLoading) {
          state.paused = true
          this.onEnd()
        } else {
          this.video?.seek(time)
          state.seeking = false
        }
        this.setState(state)
      },
    })
  }

  renderSeekBar() {
    if (!this.seekPanResponder) {
      return null
    }
    return (
      <View
        style={styles.seekbarContainer}
        {...this.seekPanResponder.panHandlers}
        {...styles.generalControls}
      >
        <View
          style={styles.seekbarTrack}
          onLayout={(event) => (this.seekerWidth = event.nativeEvent.layout.width)}
          pointerEvents={'none'}
        >
          <View
            style={[
              styles.seekbarFill,
              {
                width:
                  this.state.seekerFillWidth > 0 ? this.state.seekerFillWidth : 0,
                backgroundColor: '#FFF',
              },
            ]}
            pointerEvents={'none'}
          />
        </View>
        <View
          style={[
            styles.seekbarHandle,
            { left: this.state.seekerPosition > 0 ? this.state.seekerPosition : 0 },
          ]}
          pointerEvents={'none'}
        >
          <View
            style={[
              styles.seekbarCircle,
              { backgroundColor: '#FFF' },
            ]}
            pointerEvents={'none'}
          />
        </View>
      </View>
    )
  }

  IndicatorLoadingView() {
    if (this.state.isLoading)
      return <ActivityIndicator color="#3235fd" size="large" style={styles.IndicatorStyle} />
    else return <View />
  }

  renderOverlay() {
    return (
      <>
        {this.IndicatorLoadingView()}
        <View style={styles.topControls}>
          <Text style={[styles.controlOption]}>
            {this.srcList[this.state.srcListId]?.description || 'local file'}
          </Text>
        </View>
        <View style={styles.leftControls}>
          <View style={styles.resizeModeControl}>{this.renderLeftControl()}</View>
        </View>
        <View style={styles.rightControls}>
          <View style={styles.resizeModeControl}>{this.renderRightControl()}</View>
        </View>
        <View style={styles.bottomControls}>
          <View style={styles.generalControls}>
            <View style={styles.generalControls}>
              <View style={styles.resizeModeControl}>{this.renderInfoControl()}</View>
            </View>
            <View style={styles.resizeModeControl}>{this.renderPause()}</View>
            <View style={styles.resizeModeControl}>
              {this.renderRepeatModeControl()}
            </View>
            <View style={styles.resizeModeControl}>
              {this.renderFullScreenControl()}
            </View>
            <View style={styles.resizeModeControl}>
              {this.renderDecorationsControl()}
            </View>
          </View>
          <View style={styles.generalControls}>
            <View style={styles.rateControl}>
              {this.renderRateControl(0.25)}
              {this.renderRateControl(0.5)}
              {this.renderRateControl(1.0)}
              {this.renderRateControl(1.5)}
              {this.renderRateControl(2.0)}
            </View>

            <View style={styles.volumeControl}>
              {this.renderVolumeControl(0.5)}
              {this.renderVolumeControl(1)}
              {this.renderVolumeControl(1.5)}
            </View>

            <View style={styles.resizeModeControl}>
              {this.renderResizeModeControl('cover')}
              {this.renderResizeModeControl('contain')}
              {this.renderResizeModeControl('stretch')}
            </View>
          </View>
          {this.renderSeekBar()}
          <View style={styles.generalControls}>
            <Text style={styles.controlOption}>AudioTrack</Text>
            {this.state.audioTracks?.length <= 0 ? (
              <Text style={styles.controlOption}>empty</Text>
            ) : (
              <Picker
                style={styles.picker}
                selectedValue={this.state.selectedAudioTrack?.value}
                onValueChange={(itemValue, itemIndex) => {
                  console.log('on audio value change ' + itemValue)
                  this.setState({
                    selectedAudioTrack: {
                      type: 'language',
                      value: itemValue,
                    },
                  })
                }}
              >
                {this.state.audioTracks.map((track) => {
                  return (
                    <Picker.Item
                      label={track.language}
                      value={track.language}
                      key={track.language}
                    />
                  )
                })}
              </Picker>
            )}
            <Text style={styles.controlOption}>TextTrack</Text>
            {this.state.textTracks?.length <= 0 ? (
              <Text style={styles.controlOption}>empty</Text>
            ) : (
              <Picker
                style={styles.picker}
                selectedValue={this.state.selectedTextTrack?.value}
                onValueChange={(itemValue, itemIndex) => {
                  console.log('on value change ' + itemValue)
                  this.setState({
                    selectedTextTrack: {
                      type: 'language',
                      value: itemValue,
                    },
                  })
                }}
              >
                <Picker.Item label={'none'} value={'none'} key={'none'} />

                {this.state.textTracks.map((track) => (
                  <Picker.Item
                    label={track.language}
                    value={track.language}
                    key={track.language}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>
      </>
    )
  }

  renderVideoView() {
    const viewStyle = this.state.fullscreen ? styles.fullScreen : styles.halfScreen

    return (
      <TouchableOpacity style={viewStyle}>
        <Video
          ref={(ref: Video) => {
            this.video = ref
          }}
          source={this.srcList[this.state.srcListId]}
          style={viewStyle}
          rate={this.state.rate}
          paused={this.state.paused}
          volume={this.state.volume}
          muted={this.state.muted}
          resizeMode={this.state.resizeMode}
          onLoad={this.onLoad}
          onProgress={this.onProgress}
          onEnd={this.onEnd}
          progressUpdateInterval={1000}
          onError={this.onError}
          onAudioBecomingNoisy={this.onAudioBecomingNoisy}
          onAudioFocusChanged={this.onAudioFocusChanged}
          onLoadStart={this.onVideoLoadStart}
          onVideoAspectRatio={this.onAspectRatio}
          onReadyForDisplay={this.onReadyForDisplay}
          onBuffer={this.onVideoBuffer}
          repeat={this.state.loop}
          selectedTextTrack={this.state.selectedTextTrack}
          selectedAudioTrack={this.state.selectedAudioTrack}
        />
      </TouchableOpacity>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        {this.srcList[this.state.srcListId]?.noView ? null : this.renderVideoView()}
        {this.renderOverlay()}
      </View>
    )
  }

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  halfScreen: {
    position: 'absolute',
    top: 50,
    left: 50,
    bottom: 100,
    right: 100,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  bottomControls: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  leftControls: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    position: 'absolute',
    top: 20,
    bottom: 20,
    left: 20,
  },
  rightControls: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    position: 'absolute',
    top: 20,
    bottom: 20,
    right: 20,
  },
  topControls: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  generalControls: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  rateControl: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  volumeControl: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resizeModeControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftRightControlOption: {
    alignSelf: 'center',
    fontSize: 11,
    color: 'white',
    padding: 10,
    lineHeight: 12,
  },
  controlOption: {
    alignSelf: 'center',
    fontSize: 11,
    color: 'white',
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 12,
  },
  IndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
  },
  seekbarContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 4,
    height: 30,
  },
  seekbarTrack: {
    backgroundColor: '#333',
    height: 1,
    position: 'relative',
    top: 14,
    width: '100%',
  },
  seekbarFill: {
    backgroundColor: '#FFF',
    height: 1,
    width: '100%',
  },
  seekbarHandle: {
    position: 'absolute',
    marginLeft: -7,
    height: 28,
    width: 28,
  },
  seekbarCircle: {
    borderRadius: 12,
    position: 'relative',
    top: 8,
    left: 8,
    height: 12,
    width: 12,
  },
  picker: {
    color: 'white',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default VideoPlayer