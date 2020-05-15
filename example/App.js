import React, {Component} from 'react';

import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Video from 'react-native-video';

const localSource = require('./Big_Buck_Bunny_1080_10s_2MB.mp4');
const remoteSource = {
  uri:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
};

class VideoPlayer extends Component {
  state = {
    rate: 1,
    volume: 1,
    muted: false,
    resizeMode: 'contain',
    ignoreSilentSwitch: null,
    mixWithOthers: null,
    isBuffering: false,
    source: 'local',
  };

  onLoad = data => {
    console.log('On load fired!', data);
  };

  renderSourceControl(source) {
    const isSelected = this.state.source === source;
    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({
            source,
          });
        }}>
        <Text
          style={[
            styles.controlOption,
            {fontWeight: isSelected ? 'bold' : 'normal'},
          ]}>
          {source}
        </Text>
      </TouchableOpacity>
    );
  }

  renderRateControl(rate) {
    const isSelected = this.state.rate === rate;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({rate: rate});
        }}>
        <Text
          style={[
            styles.controlOption,
            {fontWeight: isSelected ? 'bold' : 'normal'},
          ]}>
          {rate}x
        </Text>
      </TouchableOpacity>
    );
  }

  renderResizeModeControl(resizeMode) {
    const isSelected = this.state.resizeMode === resizeMode;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({resizeMode: resizeMode});
        }}>
        <Text
          style={[
            styles.controlOption,
            {fontWeight: isSelected ? 'bold' : 'normal'},
          ]}>
          {resizeMode}
        </Text>
      </TouchableOpacity>
    );
  }

  renderVolumeControl(volume) {
    const isSelected = this.state.volume === volume;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({volume: volume});
        }}>
        <Text
          style={[
            styles.controlOption,
            {fontWeight: isSelected ? 'bold' : 'normal'},
          ]}>
          {volume * 100}%
        </Text>
      </TouchableOpacity>
    );
  }

  renderIgnoreSilentSwitchControl(ignoreSilentSwitch) {
    const isSelected = this.state.ignoreSilentSwitch === ignoreSilentSwitch;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ignoreSilentSwitch: ignoreSilentSwitch});
        }}>
        <Text
          style={[
            styles.controlOption,
            {fontWeight: isSelected ? 'bold' : 'normal'},
          ]}>
          {ignoreSilentSwitch}
        </Text>
      </TouchableOpacity>
    );
  }

  renderMixWithOthersControl(mixWithOthers) {
    const isSelected = this.state.mixWithOthers === mixWithOthers;

    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({mixWithOthers: mixWithOthers});
        }}>
        <Text
          style={[
            styles.controlOption,
            {fontWeight: isSelected ? 'bold' : 'normal'},
          ]}>
          {mixWithOthers}
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const {source} = this.state;
    return (
      <View style={styles.container}>
        <Video
          key={source} // Changing source with controls=true seems to be broken
          source={source === 'local' ? localSource : remoteSource}
          poster={
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
          }
          style={styles.nativeVideoControls}
          rate={this.state.rate}
          volume={this.state.volume}
          muted={this.state.muted}
          ignoreSilentSwitch={this.state.ignoreSilentSwitch}
          mixWithOthers={this.state.mixWithOthers}
          resizeMode={this.state.resizeMode}
          onLoad={this.onLoad}
          onBuffer={this.onBuffer}
          onEnd={() => {
            Alert.alert('Done!');
          }}
          onError={error => console.warn(error)}
          controls
        />
        <View style={styles.controls}>
          <View style={styles.generalControls}>
            <View style={styles.sourceControl}>
              {this.renderSourceControl('local')}
              {this.renderSourceControl('remote')}
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
            {Platform.OS === 'ios' ? (
              <>
                <View style={styles.ignoreSilentSwitchControl}>
                  {this.renderIgnoreSilentSwitchControl('ignore')}
                  {this.renderIgnoreSilentSwitchControl('obey')}
                </View>
                <View style={styles.mixWithOthersControl}>
                  {this.renderMixWithOthersControl('mix')}
                  {this.renderMixWithOthersControl('duck')}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  controls: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    position: 'absolute',
    bottom: 44,
    left: 4,
    right: 4,
  },
  generalControls: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  sourceControl: {
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
    justifyContent: 'center',
  },
  ignoreSilentSwitchControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixWithOthersControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlOption: {
    alignSelf: 'center',
    fontSize: 11,
    color: 'white',
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 12,
  },
  nativeVideoControls: {
    height: 300,
    width: '100%',
  },
});

export default VideoPlayer;
