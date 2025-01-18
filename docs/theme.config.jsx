import React from 'react';
import TWGBadge from './components/TWGBadge/TWGBadge';

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
        type="image/png"
        href="https://docs.thewidlarzgroup.com/react-native-video/favicon.png"
      />
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-4YEWQH5ZHS"
      />
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4YEWQH5ZHS');
        `}
      </script>
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
        Built with ❤️ by <strong>React Native Community</strong>
      </span>
    ),
  },

  useNextSeoProps() {
    return {
      titleTemplate: '%s – Video',
    };
  },
};
