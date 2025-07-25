import type { Component, RefObject, ComponentClass } from 'react';
import { type ImageSourcePropType } from 'react-native';
import type { ReactVideoSource, ReactVideoSourceProperties } from './types/video';
export declare function generateHeaderForNative(obj?: Record<string, any>): {
    key: string;
    value: any;
}[];
type Source = ImageSourcePropType | ReactVideoSource;
export declare function resolveAssetSourceForVideo(source: Source): ReactVideoSourceProperties;
/**
 * @deprecated
 * Do not use this fn anymore. "findNodeHandle" will be deprecated.
 * */
export declare function getReactTag(ref: RefObject<Component<unknown, unknown, unknown> | ComponentClass<unknown, unknown> | null>): number;
export {};
