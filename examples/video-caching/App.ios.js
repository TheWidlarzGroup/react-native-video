/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from "react";
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from "react-native";
import Video from "react-native-video";

const { height, width } = Dimensions.get("screen");

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Video
          source={{
            uri:
              "https://rawgit.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4"
          }}
          ref={player => {
            this.player = player;
          }}
          onEnd={() => {
            this.player.seek(0);
          }}
          style={{ flex: 1, height, width }}
        />
        <TouchableOpacity
          onPress={async () => {
            let response = await this.player.save();
            let uri = response.uri;
            console.log("Download URI", uri);
          }}
          style={styles.button}
        >
          <Text style={{color: 'white'}}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  button: {
    position: 'absolute',
    top: 50,
    right: 16,
    padding: 10,
    backgroundColor: '#9B2FAE',
    borderRadius: 8
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  }
});
