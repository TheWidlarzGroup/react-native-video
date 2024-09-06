import React, {useCallback, useEffect, useState} from 'react';
import {PanResponder, View} from 'react-native';
import styles from '../styles';

interface SeekerProps {
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isUISeeking: boolean;
  videoSeek: (arg0: number) => void;
}

export const Seeker = ({
  currentTime,
  duration,
  isLoading,
  isUISeeking,
  videoSeek,
}: SeekerProps) => {
  const [seeking, setSeeking] = useState(false);
  const [seekerPosition, setSeekerPosition] = useState(0);
  const [seekerWidth, setSeekerWidth] = useState(0);

  /**
   * Set the position of the seekbar's components
   * (both fill and handle) according to the
   * position supplied.
   *
   * @param {float} position position in px of seeker handle}
   */
  const updateSeekerPosition = useCallback(
    (position = 0) => {
      if (position <= 0) {
        position = 0;
      } else if (position >= seekerWidth) {
        position = seekerWidth;
      }
      setSeekerPosition(position);
    },
    [seekerWidth],
  );

  /**
   * Return the time that the video should be at
   * based on where the seeker handle is.
   *
   * @return {float} time in ms based on seekerPosition.
   */
  const calculateTimeFromSeekerPosition = () => {
    const percent = seekerPosition / seekerWidth;
    return duration * percent;
  };

  /**
   * Get our seekbar responder going
   */

  const seekPanResponder = PanResponder.create({
    // Ask to be the responder.
    onStartShouldSetPanResponder: (_evt, _gestureState) => true,
    onMoveShouldSetPanResponder: (_evt, _gestureState) => true,

    /**
     * When we start the pan tell the machine that we're
     * seeking. This stops it from updating the seekbar
     * position in the onProgress listener.
     */
    onPanResponderGrant: (evt, _gestureState) => {
      const position = evt.nativeEvent.locationX;
      updateSeekerPosition(position);
      setSeeking(true);
    },

    /**
     * When panning, update the seekbar position, duh.
     */
    onPanResponderMove: (evt, _gestureState) => {
      const position = evt.nativeEvent.locationX;
      updateSeekerPosition(position);
    },

    /**
     * On release we update the time and seek to it in the video.
     * If you seek to the end of the video we fire the
     * onEnd callback
     */
    onPanResponderRelease: (_evt, _gestureState) => {
      const time = calculateTimeFromSeekerPosition();
      if (time >= duration && !isLoading) {
        // FIXME ...
        // state.paused = true;
        // this.onEnd();
      } else {
        videoSeek(time);
        setSeeking(false);
      }
    },
  });

  useEffect(() => {
    if (!isLoading && !seeking && !isUISeeking) {
      const percent = currentTime / duration;
      const position = seekerWidth * percent;
      updateSeekerPosition(position);
    }
  }, [
    currentTime,
    duration,
    isLoading,
    seekerWidth,
    seeking,
    isUISeeking,
    updateSeekerPosition,
  ]);

  if (!seekPanResponder) {
    return null;
  }
  const seekerStyle = [
    styles.seekbarFill,
    {
      width: seekerPosition > 0 ? seekerPosition : 0,
      backgroundColor: '#FFF',
    },
  ];

  const seekerPositionStyle = [
    styles.seekbarHandle,
    {
      left: seekerPosition > 0 ? seekerPosition : 0,
    },
  ];

  const seekerPointerStyle = [styles.seekbarCircle, {backgroundColor: '#FFF'}];

  return (
    <View
      style={styles.seekbarContainer}
      {...seekPanResponder.panHandlers}
      {...styles.generalControls}>
      <View
        style={styles.seekbarTrack}
        onLayout={event => setSeekerWidth(event.nativeEvent.layout.width)}
        pointerEvents={'none'}>
        <View style={seekerStyle} pointerEvents={'none'} />
      </View>
      <View style={seekerPositionStyle} pointerEvents={'none'}>
        <View style={seekerPointerStyle} pointerEvents={'none'} />
      </View>
    </View>
  );
};
