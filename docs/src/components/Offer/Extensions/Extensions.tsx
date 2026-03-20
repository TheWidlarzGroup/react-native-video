import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Extensions.module.css';

const DownloadIcon =
  require('@site/static/img/intro/download-icon.svg').default;
const TemplateIcon =
  require('@site/static/img/intro/template-icon.svg').default;
const CustomIcon = require('@site/static/img/intro/custom-icon.svg').default;

const PRO_ADDONS_URL =
  'https://sdk.thewidlarzgroup.com/showcases?utm_source=rnv&utm_medium=docs&utm_campaign=pro-addons&utm_id=intro';
const BOILERPLATES_URL =
  'https://sdk.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=boilerplates&utm_id=intro&contact=true';
const CUSTOM_URL =
  'https://sdk.thewidlarzgroup.com/ask-for-plugin?utm_source=rnv&utm_medium=docs&utm_campaign=custom-extension&utm_id=intro';

export function Extensions() {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.proCard}`}>
          <div className={styles.iconWrapper}>
            <DownloadIcon className={styles.icon} />
          </div>
          <h3 className={styles.title}>Pro add-ons for RNV</h3>
          <ul className={styles.list}>
            <li>Offline Video SDK</li>
            <li>Chapters / Custom UI</li>
          </ul>
          <Link to={PRO_ADDONS_URL} className={styles.ctaButton}>
            Explore add-ons
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <TemplateIcon className={styles.icon} />
          </div>
          <h3 className={styles.title}>Boilerplates</h3>
          <ul className={styles.list}>
            <li>Video Feed starter (free baseline)</li>
            <li>Netflix-style downloads UI starter</li>
          </ul>
          <Link to={BOILERPLATES_URL} className={styles.ctaButtonSecondary}>
            View boilerplates
          </Link>
        </div>
      </div>

      <div className={styles.callout}>
        <CustomIcon className={styles.calloutIcon} />
        <div className={styles.calloutContent}>
          <p className={styles.calloutText}>
            <strong>Need something specific?</strong> We can extend boilerplates
            and add-ons to match your product.
          </p>
          <Link to={CUSTOM_URL} className={styles.calloutLink}>
            Request an extension →
          </Link>
        </div>
      </div>
    </div>
  );
}
