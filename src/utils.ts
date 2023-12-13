import type {Component, RefObject, ComponentClass} from 'react';
import {Image, findNodeHandle} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import type {ReactVideoSource, ReactVideoSourceProperties} from './types/video';

type Source = ImageSourcePropType | ReactVideoSource;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateHeaderForNative(obj?: Record<string, any>) {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({key, value}));
}

export function resolveAssetSourceForVideo(
  source: Source,
): ReactVideoSourceProperties {
  if (typeof source === 'number') {
    return {
      uri: Image.resolveAssetSource(source).uri,
    };
  }
  return source as ReactVideoSourceProperties;
}

export function getReactTag(
  ref: RefObject<
    | Component<unknown, unknown, unknown>
    | ComponentClass<unknown, unknown>
    | null
  >,
): number {
  if (!ref.current) {
    throw new Error('Video Component is not mounted');
  }

  const reactTag = findNodeHandle(ref.current);

  if (!reactTag) {
    throw new Error(
      'Cannot find reactTag for Video Component in components tree',
    );
  }

  return reactTag;
}
