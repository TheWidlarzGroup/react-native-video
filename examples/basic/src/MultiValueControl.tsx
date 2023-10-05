import React from 'react';

import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

/*
* MultiValueControl displays a list clickable text view
*/

interface MultiValueControlType {
  // a list a string or number to be displayed
  values: Array<string | number>
  // The selected value in values
  selected?: string | number
  // callback to press onPress
  onPress: (arg: string | number) => any
}

const MultiValueControl = ({ values, selected, onPress }: MultiValueControlType) => {
  const selectedStyle: TextStyle = StyleSheet.flatten([
    styles.option,
    {fontWeight: 'bold'},
  ]);

  const unselectedStyle: TextStyle = StyleSheet.flatten([
    styles.option,
    {fontWeight: 'normal'},
  ]);

    return <View style={styles.container}>
      {values.map((value: string | number) => {
          const _style = value === selected ? selectedStyle : unselectedStyle
          return (
            <TouchableOpacity
              key={value}
              onPress={() => {
                onPress?.(value)
              }}>
            <Text style={_style}>{value}</Text>
            </TouchableOpacity>)
        })}
      </View>
}

const styles = StyleSheet.create({
  option: {
    alignSelf: 'center',
    fontSize: 11,
    color: 'white',
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 12,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MultiValueControl;
