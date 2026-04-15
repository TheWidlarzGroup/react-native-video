import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { createSidebarWithCustomProps } from '@widlarzgroup/docusaurus-ui';
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

  future: {
    experimental_faster: true,
    v4: true,
  },

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
          lastVersion: '6.x',
          includeCurrentVersion: true,
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          versions: {
            'current': {
              label: 'v7 Beta',
              path: 'v7',
              banner: 'none',
            },
            '6.x': {
              label: 'v6',
              path: 'v6',
            },
          },
          sidebarItemsGenerator: createSidebarWithCustomProps,
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        'name': 'React Native Video',
        'description':
          'A cross-platform video player for React Native with DRM support, plugin architecture, and offline playback.',
        'url': 'https://github.com/TheWidlarzGroup/react-native-video',
        'codeRepository':
          'https://github.com/TheWidlarzGroup/react-native-video',
        'programmingLanguage': [
          'TypeScript',
          'Java',
          'Kotlin',
          'Swift',
          'Objective-C',
        ],
        'runtimePlatform': 'React Native',
        'license': 'https://opensource.org/licenses/MIT',
      }),
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap',
      },
    },
  ],

  themes: ['@widlarzgroup/docusaurus-ui'],

  themeConfig: {
    image: 'img/twg-social-card.png',
    metadata: [
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: 'og:site_name', content: 'React Native Video Documentation' },
    ],
    navbar: {
      title: 'React Native Video',
      logo: {
        alt: 'TheWidlarzGroup Logo',
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
          type: 'docsVersionDropdown',
          versions: {
            'current': { label: 'v7 Beta' },
            '6.x': { label: 'v6' },
          },
          position: 'right',
        },
        {
          href: 'https://github.com/TheWidlarzGroup/react-native-video',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://sdk.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=navbar&utm_id=offer-button',
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
      copyright: `Built With ❤️ By TheWidlarzGroup & React Native Video Community`,
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
        exclude: '../packages/react-native-video/src/index.ts',
        tsconfig: '../packages/react-native-video/tsconfig.json',
        out: './docs/api-reference',
        watch: process.env.TYPEDOC_WATCH,
        excludePrivate: true,
        excludeProtected: true,
        excludeExternals: true,
        excludeInternal: true,
        readme: 'none',
        sidebar: {
          autoConfiguration: false,
        },
        parametersFormat: 'table',
        enumMembersFormat: 'table',
        useCodeBlocks: true,
      },
    ],
    // LLMs txt generation for v6
    [
      'docusaurus-plugin-llms',
      {
        id: 'llms-v6',
        generateLLMsTxt: false,
        generateLLMsFullTxt: false,
        docsDir: 'versioned_docs/version-6.x',
        pathTransformation: {
          ignorePaths: ['docs'],
          addPaths: ['react-native-video/docs/v6'],
        },
        version: '6.x.x',
        customLLMFiles: [
          {
            filename: 'llms-v6.txt',
            title: 'React Native Video v6 Documentation',
            description: 'Complete documentation for React Native Video v6',
            includePatterns: ['**/*.md', '**/*.mdx'],
            fullContent: false,
          },
          {
            filename: 'llms-v6-full.txt',
            title: 'React Native Video v6 Documentation',
            description: 'Complete documentation for React Native Video v6',
            includePatterns: ['**/*.md', '**/*.mdx'],
            fullContent: true,
          },
        ],
      },
    ],
    // LLMs txt generation for v7
    [
      'docusaurus-plugin-llms',
      {
        id: 'llms-v7',
        generateLLMsTxt: false,
        generateLLMsFullTxt: false,
        docsDir: 'docs',
        pathTransformation: {
          ignorePaths: ['docs'],
          addPaths: ['react-native-video/docs/v7'],
        },
        version: '7.x.x',
        customLLMFiles: [
          {
            filename: 'llms.txt',
            title: 'React Native Video',
            description:
              'Cross-platform video player for React Native with DRM, plugins, offline playback. Supports iOS, Android, tvOS, visionOS. Built on Nitro Modules. Also available: llms-v7.txt, llms-v7-full.txt (complete v7 docs), llms-v6.txt, llms-v6-full.txt (legacy v6 docs).',
            includePatterns: ['docs/**/*.md', 'docs/**/*.mdx'],
            ignorePatterns: ['**/api-reference/**'],
            orderPatterns: [
              'docs/fundamentals/**',
              'docs/player/player.md',
              'docs/player/use-video-player.md',
              'docs/player/video-player.md',
              'docs/player/events.md',
              'docs/player/drm.md',
              'docs/video-view/**',
              'docs/plugins/**',
              'docs/player/analytics/**',
              'docs/player/downloading/**',
            ],
            includeUnmatchedLast: true,
            fullContent: false,
          },
          {
            filename: 'llms-full.txt',
            title: 'React Native Video',
            description:
              'Cross-platform video player for React Native with DRM, plugins, offline playback. Supports iOS, Android, tvOS, visionOS. Built on Nitro Modules.',
            includePatterns: ['docs/**/*.md', 'docs/**/*.mdx'],
            ignorePatterns: ['**/api-reference/**'],
            orderPatterns: [
              'docs/fundamentals/**',
              'docs/player/**',
              'docs/video-view/**',
              'docs/plugins/**',
            ],
            includeUnmatchedLast: true,
            fullContent: true,
          },
          {
            filename: 'llms-v7.txt',
            title: 'React Native Video v7 Documentation',
            description: 'Complete documentation for React Native Video v7',
            includePatterns: ['docs/**/*.md', 'docs/**/*.mdx'],
            fullContent: false,
          },
          {
            filename: 'llms-v7-full.txt',
            title: 'React Native Video v7 Documentation',
            description: 'Complete documentation for React Native Video v7',
            includePatterns: ['docs/**/*.md', 'docs/**/*.mdx'],
            fullContent: true,
          },
        ],
      },
    ],
  ],
};

export default config;
