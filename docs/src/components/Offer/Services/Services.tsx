import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Services.module.css';

const RocketIcon = require('@site/static/img/intro/rocket-icon.svg').default;
const ClockIcon = require('@site/static/img/intro/clock-icon.svg').default;

const ISSUE_BOOSTER_URL =
  'https://sdk.thewidlarzgroup.com/issue-booster?contact=true&utm_source=rnv&utm_medium=docs&utm_campaign=issue-booster&utm_id=intro';
const SUPPORT_PLAN_URL =
  'https://sdk.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=support-plan&utm_id=intro&contact=true';

export function Services() {
  return (
    <div className={styles.grid}>
      <div className={`${styles.card} ${styles.boosterCard}`}>
        <div className={styles.iconWrapper}>
          <RocketIcon className={styles.icon} />
        </div>
        <h3 className={styles.title}>Issue Booster</h3>
        <ul className={styles.list}>
          <li>A bug/crash blocks your release.</li>
          <li>We prioritize it and deliver a fix ASAP (PR/patch/release).</li>
        </ul>
        <div className={styles.miniNote}>
          <code>Include: RNV version • platform • minimal repro • logs</code>
        </div>
        <Link to={ISSUE_BOOSTER_URL} className={styles.ctaButton}>
          Start Issue Booster
        </Link>
      </div>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <ClockIcon className={styles.icon} />
        </div>
        <h3 className={styles.title}>Support plan</h3>
        <p className={styles.subtitle}>Hours / subscription</p>
        <ul className={styles.list}>
          <li>Buy hours or a monthly subscription.</li>
          <li>Use it for triage, upgrades, production issues and guidance.</li>
        </ul>
        <Link to={SUPPORT_PLAN_URL} className={styles.ctaButtonSecondary}>
          Ask about Support
        </Link>
      </div>
    </div>
  );
}
