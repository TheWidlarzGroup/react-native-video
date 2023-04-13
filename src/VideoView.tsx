import React from 'react'
import type { NativeProps } from './VideoNativeComponent';
import RNCVideoComponent from './VideoNativeComponent'
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource'
import type { ResolvedAssetSource } from 'react-native/Libraries/Image/AssetSourceResolver';

export interface VideoViewProps extends Omit<NativeProps, 'src'> {
    source: {
      uri: string
    } | number
}

export default function VideoView({ source: sourceProp, ...props }: VideoViewProps) {
    const source = resolveAssetSource(sourceProp) || {} as ResolvedAssetSource
    const shouldCache = !(source as any).__packager_asset;

    let uri = source.uri || '';
    if (uri && uri.match(/^\//)) {
      uri = `file://${uri}`;
    }

    const isNetwork = !!(uri && uri.match(/^https?:/i));
    const isAsset = !!(uri && uri.match(/^(assets-library|ph|ipod-library|file|content|ms-appx|ms-appdata):/i));

    if ((uri || uri === '') && !isNetwork && !isAsset) {
      if (this.props.onError) {
        this.props.onError({error: {errorString: 'invalid url, player will stop', errorCode: 'INVALID_URL'}});
      }
    }

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
          requestHeaders: source.headers ? this.stringsOnlyObject(source.headers) : {},
          startTime: source.startTime || 0,
          endTime: source.endTime
        }}
        {...props}
      />
    )
  }
