import {Alert, ToastAndroid} from 'react-native';
import {isAndroid} from '../constants';

export const toast = (visible: boolean, message: string) => {
  if (visible) {
    if (isAndroid) {
      ToastAndroid.showWithGravityAndOffset(
        message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
        25,
        50,
      );
    } else {
      Alert.alert(message, message);
    }
  }
};
