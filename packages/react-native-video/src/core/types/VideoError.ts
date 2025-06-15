export type LibraryError =
  | 'library/deallocated'
  | 'library/application-context-not-found';

export type PlayerError =
  | 'player/released'
  | 'player/not-initialized'
  | 'player/asset-not-initialized'
  | 'player/invalid-source';

export type SourceError =
  | 'source/invalid-uri'
  | 'source/missing-read-file-permission'
  | 'source/file-does-not-exist'
  | 'source/failed-to-initialize-asset'
  | 'source/unsupported-content-type';

export type VideoViewError =
  | 'view/not-found'
  | 'view/deallocated'
  | 'view/picture-in-picture-not-supported';

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
  private readonly _stack?: string;

  public get code(): TCode {
    return this._code;
  }
  public get message(): string {
    return this._message;
  }

  public get stack(): string | undefined {
    return this._stack;
  }

  /**
   * @internal
   */
  constructor(code: TCode, message: string, stack?: string) {
    super(`[${code}]: ${message}`);
    super.name = `[ReactNativeVideo] ${code}`;
    super.message = message;
    super.stack = stack;
    this._code = code;
    this._message = message;
    this._stack = stack;
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

/**
 * Check if the error has a stack property
 * If it does, it will try to parse the error message in the stack trace
 * and replace it with the proper code and message
 */
const maybeFixErrorStack = (error: object) => {
  if ('stack' in error && typeof error.stack === 'string') {
    const stack = error.stack;

    // (...){%@(match[1])::(match[2]);@%}(...)
    const regex = /\{%@([^:]+)::([^@]+)@%\}/;
    const match = stack.match(regex);

    if (
      match &&
      match.length === 3 &&
      typeof match[1] === 'string' &&
      typeof match[2] === 'string'
    ) {
      error.stack = error.stack.replace(regex, `[${match[1]}]: ${match[2]}`);
    }
  }
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

const hasStack = (error: unknown): error is { stack: string } =>
  typeof error === 'object' &&
  error != null &&
  'stack' in error &&
  typeof error.stack === 'string';

/**
 * Tries to parse an error coming from native to a typed JS video error.
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

    maybeFixErrorStack(nativeError);

    if (code.startsWith('view')) {
      return new VideoComponentError(
        code as VideoViewError,
        message,
        hasStack(nativeError) ? nativeError.stack : undefined
      );
    }

    return new VideoRuntimeError(
      // @ts-expect-error the code is string, we narrow it down to TS union.
      code,
      message,
      hasStack(nativeError) ? nativeError.stack : undefined
    );
  }

  return nativeError;
};
