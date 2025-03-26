import React from 'react';
import TWGBadge from './components/TWGBadge/TWGBadge';
import jsonLd from './json-ld.json';

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
        content="https://docs.thewidlarzgroup.com/react-native-video/thumbnail.jpg"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="React Native Video" />
      <meta
        name="twitter:description"
        content="A Video component for React Native"
      />
      <meta
        name="twitter:image"
        content="https://docs.thewidlarzgroup.com/react-native-video/thumbnail.jpg"
      />
      <meta name="twitter:image:alt" content="React Native Video" />
      <link
        rel="icon"
        type="image/x-icon"
        href="https://docs.thewidlarzgroup.com/react-native-video/favicon.ico"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="https://docs.thewidlarzgroup.com/react-native-video/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="https://docs.thewidlarzgroup.com/react-native-video/favicon-16x16.png"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
    </>
  ),
  logo: (
    <span>
      🎬 <strong>Video component</strong> for React Native
    </span>
  ),
  project: {
    link: 'https://github.com/TheWidlarzGroup/react-native-video',
  },
  docsRepositoryBase:
    'https://github.com/TheWidlarzGroup/react-native-video/tree/master/docs/',
  main: ({children}) => (
    <>
      {children}
      <TWGBadge visibleOnLarge={false} />
    </>
  ),
  toc: {
    extraContent: <TWGBadge visibleOnLarge={true} />,
  },
  footer: {
    text: (
      <span>
        Built with ❤️ by <strong>TheWidlarzGroup</strong> &{' '}
        <strong>React Native Community</strong>
      </span>
    ),
  },

  useNextSeoProps() {
    return {
      titleTemplate: '%s – Video',
    };
  },
};
