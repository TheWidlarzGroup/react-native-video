import * as React from 'react';
import {
  Button,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { VideoView, createSource, useVideoPlayer } from 'react-native-video';

const VideoDemo = () => {
  const [show, setShow] = React.useState(false);

  const player = useVideoPlayer(
    'https://www.w3schools.com/html/mov_bbb.mp4',
    (_player) => {
      _player.loop = true;
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {show ? (
          <VideoView player={player} style={styles.box} />
        ) : (
          <View style={styles.hiddenVideo}>
            <Text style={styles.hiddenVideoText}>VideoView is hidden!</Text>
          </View>
        )}
      </View>
      <Button title="Play" onPress={() => player.play()} />
      <Button title="Pause" onPress={() => player.pause()} />
      <Button title="Seek to 0sec" onPress={() => player.seekTo(0)} />
      <Button title="Seek by 1sec" onPress={() => player.seekBy(1)} />
      <Button
        title={show ? 'Hide VideoView' : 'Show VideoView'}
        onPress={() => setShow((prev) => !prev)}
      />
      <Button
        title="Preload player"
        onPress={() => {
          player.preload().catch((error) => {
            console.error(error);
          });
        }}
      />
      <Button
        title="Replace source"
        onPress={() => {
          const newSource = createSource(
            'https://www.w3schools.com/html/mov_bbb.mp4'
          );

          newSource.getAssetInformationAsync().then((assetInfo) => {
            console.log(assetInfo);
          });

          player.replaceSourceAsync(newSource);
        }}
      />
    </View>
  );
};

export default function App() {
  const [mounted, setMounted] = React.useState(true);
  return (
    <SafeAreaView style={styles.container}>
      {mounted && <VideoDemo />}
      <Button
        title={mounted ? 'Unmount' : 'Mount'}
        onPress={() => setMounted((prev) => !prev)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  videoContainer: {
    flexDirection: Dimensions.get('window').width > 700 ? 'row' : 'column',
    gap: 20,
  },
  box: {
    width: 300,
    height: 300,
    marginVertical: 20,
  },
  hiddenVideo: {
    width: 300,
    height: 300,
    marginVertical: 20,
    backgroundColor: 'gray',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenVideoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
