import * as React from 'react';
import { Button, Dimensions, StyleSheet, View } from 'react-native';
import { VideoView, createSource, useVideoPlayer } from 'react-native-video';

export default function App() {
  const [show, setShow] = React.useState(false);

  const player = useVideoPlayer('https://www.w3schools.com/html/mov_bbb.mp4');

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {show && <VideoView player={player} style={styles.box} />}
      </View>
      <Button title="Play" onPress={() => player.play()} />
      <Button title="Pause" onPress={() => player.pause()} />
      <Button title="Seek to 3sec" onPress={() => (player.currentTime = 3)} />
      <Button title="Toggle" onPress={() => setShow((prev) => !prev)} />
      <Button
        title="Preload player"
        onPress={() => {
          player
            .preload()
            .then(() => {
              // setShow(true);
            })
            .catch((error) => {
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
});
