import React from 'react'
import type { VideoNativeProps } from './fabric/VideoNativeComponent';
import RNCVideoComponent from './fabric/VideoNativeComponent'
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource'
import type { ResolvedAssetSource } from 'react-native/Libraries/Image/AssetSourceResolver';

export interface VideoViewProps extends Omit<VideoNativeProps, 'src'> {
    source: {
      uri: string
    } | number
}

export default function VideoView({ source: sourceProp, ...props }: VideoViewProps) {
    const source = resolveAssetSource(sourceProp) || {} as ResolvedAssetSource;
    const shouldCache = !(source as any).__packager_asset;

    let uri = source.uri || '';
    if (uri && uri.match(/^\//)) {
      uri = `file://${uri}`;
    }

    const isNetwork = !!(uri && uri.match(/^https?:/i));
    const isAsset = !!(uri && uri.match(/^(assets-library|ph|ipod-library|file|content|ms-appx|ms-appdata):/i));


    return (
      <RNCVideoComponent
        src={{
          uri,
          isNetwork,
          isAsset,
          shouldCache,
          type: source.type || '',
          mainVer: source.mainVer || 0,
          patchVer: source.patchVer || 0,
          requestHeaders: source.headers ?? {},
          startTime: source.startTime || 0,
          endTime: source.endTime
        }}
        {...props}
      />
    )
  }
