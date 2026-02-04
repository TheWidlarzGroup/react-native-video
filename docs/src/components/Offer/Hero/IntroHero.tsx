import React from 'react';
import Link from '@docusaurus/Link';
import styles from './IntroHero.module.css';

const CONTACT_URL =
  'https://sdk.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=intro-contact&utm_id=intro&contact=true';
const URGENT_URL =
  'https://sdk.thewidlarzgroup.com/issue-booster?utm_source=rnv&utm_medium=docs&utm_campaign=intro-urgent&utm_id=intro';

export function IntroHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <p className={styles.text}>
          <code className={styles.code}>react-native-video</code> is{' '}
          <span className={styles.highlight}>community-first</span> and stays
          free to use.
        </p>
        <p className={styles.textSecondary}>
          Pro Player is an optional set of add-ons and maintainer services for
          teams that need advanced features or faster support.
        </p>
        <div className={styles.buttons}>
          <Link to={CONTACT_URL} className={styles.primaryButton}>
            Contact us
          </Link>
          <Link to={URGENT_URL} className={styles.secondaryButton}>
            I have an urgent issue
          </Link>
        </div>
      </div>
    </section>
  );
}
