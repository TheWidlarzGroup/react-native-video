import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
  type CSSProperties,
} from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {unstable_createElement} from 'react-native-web';
import type {ReactVideoProps, VideoMetadata, VideoRef} from './types';

// Define a style prop that is accepted and transformed by React Native Web
// for the native `video` element.
interface WebVideoElementProps
  extends Omit<React.ComponentProps<'video'>, 'style'> {
  style?: StyleProp<ViewStyle | CSSProperties>;
}

// Wrap the native `video` element to accept both React Native styles and CSS
// styles.
//
// See <https://necolas.github.io/react-native-web/docs/unstable-apis/#use-with-existing-react-dom-components>
function WebVideo(props: WebVideoElementProps): React.JSX.Element {
  return unstable_createElement('video', props);
}

// stolen from https://stackoverflow.com/a/77278013/21726244
const isDeepEqual = <T,>(a: T, b: T): boolean => {
  if (a === b) {
    return true;
  }

  const bothAreObjects =
    a && b && typeof a === 'object' && typeof b === 'object';

  return Boolean(
    bothAreObjects &&
      Object.keys(a).length === Object.keys(b).length &&
      Object.entries(a).every(([k, v]) => isDeepEqual(v, b[k as keyof T])),
  );
};

const Video = forwardRef<VideoRef, ReactVideoProps>(
  (
    {
      style,
      source,
      paused,
      muted,
      volume,
      rate,
      repeat,
      controls,
      showNotificationControls = false,
      poster,
      fullscreen,
      fullscreenAutorotate,
      fullscreenOrientation,
      onBuffer,
      onLoad,
      onProgress,
      onPlaybackRateChange,
      onError,
      onReadyForDisplay,
      onSeek,
      onVolumeChange,
      onEnd,
      onPlaybackStateChanged,
      onPictureInPictureStatusChanged,
    },
    ref,
  ) => {
    const nativeRef = useRef<HTMLVideoElement | null>(null);

    const isSeeking = useRef(false);
    const seek = useCallback(
      async (time: number, _tolerance?: number) => {
        if (isNaN(time)) {
          throw new Error('Specified time is not a number');
        }
        if (!nativeRef.current) {
          console.warn('Video Component is not mounted');
          return;
        }
        time = Math.max(0, Math.min(time, nativeRef.current.duration));
        nativeRef.current.currentTime = time;
        onSeek?.({seekTime: time, currentTime: nativeRef.current.currentTime});
      },
      [onSeek],
    );

    const [src, setSource] = useState(source);
    const currentSourceProp = useRef(source);
    useEffect(() => {
      if (isDeepEqual(source, currentSourceProp.current)) {
        return;
      }
      currentSourceProp.current = source;
      setSource(source);
    }, [source]);

    const pause = useCallback(() => {
      if (!nativeRef.current) {
        return;
      }
      nativeRef.current.pause();
    }, []);

    const resume = useCallback(() => {
      if (!nativeRef.current) {
        return;
      }
      nativeRef.current.play();
    }, []);

    const setVolume = useCallback((vol: number) => {
      if (!nativeRef.current) {
        return;
      }
      nativeRef.current.volume = Math.max(0, Math.min(vol, 100)) / 100;
    }, []);

    const getCurrentPosition = useCallback(async () => {
      if (!nativeRef.current) {
        throw new Error('Video Component is not mounted');
      }
      return nativeRef.current.currentTime;
    }, []);

    const unsupported = useCallback(() => {
      throw new Error('This is unsupported on the web');
    }, []);

    // Stock this in a ref to not invalidate memoization when those changes.
    const fsPrefs = useRef({
      fullscreenAutorotate,
      fullscreenOrientation,
    });
    fsPrefs.current = {
      fullscreenOrientation,
      fullscreenAutorotate,
    };

    const setFullScreen = useCallback(
      async (
        newVal: boolean,
        orientation?: ReactVideoProps['fullscreenOrientation'],
        autorotate?: boolean,
      ) => {
        orientation ??= fsPrefs.current.fullscreenOrientation;
        autorotate ??= fsPrefs.current.fullscreenAutorotate;

        try {
          if (newVal) {
            await nativeRef.current?.requestFullscreen({
              navigationUI: 'hide',
            });
            if (orientation === 'all' || !orientation || autorotate) {
              screen.orientation.unlock();
            } else {
              await screen.orientation.lock(orientation);
            }
          } else {
            if (document.fullscreenElement) {
              await document.exitFullscreen();
            }
            screen.orientation.unlock();
          }
        } catch (e) {
          // Changing fullscreen status without a button click is not allowed so it throws.
          // Some browsers also used to throw when locking screen orientation was not supported.
          console.error('Could not toggle fullscreen/screen lock status', e);
        }
      },
      [],
    );

    useEffect(() => {
      setFullScreen(
        fullscreen || false,
        fullscreenOrientation,
        fullscreenAutorotate,
      );
    }, [
      setFullScreen,
      fullscreen,
      fullscreenAutorotate,
      fullscreenOrientation,
    ]);

    const presentFullscreenPlayer = useCallback(
      () => setFullScreen(true),
      [setFullScreen],
    );
    const dismissFullscreenPlayer = useCallback(
      () => setFullScreen(false),
      [setFullScreen],
    );

    const enterPictureInPicture = useCallback(() => {
      try {
        if (!nativeRef.current) {
          console.error('Video Component is not mounted');
        } else {
          nativeRef.current.requestPictureInPicture();
        }
      } catch (e) {
        console.error(e);
      }
    }, []);

    const exitPictureInPicture = useCallback(() => {
      if (
        nativeRef.current &&
        nativeRef.current === document.pictureInPictureElement
      ) {
        try {
          document.exitPictureInPicture();
        } catch (e) {
          console.error(e);
        }
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        seek,
        setSource,
        pause,
        resume,
        setVolume,
        getCurrentPosition,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        setFullScreen,
        save: unsupported,
        enterPictureInPicture,
        exitPictureInPicture,
        restoreUserInterfaceForPictureInPictureStopCompleted: unsupported,
        nativeHtmlVideoRef: nativeRef,
      }),
      [
        seek,
        setSource,
        pause,
        resume,
        unsupported,
        setVolume,
        getCurrentPosition,
        nativeRef,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        setFullScreen,
        enterPictureInPicture,
        exitPictureInPicture,
      ],
    );

    useEffect(() => {
      if (paused) {
        pause();
      } else {
        resume();
      }
    }, [paused, pause, resume]);
    useEffect(() => {
      if (volume === undefined || isNaN(volume)) {
        return;
      }
      setVolume(volume);
    }, [volume, setVolume]);

    // we use a ref to prevent triggerring the useEffect when the component rerender with a non-stable `onPlaybackStateChanged`.
    const playbackStateRef = useRef(onPlaybackStateChanged);
    playbackStateRef.current = onPlaybackStateChanged;
    useEffect(() => {
      // Not sure about how to do this but we want to wait for nativeRef to be initialized
      setTimeout(() => {
        if (!nativeRef.current) {
          return;
        }

        // Set play state to the player's value (if autoplay is denied)
        // This is useful if our UI is in a play state but autoplay got denied so
        // the video is actually in a paused state.
        playbackStateRef.current?.({
          isPlaying: !nativeRef.current.paused,
          isSeeking: isSeeking.current,
        });
      }, 500);
    }, []);

    useEffect(() => {
      if (!nativeRef.current || rate === undefined) {
        return;
      }
      nativeRef.current.playbackRate = rate;
    }, [rate]);

    useEffect(() => {
      if (
        typeof onPictureInPictureStatusChanged !== 'function' ||
        !nativeRef.current
      ) {
        return;
      }
      const onEnterPip = () =>
        onPictureInPictureStatusChanged({isActive: true});
      const onLeavePip = () =>
        onPictureInPictureStatusChanged({isActive: false});

      const video = nativeRef.current;
      video.addEventListener('enterpictureinpicture', onEnterPip);
      video.addEventListener('leavepictureinpicture', onLeavePip);
      return () => {
        video.removeEventListener('enterpictureinpicture', onEnterPip);
        video.removeEventListener('leavepictureinpicture', onLeavePip);
      };
    }, [onPictureInPictureStatusChanged]);

    useMediaSession(src?.metadata, nativeRef, showNotificationControls);

    return (
      <WebVideo
        ref={nativeRef}
        src={src?.uri as string | undefined}
        muted={muted}
        autoPlay={!paused}
        controls={controls}
        loop={repeat}
        playsInline
        poster={
          typeof poster === 'object'
            ? typeof poster.source === 'object'
              ? poster.source.uri
              : undefined
            : poster
        }
        onCanPlay={() => onBuffer?.({isBuffering: false})}
        onWaiting={() => onBuffer?.({isBuffering: true})}
        onRateChange={() => {
          if (!nativeRef.current) {
            return;
          }
          onPlaybackRateChange?.({
            playbackRate: nativeRef.current?.playbackRate,
          });
        }}
        onDurationChange={() => {
          if (!nativeRef.current) {
            return;
          }
          onLoad?.({
            currentTime: nativeRef.current.currentTime,
            duration: nativeRef.current.duration,
            videoTracks: [],
            textTracks: [],
            audioTracks: [],
            naturalSize: {
              width: nativeRef.current.videoWidth,
              height: nativeRef.current.videoHeight,
              orientation: 'landscape',
            },
          });
        }}
        onTimeUpdate={() => {
          if (!nativeRef.current) {
            return;
          }
          onProgress?.({
            currentTime: nativeRef.current.currentTime,
            playableDuration: nativeRef.current.buffered.length
              ? nativeRef.current.buffered.end(
                  nativeRef.current.buffered.length - 1,
                )
              : 0,
            seekableDuration: 0,
          });
        }}
        onLoadedData={() => onReadyForDisplay?.()}
        onError={() => {
          if (!nativeRef.current?.error) {
            return;
          }
          onError?.({
            error: {
              errorString: nativeRef.current.error.message ?? 'Unknown error',
              code: nativeRef.current.error.code,
            },
          });
        }}
        onLoadedMetadata={() => {
          if (src?.startPosition) {
            seek(src.startPosition / 1000);
          }
        }}
        onPlay={() =>
          onPlaybackStateChanged?.({
            isPlaying: true,
            isSeeking: isSeeking.current,
          })
        }
        onPause={() =>
          onPlaybackStateChanged?.({
            isPlaying: false,
            isSeeking: isSeeking.current,
          })
        }
        onSeeking={() => (isSeeking.current = true)}
        onSeeked={() => {
          // only trigger this if it's from UI seek.
          // if it was triggered via ref.seek(), onSeek has already been called
          if (isSeeking.current) {
            isSeeking.current = false;
            onSeek?.({
              seekTime: nativeRef.current!.currentTime,
              currentTime: nativeRef.current!.currentTime,
            });
          }
        }}
        onVolumeChange={() => {
          if (!nativeRef.current) {
            return;
          }
          onVolumeChange?.({volume: nativeRef.current.volume});
        }}
        onEnded={onEnd}
        style={[videoStyle, style]}
      />
    );
  },
);

