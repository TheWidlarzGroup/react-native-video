import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Migration.module.css';

const MigrationIcon =
  require('@site/static/img/intro/migration-icon.svg').default;

const MIGRATION_URL =
  'https://sdk.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=migration&utm_id=intro&contact=true';

export function Migration() {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <MigrationIcon className={styles.icon} />
      </div>
      <div className={styles.content}>
        <p className={styles.description}>
          We help teams migrate from other video player alternatives - both{' '}
          <span className={styles.highlight}>open-source</span> (including RNV
          v6 to v7) and{' '}
          <span className={styles.highlightSecondary}>commercial</span>{' '}
          solutions - to reduce licensing costs and gain full control over your
          video stack.
        </p>
        <div className={styles.badges}>
          <span className={styles.badgeOss}>From OSS players</span>
          <span className={styles.badgeCommercial}>
            From commercial players
          </span>
          <span className={styles.badgeVersion}>v6 → v7</span>
        </div>
        <Link to={MIGRATION_URL} className={styles.ctaButton}>
          Discuss migration
        </Link>
      </div>
    </div>
  );
}
