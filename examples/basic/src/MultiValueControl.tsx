import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import {ResizeMode} from 'react-native-video';

/*
 * MultiValueControl displays a list clickable text view
 */

interface MultiValueControlType<T> {
  // a list a string or number to be displayed
  values: Array<T>;
  // The selected value in values
  selected?: T;
  // callback to press onPress
  onPress: (arg: T) => void;
}

const MultiValueControl = <T extends number | string | ResizeMode>({
  values,
  selected,
  onPress,
}: MultiValueControlType<T>) => {
  const selectedStyle: TextStyle = StyleSheet.flatten([
    styles.option,
    {fontWeight: 'bold'},
  ]);

  const unselectedStyle: TextStyle = StyleSheet.flatten([
    styles.option,
    {fontWeight: 'normal'},
  ]);

  return (
    <View style={styles.container}>
      {values.map(value => {
        const _style = value === selected ? selectedStyle : unselectedStyle;
        return (
          <TouchableOpacity
            key={value}
            onPress={() => {
              onPress?.(value);
            }}>
            <Text style={_style}>{value}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

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
