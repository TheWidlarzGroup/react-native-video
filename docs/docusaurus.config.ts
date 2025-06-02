import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'React Native Video',
  tagline: 'React Native Video - Video player for React Native',
  favicon: 'img/favicon.ico',

  url: 'https://docs.thewidlarzgroup.com',
  baseUrl: '/react-native-video',

  organizationName: 'TheWidlarzGroup',
  projectName: 'react-native-video',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/twg-social-card.png',
    navbar: {
      title: 'React Native Video',
      logo: {
        alt: 'React Native Video Logo',
        style: {
          width: '60px',
          height: '40px',
          marginRight: '10px',
          transform: 'translateY(-4px)',
        },
        src: 'img/twg-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://www.thewidlarzgroup.com/react-native-video',
          label: 'Offer',
          position: 'right',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    docs: {
      sidebar: {
        hideable: false,
      },
      versionPersistence: 'localStorage',
    },
    footer: {
      style: 'light',
      copyright: `Copyright © ${new Date().getFullYear()} TheWidlarzGroup & React Native Video Community`,
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    require.resolve('docusaurus-lunr-search'),
    [
      'docusaurus-plugin-typedoc',
      {
        name: 'API Reference',
        entryPoints: ['../packages/react-native-video/src'],
        exclude: "../packages/react-native-video/src/index.ts",
        tsconfig: '../packages/react-native-video/tsconfig.json',
        out: './docs/react-native-video/api-reference',
        watch: process.env.TYPEDOC_WATCH,
        excludePrivate: true,
        excludeProtected: true,
        excludeExternals: true,
        excludeInternal: true,
        readme: "none",
        sidebar: {
          autoConfiguration: false,
        },
        parametersFormat: "table",
        enumMembersFormat: "table",
        useCodeBlocks: true,
      },
    ],
  ],
};

export default config;
