import Link from '@docusaurus/Link';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { useMemo, type ReactNode } from 'react';
import styles from './index.module.css';

interface PreferredVersion {
  preferredVersion: {label: string, mainDocId: string, path: string} | null;
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  const version = useDocsPreferredVersion() as PreferredVersion;

  const link = useMemo(() => {
    if (!version.preferredVersion) {
      return '/docs/v6/intro'; // Default to v6 if no version is selected
    }

    return `${version.preferredVersion.path}/${version.preferredVersion.mainDocId}`;
  }, [version]);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img src="./img/twg-logo.png" alt="TheWidlarzGroup Logo" className={styles.logo} />
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to={link}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Video player for React Native.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
