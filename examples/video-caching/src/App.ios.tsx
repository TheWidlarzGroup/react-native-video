import React, { useRef, useState } from "react";
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Video from "react-native-video";

const { height, width } = Dimensions.get("screen");

function Button({ text, onPress }: { text: string, onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
    >
      <Text style={{color: 'white'}}>{text}</Text>
    </TouchableOpacity>
  )
}

export default () => {
  const [showLocal, setShowLocal] = useState(true);
  const player = useRef<Video>(null);

  return(
      <View style={styles.container}>
        <Video
          source={
            showLocal ?
              require('./broadchurch.mp4') :
              {
                uri:  "https://rawgit.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4"
              }
          }
          ref={player}
          onEnd={() => {
            player.current.seek(0);
          }}
          onError={(err) => {
            Alert.alert(JSON.stringify(err))
          }}
          style={{ flex: 1, height, width }}
        />
        <View style={styles.absoluteOverlay}>
          <Button
            onPress={async () => {
              let {uri} = await player.current.save()
              console.warn("Download URI", uri);
            }}
            text="Save"
          />
          <Button
            onPress={() => {
              setShowLocal(!showLocal)
            }}
            text={showLocal ? "Show Remote" : "Show Local"}
          />
        </View>
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  absoluteOverlay: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    width: '100%',
    marginTop: 128
  },
  button: {
    padding: 10,
    backgroundColor: '#9B2FAE',
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  }
});
