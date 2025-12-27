import React, { useMemo, type ReactNode } from 'react';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import { motion, type Variants } from 'motion/react';
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

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const logoVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

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
      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Badge>v7 Beta Available</Badge>

        <motion.img
          src="./img/twg-logo.png"
          alt="TheWidlarzGroup logo"
          className={styles.logo}
          variants={logoVariants}
        />

        <motion.h1 className={styles.title} variants={itemVariants}>
          <span className={styles.titleAccent}>Video</span> for React Native
        </motion.h1>

        <motion.p className={styles.subtitle} variants={itemVariants}>
          The most feature-rich video player for React Native. Multi-platform
          support with DRM, subtitles, and audio tracks.
        </motion.p>

        <Buttons docsLink={docsLink} githubLink={GITHUB_URL} />
        <Stats stats={STATS} />
      </motion.div>

      <ScrollIndicator />
    </header>
  );
}
