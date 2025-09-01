import { Image, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  VideoPlayerSource,
  VideoPlayerSourceFactory,
} from '../../spec/nitro/VideoPlayerSource.nitro';
import type {
  ExternalSubtitle,
  NativeVideoConfig,
  SubtitleType,
  VideoConfig,
  VideoSource,
} from '../types/VideoConfig';
import { tryParseNativeVideoError } from '../types/VideoError';

const VideoPlayerSourceFactory =
  NitroModules.createHybridObject<VideoPlayerSourceFactory>(
    'VideoPlayerSourceFactory'
  );

export const isVideoPlayerSource = (obj: any): obj is VideoPlayerSource => {
  return (
    obj && // obj is not null
    typeof obj === 'object' && // obj is an object
    'name' in obj && // obj has a name property
    obj.name === 'VideoPlayerSource' // obj.name is 'VideoPlayerSource'
  );
};

/**
 * Creates a `VideoPlayerSource` instance from a URI (string).
 *
 * @param uri - The URI of the video to play
 * @returns The `VideoPlayerSource` instance
 */
export const createSourceFromUri = (uri: string) => {
  try {
    return VideoPlayerSourceFactory.fromUri(uri);
  } catch (error) {
    throw tryParseNativeVideoError(error);
  }
};

/**
 * Creates a `VideoPlayerSource` instance from a `VideoConfig`.
 *
 * @note The `uri` property is required to be a string.
 *
 * @param config - The `VideoConfig` to create the `VideoPlayerSource` from
 * @returns The `VideoPlayerSource` instance
 */
export const createSourceFromVideoConfig = (
  config: VideoConfig & { uri: string }
) => {
  if (config.externalSubtitles) {
    config.externalSubtitles = parseExternalSubtitles(config.externalSubtitles);
  }

  // Ensure platform-based default for DRM type if DRM is provided without a type
  if (config.drm && config.drm.type === undefined) {
    const defaultDrmType = Platform.select({
      android: 'widevine',
      ios: 'fairplay',
      default: undefined,
    });

    if (defaultDrmType) {
      config.drm = {
        ...config.drm,
        type: defaultDrmType,
      };
    }
  }

  // Set default value for initializeOnCreation (true)
  if (config.initializeOnCreation === undefined) {
    config.initializeOnCreation = true;
  }

  try {
    return VideoPlayerSourceFactory.fromVideoConfig(
      config as NativeVideoConfig
    );
  } catch (error) {
    throw tryParseNativeVideoError(error);
  }
};

/**
 * Parses the external subtitles from the `ExternalSubtitle` to the `NativeExternalSubtitle` format.
 *
 * @param externalSubtitles - The external subtitles to parse
 * @returns The parsed external subtitles
 */
const parseExternalSubtitles = (
  externalSubtitles: ExternalSubtitle[]
): NativeVideoConfig['externalSubtitles'] => {
  return externalSubtitles.map((subtitle) => ({
    uri: subtitle.uri,
    label: subtitle.label,
    type: (subtitle.type ?? 'auto') as SubtitleType,
    language: subtitle.language ?? 'und',
  }));
};

/**
 * Creates a `VideoPlayerSource`
 *
 * @param source - The `VideoSource` to create the `VideoPlayerSource` from
 * @returns The `VideoPlayerSource` instance
 */
export const createSource = (
  source: VideoSource | VideoConfig | VideoPlayerSource
): VideoPlayerSource => {
  // If source is a VideoPlayerSource, we can directly return it
  if (isVideoPlayerSource(source)) {
    return source;
  }

  // If source is a string, we can directly create the player
  if (typeof source === 'string') {
    return createSourceFromUri(source);
  }

  // If source is a number (asset), we need to resolve the asset source and create the player
  if (typeof source === 'number') {
    return createSourceFromUri(Image.resolveAssetSource(source).uri);
  }

  // If source is an object (VideoConfig)
  if (typeof source === 'object' && 'uri' in source) {
    if (typeof source.uri === 'string') {
      return createSourceFromVideoConfig(
        source as VideoConfig & { uri: string }
      );
    }

    if (typeof source.uri === 'number') {
      const config = {
        ...source,
        // Resolve the asset source to get the URI
        uri: Image.resolveAssetSource(source.uri).uri,
      };

      return createSourceFromVideoConfig(config);
    }
  }

  throw new Error('RNV: Invalid source type');
};
