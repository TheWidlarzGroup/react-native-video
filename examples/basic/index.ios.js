'use strict';
import React, {
  Component
} from 'react';

import {
  AlertIOS,
  AppRegistry,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Video from 'react-native-video';

class VideoPlayer extends Component {
  constructor(props) {
    super(props);
    this.onLoad = this.onLoad.bind(this);
    this.onProgress = this.onProgress.bind(this);
    this.onBuffer = this.onBuffer.bind(this);
  }
  state = {
    rate: 1,
    volume: 1,
    muted: false,
    resizeMode: 'contain',
    duration: 0.0,
    currentTime: 0.0,
    controls: false,
    paused: true,
    skin: 'custom',
    ignoreSilentSwitch: null,
    isBuffering: false,
  };

  onLoad(data) {
    console.log('On load fired!');
    this.setState({duration: data.duration});
  }

  onProgress(data) {
    this.setState({currentTime: data.currentTime});
  }

  onBuffer({ isBuffering }: { isBuffering: boolean }) {
    this.setState({ isBuffering });
  }

  getCurrentTimePercentage() {
    if (this.state.currentTime > 0) {
      return parseFloat(this.state.currentTime) / parseFloat(this.state.duration);
    } else {
      return 0;
    }
  }

  renderSkinControl(skin) {
    const isSelected = this.state.skin == skin;
    const selectControls = skin == 'native' || skin == 'embed';
    return (
      <TouchableOpacity onPress={() => { this.setState({
          controls: selectControls,
          skin: skin
        }) }}>
        <Text style={[styles.controlOption, {fontWeight: isSelected ? "bold" : "normal"}]}>
          {skin}
        </Text>
      </TouchableOpacity>
    );
  }

  renderRateControl(rate) {
    const isSelected = (this.state.rate == rate);

    return (
      <TouchableOpacity onPress={() => { this.setState({rate: rate}) }}>
        <Text style={[styles.controlOption, {fontWeight: isSelected ? "bold" : "normal"}]}>
          {rate}x
        </Text>
      </TouchableOpacity>
    )
  }

  renderResizeModeControl(resizeMode) {
    const isSelected = (this.state.resizeMode == resizeMode);

    return (
      <TouchableOpacity onPress={() => { this.setState({resizeMode: resizeMode}) }}>
        <Text style={[styles.controlOption, {fontWeight: isSelected ? "bold" : "normal"}]}>
          {resizeMode}
        </Text>
      </TouchableOpacity>
    )
  }

  renderVolumeControl(volume) {
    const isSelected = (this.state.volume == volume);

    return (
      <TouchableOpacity onPress={() => { this.setState({volume: volume}) }}>
        <Text style={[styles.controlOption, {fontWeight: isSelected ? "bold" : "normal"}]}>
          {volume * 100}%
        </Text>
      </TouchableOpacity>
    )
  }

  renderIgnoreSilentSwitchControl(ignoreSilentSwitch) {
    const isSelected = (this.state.ignoreSilentSwitch == ignoreSilentSwitch);

    return (
      <TouchableOpacity onPress={() => { this.setState({ignoreSilentSwitch: ignoreSilentSwitch}) }}>
        <Text style={[styles.controlOption, {fontWeight: isSelected ? "bold" : "normal"}]}>
          {ignoreSilentSwitch}
        </Text>
      </TouchableOpacity>
    )
  }

  renderCustomSkin() {
    const flexCompleted = this.getCurrentTimePercentage() * 100;
    const flexRemaining = (1 - this.getCurrentTimePercentage()) * 100;

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.fullScreen} onPress={() => {this.setState({paused: !this.state.paused})}}>
          <Video
            // source={require('./broadchurch.mp4')}
            // source={{
            //     uri: 'https://public_seriously.s3.amazonaws.com/shaka_encrypted/hls_encrypted/HLSBigBuckBunny_video/main.m3u8',
            //     type: 'hls',
            //     drm: '{\"id\":"15", ' +
            //         '\"drmScheme\": \"fairplay\", ' +
            //         '\"licensingServerUrl\": \"https://qa-shield-drm.sd-ngp.net/api/v2/license\",' +
            //         '\"croToken\": \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjb20uZGljZS50ZXN0X2NsaWVudCIsImNpZCI6ImRpY2VfdGVzdF9jbGllbnQiLCJwbGMiOnRydWUsImp0aSI6IjUzYzY5MDAzLTIwNTAtNGQxMS1iOGMxLWRlNjMyMmVmNjZlOCIsImVpZCI6ImZlMzk2YmU5LTlkNDYtNGRlMC04MDdhLTk4M2Q0NGE0N2JhMSIsImV4cCI6MTUzNzQ2NTQ1MywiaWF0IjoxNTM3NDU4MTUzLCJkZWYiOiJzZCJ9.rP9tsDBPH3SEMpE3FxEcrbXwP19fU_QJ66OReRzVxSo\",' +
            //         '\"persistentLicense\": false}'
            //     /* drm: '{\"drmScheme\": \"widevine\", \"offlineLicense\": \"a3NpZDVFRUI2QkM1\"}' */ //offline playback action token
            // }}

            source={{
                uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
                type: 'hls',
                config: {
                    muxData: {
                        envKey: "4004c26186c29919e27fa9f6c",
                        viewerUserId: "fake_exid",
                        experimentName: "A/B test one",
                        subPropertyId: "realmInformation",
                        videoId: "fake_id",
                        videoTitle: "Big Buck Bunny",
                        videoSeries: "Test Show",
                        //videoDuration: 48000, 
                        videoIsLive: false,
                        videoStreamType: "on-demand",
                        videoCdn: "standard"
                    },
                    beacon: {
                        url: 'http://localhost:8000/testBeaconResponse.json',
                        headers: {
                            'X-Custom-Header': 'Custom header contents',
                            'Authorization': 'Bearer asdasdsdfgfdadsfgg'
                        },
                        body: {id: '123', video: 12345}
                    }
                }
                /* drm: '{\"drmScheme\": \"widevine\", \"offlineLicense\": \"a3NpZDVFRUI2QkM1\"}' */ //offline playback action token
            }}
            style={styles.fullScreen}
            rate={this.state.rate}
            paused={this.state.paused}
            volume={this.state.volume}
            muted={this.state.muted}
            ignoreSilentSwitch={this.state.ignoreSilentSwitch}
            resizeMode={this.state.resizeMode}
            onLoad={this.onLoad}
            onBuffer={this.onBuffer}
            onProgress={this.onProgress}
            onEnd={() => { AlertIOS.alert('Done!') }}
            repeat={true}
          />
        </TouchableOpacity>

        <View style={styles.controls}>
          <View style={styles.generalControls}>
            <View style={styles.skinControl}>
              {this.renderSkinControl('custom')}
              {this.renderSkinControl('native')}
              {this.renderSkinControl('embed')}
            </View>
          </View>
          <View style={styles.generalControls}>
            <View style={styles.rateControl}>
              {this.renderRateControl(0.5)}
              {this.renderRateControl(1.0)}
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
          <View style={styles.generalControls}>
            {
              (Platform.OS === 'ios') ?
                <View style={styles.ignoreSilentSwitchControl}>
                  {this.renderIgnoreSilentSwitchControl('ignore')}
                  {this.renderIgnoreSilentSwitchControl('obey')}
                </View> : null
            }
          </View>

          <View style={styles.trackingControls}>
            <View style={styles.progress}>
              <View style={[styles.innerProgressCompleted, {flex: flexCompleted}]} />
              <View style={[styles.innerProgressRemaining, {flex: flexRemaining}]} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  renderNativeSkin() {
    const videoStyle = this.state.skin == 'embed' ? styles.nativeVideoControls : styles.fullScreen;
    return (
      <View style={styles.container}>
        <View style={styles.fullScreen}>
          <Video
              source={{
                  uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
                  type: 'hls',
                  config: {
                      muxData: {
                        envKey: "4004c26186c29919e27fa9f6c",
                        viewerUserId: "fake_exid",
                        experimentName: "A/B test one",
                        subPropertyId: "realmInformation",
                        videoId: "fake_id",
                        videoTitle: "Big Buck Bunny",
                        videoSeries: "Test Show",
                        //videoDuration: 48000, 
                        videoIsLive: false,
                        videoStreamType: "on-demand",
                        videoCdn: "standard"
                      },
                      beacon: {
                          url: 'http://localhost:8000/testBeaconResponse.json',
                          headers: {
                              'X-Custom-Header': 'Custom header contents',
                              'Authorization': 'Bearer asdasdsdfgfdadsfgg'
                          },
                          body: {id: '123', video: 12345}
                      }
                  }
                  /* drm: '{\"drmScheme\": \"widevine\", \"offlineLicense\": \"a3NpZDVFRUI2QkM1\"}' */ //offline playback action token
              }}
            style={videoStyle}
            rate={this.state.rate}
            paused={this.state.paused}
            volume={this.state.volume}
            muted={this.state.muted}
            ignoreSilentSwitch={this.state.ignoreSilentSwitch}
            resizeMode={this.state.resizeMode}
            onLoad={this.onLoad}
            onBuffer={this.onBuffer}
            onProgress={this.onProgress}
            onEnd={() => { AlertIOS.alert('Done!') }}
            repeat={true}
            controls={this.state.controls}
          />
        </View>
        <View style={styles.controls}>
          <View style={styles.generalControls}>
            <View style={styles.skinControl}>
              {this.renderSkinControl('custom')}
              {this.renderSkinControl('native')}
              {this.renderSkinControl('embed')}
            </View>
          </View>
          <View style={styles.generalControls}>
            <View style={styles.rateControl}>
              {this.renderRateControl(0.5)}
              {this.renderRateControl(1.0)}
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
          <View style={styles.generalControls}>
            {
              (Platform.OS === 'ios') ?
                <View style={styles.ignoreSilentSwitchControl}>
                  {this.renderIgnoreSilentSwitchControl('ignore')}
                  {this.renderIgnoreSilentSwitchControl('obey')}
                </View> : null
            }
          </View>
        </View>

      </View>
    );
  }

  render() {
    return this.state.controls ? this.renderNativeSkin() : this.renderCustomSkin();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  controls: {
    backgroundColor: "transparent",
    borderRadius: 5,
    position: 'absolute',
    bottom: 44,
    left: 4,
    right: 4,
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  innerProgressCompleted: {
    height: 20,
    backgroundColor: '#cccccc',
  },
  innerProgressRemaining: {
    height: 20,
    backgroundColor: '#2C2C2C',
  },
  generalControls: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  skinControl: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
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
    justifyContent: 'center'
  },
  ignoreSilentSwitchControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlOption: {
    alignSelf: 'center',
    fontSize: 11,
    color: "white",
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 12,
  },
  nativeVideoControls: {
    top: 184,
    height: 300
  }
});

AppRegistry.registerComponent('VideoPlayer', () => VideoPlayer);
