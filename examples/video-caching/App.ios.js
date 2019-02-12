/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from "react";
import { Alert, StyleSheet, Text, View, Dimensions, TouchableOpacity } from "react-native";
import Video from "react-native-video";

const { height, width } = Dimensions.get("screen");

type Props = {};

type State = {
  showLocal: boolean
};

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

export default class App extends Component<Props, State> {
  state = {
    showLocal: false
  }
  render() {
    return (
      <View style={styles.container}>
        <Video
          source={
            this.state.showLocal ?
              require('../basic/broadchurch.mp4') :
              {
                uri:  "https://rawgit.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4"
              }
          }
          ref={player => {
            this.player = player;
          }}
          onEnd={() => {
            this.player.seek(0);
          }}
          onError={(err) => {
            Alert.alert(JSON.stringify(err))
          }}
          style={{ flex: 1, height, width }}
        />
        <View style={styles.absoluteOverlay}>
          <Button
            onPress={async () => {
              let response = await this.player.save();
              let uri = response.uri;
              console.warn("Download URI", uri);
            }}
            text="Save"
          />
          <Button
            onPress={() => {
              this.setState(state => ({ showLocal: !state.showLocal }))
            }}
            text={this.state.showLocal ? "Show Remote" : "Show Local"}
          />
        </View>
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
  absoluteOverlay: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    width: '100%',
    marginTop: 50,
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
