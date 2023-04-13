import React from 'react'
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { Double, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

interface Src {
  uri: string
  isNetwork: boolean
  isAsset: boolean
  shouldCache: boolean
  type?: WithDefault<string, ''>
  mainVer?: WithDefault<Int32, 0>
  patchVer?: WithDefault<Int32, 0>
  requestHeaders: Readonly<{}>
  startTime?: WithDefault<Double, 0>
  endTime: Double
}

export interface NativeProps extends ViewProps {
  src: Readonly<Src>
}

export default codegenNativeComponent<NativeProps>('RNCVideo');

