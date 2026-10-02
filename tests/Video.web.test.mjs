/* global globalThis */

import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import videoModule from '../lib/Video.web.js';

Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {},
});

const Video = videoModule.default;

const renderVideo = (resizeMode) =>
  renderToStaticMarkup(
    React.createElement(Video, {
      paused: true,
      resizeMode,
      source: {uri: 'video.mp4'},
    }),
  );

describe('Video web resizeMode', () => {
  const cases = [
    ['contain', 'contain'],
    ['cover', 'cover'],
    ['stretch', 'fill'],
    ['none', 'contain'],
  ];

  for (const [resizeMode, objectFit] of cases) {
    it(`maps ${resizeMode} to object-fit: ${objectFit}`, () => {
      assert.match(
        renderVideo(resizeMode),
        new RegExp(`object-fit:${objectFit}`),
      );
    });
  }
});
