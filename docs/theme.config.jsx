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
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
        rel="stylesheet"
      />
      <link
        rel="icon"
        type="image/png"
        href="https://docs.thewidlarzgroup.com/react-native-video/favicon.png"
      />
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-PM2TQQQMDN"
      />
      <script>
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-PM2TQQQMDN');`}
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
  footer: {
    text: (
      <span>
        Built with ❤️ by <strong>React Native Community</strong>
      </span>
    ),
  },
  toc: {
    extraContent: (
      <>
        <style>{`
        :is(html[class~=dark]) .extra-container {
          background-color: #87ccef;
        }
        :is(html[class~=dark]) .extra-text {
          color: #171717;
        }
        :is(html[class~=dark]) .extra-button {
          background-color: #171717;
        }
        .extra-container {
          display: flex;
          flex-direction: column;
          margin-top: 0.5rem;
          text-align: center;
          background-color: #171717;
          padding: 1rem;
          gap: 1rem;
          border-radius: 0.5rem;
        }
        .extra-text {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          font-weight: bold;
          color: #fff;
        }
        .extra-button {
          width: 100%;
          border: none;
          padding: 0.5rem 1rem;
          font-weight: 500;
          background-color: #f9d85b;
          transition: transform 0.3s ease, background-color 0.3s ease;
        }
        .extra-button:hover {
          transform: scale(1.05);
          background-color: #fff;
        }
      `}</style>
        <div className="extra-container">
          <span className="extra-text">We are TheWidlarzGroup</span>
          <a
            target="_blank"
            href="https://www.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs#Contact"
            className="extra-button"
            rel="noreferrer">
            Premium support →
          </a>
        </div>
      </>
    ),
  },

  useNextSeoProps() {
    return {
      titleTemplate: '%s – Video',
    };
  },
};
