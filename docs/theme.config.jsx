import React from 'react';

export default {
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
