import { Image, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  VideoPlayerSource,
  VideoPlayerSourceFactory,
} from '../../spec/nitro/VideoPlayerSource.nitro';
import type {
  CmcdData,
  ExternalSubtitle,
  NativeVideoConfig,
  SubtitleType,
  VideoConfig,
  VideoSource,
} from '../types/VideoConfig';
import {
  tryParseNativeVideoError,
  VideoRuntimeError,
} from '../types/VideoError';
import { isVideoPlayerSource } from './sourceUtils';

const VideoPlayerSourceFactory =
  NitroModules.createHybridObject<VideoPlayerSourceFactory>(
    'VideoPlayerSourceFactory'
  );

/**
 * Creates a `VideoPlayerSource` instance from a URI (string).
 *
 * @param uri - The URI of the video to play
 * @returns The `VideoPlayerSource` instance
 */
export const createSourceFromUri = (uri: string) => {
  if (!uri || typeof uri !== 'string') {
    throw new Error('RNV: Invalid source. The URI must be a non-empty string.');
  }

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
  if (!config.uri || typeof config.uri !== 'string') {
    throw new VideoRuntimeError('source/invalid-uri', 'Invalid source URI');
  }

  // Never write defaults back into the caller's object: useVideoPlayer keys the player
  // on JSON.stringify(source), so mutating a config the caller keeps around (a module
  // constant, a useMemo/useState value) would change that key on the next render and
  // destroy and recreate the player.
  const { externalSubtitles, drm, cmcd, ...rest } = config;
  const nativeConfig: NativeVideoConfig = {
    ...rest,
    // Set default value for initializeOnCreation (true)
    initializeOnCreation: config.initializeOnCreation ?? true,
  };

  if (externalSubtitles) {
    nativeConfig.externalSubtitles = parseExternalSubtitles(externalSubtitles);
  }

  const nativeCmcd = parseCmcd(cmcd);
  if (nativeCmcd) {
    nativeConfig.cmcd = nativeCmcd;
  }

  if (drm) {
    // Ensure platform-based default for DRM type if DRM is provided without a type
    const type =
      drm.type ??
      Platform.select({
        android: 'widevine',
        ios: 'fairplay',
        default: undefined,
      });
    nativeConfig.drm = type ? { ...drm, type } : drm;
  }

  try {
    return VideoPlayerSourceFactory.fromVideoConfig(nativeConfig);
  } catch (error) {
    throw tryParseNativeVideoError(error);
  }
};

/**
 * Turns the public `cmcd` option into what native expects: `true` means the standard keys
 * as a query parameter, and custom keys are formatted as CMCD pairs here, because only JS
 * knows whether a value was a string (quoted) or a number.
 */
const parseCmcd = (cmcd: VideoConfig['cmcd']): NativeVideoConfig['cmcd'] => {
  if (!cmcd) {
    return undefined;
  }
  if (cmcd === true) {
    return { mode: 'query' };
  }

  const format = (data?: CmcdData) => {
    const pairs = Object.entries(data ?? {})
      // CMCD has no way to write NaN or Infinity, so a key with such a value is left out.
      .filter(
        ([, value]) => typeof value !== 'number' || Number.isFinite(value)
      )
      .map(([key, value]) =>
        typeof value === 'number'
          ? `${key}=${value}`
          : `${key}="${String(value).replace(/(["\\])/g, '\\$1')}"`
      );
    return pairs.length > 0 ? pairs : undefined;
  };

  const native: NonNullable<NativeVideoConfig['cmcd']> = {
    mode: cmcd.mode ?? 'query',
  };
  const request = format(cmcd.request);
  const session = format(cmcd.session);
  const object = format(cmcd.object);
  const status = format(cmcd.status);
  if (request) native.requestData = request;
  if (session) native.sessionData = session;
  if (object) native.objectData = object;
  if (status) native.statusData = status;
  return native;
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
    const resolvedSource = Image.resolveAssetSource(source);
    if (!resolvedSource?.uri || typeof resolvedSource.uri !== 'string') {
      throw new VideoRuntimeError('source/invalid-uri', 'Invalid source URI');
    }
    return createSourceFromUri(resolvedSource.uri);
  }

  // If source is an object (VideoConfig)
  if (typeof source === 'object' && source !== null && 'uri' in source) {
    if (typeof source.uri === 'string') {
      return createSourceFromVideoConfig(
        source as VideoConfig & { uri: string }
      );
    }

    if (typeof source.uri === 'number') {
      const resolvedSource = Image.resolveAssetSource(source.uri);
      if (!resolvedSource?.uri || typeof resolvedSource.uri !== 'string') {
        throw new VideoRuntimeError('source/invalid-uri', 'Invalid source URI');
      }

      const config = {
        ...source,
        uri: resolvedSource.uri,
      };

      return createSourceFromVideoConfig(config);
    }

    throw new VideoRuntimeError('source/invalid-uri', 'Invalid source URI');
  }

  throw new VideoRuntimeError('player/invalid-source', 'Invalid source');
};
