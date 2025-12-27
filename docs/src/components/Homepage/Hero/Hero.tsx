import React, { useMemo, type ReactNode } from 'react';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import { Badge } from './Badge/Badge';
import { Buttons } from './Buttons/Buttons';
import { Stats } from './Stats/Stats';
import { ScrollIndicator } from './ScrollIndicator/ScrollIndicator';
import styles from './Hero.module.css';

const GITHUB_URL = 'https://github.com/TheWidlarzGroup/react-native-video';
const DEFAULT_DOCS_PATH = '/docs/v6/intro';

const STATS = [
  { value: '7k+', label: 'GitHub Stars' },
  { value: '350k+', label: 'Weekly Downloads' },
  { value: 'TWG', label: 'Company Backed' },
];

interface PreferredVersion {
  preferredVersion: { label: string; mainDocId: string; path: string } | null;
}

function useDocsLink(): string {
  const version = useDocsPreferredVersion() as PreferredVersion;

  return useMemo(() => {
    if (!version.preferredVersion) {
      return DEFAULT_DOCS_PATH;
    }
    return `${version.preferredVersion.path}/${version.preferredVersion.mainDocId}`;
  }, [version]);
}

export function Hero(): ReactNode {
  const docsLink = useDocsLink();

  return (
    <header className={styles.hero}>
      <div className={styles.content}>
        <Badge>v7 Beta Available</Badge>

        <img
          src="./img/twg-logo.png"
          alt="TheWidlarzGroup logo"
          className={styles.logo}
        />

        <h1 className={styles.title}>
          <span className={styles.titleAccent}>Video</span> for React Native
        </h1>

        <p className={styles.subtitle}>
          The most feature-rich video player for React Native. Multi-platform
          support with DRM, subtitles, and audio tracks.
        </p>

        <Buttons docsLink={docsLink} githubLink={GITHUB_URL} />
        <Stats stats={STATS} />
      </div>

      <ScrollIndicator />
    </header>
  );
}
