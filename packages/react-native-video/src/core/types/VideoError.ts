export type LibraryError =
  | 'library/deallocated'
  | 'library/application-context-not-found';

export type PlayerError =
  | 'player/not-initialized'
  | 'player/asset-not-initialized'
  | 'player/invalid-source';

export type SourceError =
  | 'source/invalid-uri'
  | 'source/missing-read-file-permission'
  | 'source/file-does-not-exist'
  | 'source/failed-to-initialize-asset';

export type VideoViewError = 'view/not-found';

export type UnknownError = 'unknown/unknown';

export type VideoErrorCode =
  | LibraryError
  | PlayerError
  | SourceError
  | VideoViewError
  | UnknownError;

export class VideoError<TCode extends VideoErrorCode> extends Error {
  private readonly _code: TCode;
  private readonly _message: string;

  public get code(): TCode {
    return this._code;
  }
  public get message(): string {
    return this._message;
  }

  /**
   * @internal
   */
  constructor(code: TCode, message: string) {
    super(`[${code}]: ${message}`);
    super.name = `[ReactNativeVideo] ${code}`;
    super.message = message;
    this._code = code;
    this._message = message;
  }

  public toString(): string {
    let string = `[${this.code}]: ${this.message}`;
    return string;
  }
}

export class VideoComponentError extends VideoError<VideoViewError> {}

export class VideoRuntimeError extends VideoError<
  LibraryError | PlayerError | SourceError | UnknownError
> {}

/**
 * Check if the message contains code and message
 */
const getCodeAndMessage = (
  message: string
): { code: string; message: string } | null => {
  // (...){%@(match[1])::(match[2]);@%}(...)
  const regex = /\{%@([^:]+)::([^@]+)@%\}/;
  const match = message.match(regex);

  if (
    match &&
    match.length === 3 &&
    typeof match[1] === 'string' &&
    typeof match[2] === 'string'
  ) {
    return {
      code: match[1],
      message: match[2],
    };
  }
  return null;
};

const isVideoError = (
  error: unknown
): error is { code: string; message: string } =>
  typeof error === 'object' &&
  error != null &&
  // @ts-expect-error error is still unknown
  typeof error.message === 'string' &&
  // @ts-expect-error error is still unknown
  getCodeAndMessage(error.message) != null;
/**
 * Tries to parse an error coming from native to a typed JS camera error.
 * @param {VideoError} nativeError The native error instance. This is a JSON in the legacy native module architecture.
 * @returns A {@linkcode VideoRuntimeError} or {@linkcode VideoComponentError}, or the `nativeError` itself if it's not parsable
 * @method
 */
export const tryParseNativeVideoError = <T>(
  nativeError: T
): (VideoRuntimeError | VideoComponentError) | T => {
  if (isVideoError(nativeError)) {
    const result = getCodeAndMessage(nativeError.message);

    if (result == null) {
      return nativeError;
    }

    const { code, message } = result;

    if (code.startsWith('view')) {
      return new VideoComponentError(code as VideoViewError, message);
    }

    // @ts-expect-error the code is string, we narrow it down to TS union.
    return new VideoRuntimeError(code, message);
  }

  return nativeError;
};
