import React from 'react';
import {View} from 'react-native';
import TestRenderer, {act} from 'react-test-renderer';

import Video from '../../../src/Video';

jest.mock('../../../src/specs/VideoNativeComponent', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const {View: MockView} =
    jest.requireActual<typeof import('react-native')>('react-native');

  const NativeVideoMock = ReactActual.forwardRef<
    React.ElementRef<typeof View>,
    React.ComponentProps<typeof View>
  >((props, ref) => <MockView ref={ref} {...props} testID="native-video" />);
  NativeVideoMock.displayName = 'NativeVideoMock';

  return {
    __esModule: true,
    default: NativeVideoMock,
  };
});

jest.mock('../../../src/specs/NativeVideoManager', () => ({
  __esModule: true,
  default: {},
}));

describe('Video', () => {
  it('applies pointerEvents to the wrapper view', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = TestRenderer.create(<Video pointerEvents="none" />);
    });

    if (!renderer) {
      throw new Error('Video renderer was not created');
    }

    const nativeVideo = renderer.root.findByProps({testID: 'native-video'});
    const wrapper = renderer.root.findAllByType(View)[0];

    expect(wrapper.props.pointerEvents).toBe('none');
    expect(nativeVideo.props.pointerEvents).toBeUndefined();
  });
});
