import React from 'react';

import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

/*
 * ToggleControl displays a 2 states clickable text
 */

interface ToggleControlType {
  // boolean indicating if text is selected state
  isSelected?: boolean;
  // value of text when selected
  selectedText?: string;
  // value of text when NOT selected
  unselectedText?: string;
  // default text if no only one text field is needed
  text?: string;
  // callback called when pressing the component
  onPress: () => void;
}

const ToggleControl = ({
  isSelected,
  selectedText,
  unselectedText,
  text,
  onPress,
}: ToggleControlType) => {
  const selectedStyle: TextStyle = StyleSheet.flatten([
    styles.controlOption,
    {fontWeight: 'bold'},
  ]);

  const unselectedStyle: TextStyle = StyleSheet.flatten([
    styles.controlOption,
    {fontWeight: 'normal'},
  ]);

  const style = isSelected ? selectedStyle : unselectedStyle;
  const _text = text ? text : isSelected ? selectedText : unselectedText;
  return (
    <View style={styles.resizeModeControl}>
      <TouchableOpacity onPress={onPress}>
        <Text style={style}>{_text}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlOption: {
    alignSelf: 'center',
    fontSize: 11,
    color: 'white',
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 12,
  },
  resizeModeControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ToggleControl;