const videoStyle = {
  position: 'absolute',
  inset: 0,
  objectFit: 'contain',
  width: '100%',
  height: '100%',
} satisfies React.CSSProperties;

const useMediaSession = (
  metadata: VideoMetadata | undefined,
  nativeRef: RefObject<HTMLVideoElement | null>,
  showNotification: boolean,
) => {
  const isPlaying = nativeRef.current ? nativeRef.current.paused : false;
  const progress = nativeRef.current?.currentTime ?? 0;
  const duration = Number.isFinite(nativeRef.current?.duration)
    ? nativeRef.current?.duration
    : undefined;
  const playbackRate = nativeRef.current?.playbackRate ?? 1;

  const enabled = 'mediaSession' in navigator && showNotification;

  useEffect(() => {
    if (enabled) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata?.title,
        artist: metadata?.artist,
        artwork: metadata?.imageUri ? [{src: metadata.imageUri}] : undefined,
      });
    }
  }, [enabled, metadata]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const seekTo = (time: number) => {
      if (nativeRef.current) {
        nativeRef.current.currentTime = time;
      }
    };

    const seekRelative = (offset: number) => {
      if (nativeRef.current) {
        nativeRef.current.currentTime = nativeRef.current.currentTime + offset;
      }
    };

    const mediaActions: [
      MediaSessionAction,
      MediaSessionActionHandler | null,
    ][] = [
      ['play', () => nativeRef.current?.play()],
      ['pause', () => nativeRef.current?.pause()],
      [
        'seekbackward',
        (evt: MediaSessionActionDetails) =>
          seekRelative(evt.seekOffset ? -evt.seekOffset : -10),
      ],
      [
        'seekforward',
        (evt: MediaSessionActionDetails) =>
          seekRelative(evt.seekOffset ? evt.seekOffset : 10),
      ],
      ['seekto', (evt: MediaSessionActionDetails) => seekTo(evt.seekTime!)],
    ];

    for (const [action, handler] of mediaActions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // ignored
      }
    }
  }, [enabled, nativeRef]);

  useEffect(() => {
    if (enabled) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying, enabled]);
  useEffect(() => {
    if (enabled && duration !== undefined) {
      navigator.mediaSession.setPositionState({
        position: Math.min(progress, duration),
        duration,
        playbackRate: playbackRate,
      });
    }
  }, [progress, duration, playbackRate, enabled]);
};

Video.displayName = 'Video';
export default Video;
