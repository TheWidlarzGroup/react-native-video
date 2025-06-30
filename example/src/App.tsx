import * as React from 'react';
import { Button, Platform, StyleSheet, View } from 'react-native';
import { VideoView, createPlayer } from 'react-native-video';

const player = createPlayer('https://www.w3schools.com/html/mov_bbb.mp4');

export default function App() {
  const [show, setShow] = React.useState(true);

  // You can easily access player!
  const play = React.useCallback(() => {
    player.play();
  }, []);

  const pause = React.useCallback(() => {
    player.pause();
  }, []);

  const seek = React.useCallback(() => {
    player.currentTime = 3;
  }, []);

  return (
    <View style={styles.container}>
      <VideoView player={player} style={styles.box} />
      {/* Two VideoViews with same player are supported not supported on Android */}
      {Platform.OS === 'ios' && show && (
        <VideoView player={player} style={styles.box} />
      )}
      <Button title="Play" onPress={play} />
      <Button title="Pause" onPress={pause} />
      <Button title="Seek to 3sec" onPress={seek} />
      <Button title="Toggle" onPress={() => setShow((prev) => !prev)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  box: {
    width: 300,
    height: 300,
    marginVertical: 20,
  },
});
