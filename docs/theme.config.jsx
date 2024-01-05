import React from 'react';

export default {
  head: (
    <>
      <meta name="language" content="en" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="description" content="Video component for React Native" />
      <meta name="og:title" content="React Native Video" />
      <meta
        name="og:description"
        content="A Video component for React Native"
      />
      <meta
        name="og:image"
        content="https://react-native-video.github.io/react-native-video/thumbnail.jpg"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="React Native Video" />
      <meta
        name="twitter:description"
        content="A Video component for React Native"
      />
      <meta
        name="twitter:image"
        content="https://react-native-video.github.io/react-native-video/thumbnail.jpg"
      />
      <meta name="twitter:image:alt" content="React Native Video" />
    </>
  ),
  logo: (
    <span>
      🎬 <strong>Video component</strong> for React Native
    </span>
  ),
  faviconGlyph: '🎬',
  project: {
    link: 'https://github.com/react-native-video/react-native-video',
  },
  docsRepositoryBase:
    'https://github.com/react-native-video/react-native-video/tree/master/docs/',
  footer: {
    text: (
      <span>
        Built with love ❤️ by <strong>React Native Community</strong>
      </span>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Video',
    };
  },
};
