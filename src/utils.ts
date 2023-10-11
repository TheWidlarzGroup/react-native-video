import type {Component, RefObject, ComponentClass} from 'react';
import {Image, findNodeHandle} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import type {ReactVideoSource} from './types/video';

type Source = ImageSourcePropType | ReactVideoSource;

export function resolveAssetSourceForVideo(source: Source): ReactVideoSource {
  if (typeof source === 'number') {
    return {
      uri: Image.resolveAssetSource(source).uri,
    };
  }
  return source as ReactVideoSource;
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
