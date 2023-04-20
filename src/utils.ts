import { Image } from "react-native";
import type { ImageSourcePropType } from 'react-native';
import type { ReactVideoSource } from './types/video';

type Source = ImageSourcePropType | ReactVideoSource;

export function generateHeaderForNative(obj?: Record<string, any>) {
  if (!obj) return [];
  return Object.entries(obj).map(([ key, value]) => ({ key, value }));
}

export function resolveAssetSourceForVideo(source: Source): ReactVideoSource {
  if (typeof source === 'number') {
    return {
      uri: Image.resolveAssetSource(source).uri,
    };
  }
  return source as ReactVideoSource;
}