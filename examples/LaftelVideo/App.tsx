/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {type PropsWithChildren} from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Video from 'react-native-video'

const App = () => {

  return (
    <View style={{flex: 1}}>
      <Video style={{flex:1, backgroundColor: 'blue'}} source={{uri: "https://rawgit.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4"}} />
    </View>
  );
};

export default App;
