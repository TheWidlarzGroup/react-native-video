import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Contact.module.css';

const MailIcon = require('@site/static/img/intro/mail-icon.svg').default;
const CheckIcon = require('@site/static/img/intro/check-icon.svg').default;

const CONTACT_URL =
  'https://sdk.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=intro-contact-form&utm_id=intro&contact=true';

const CHECKLIST = [
  { label: 'Platform', value: 'iOS / Android' },
  { label: 'Video', value: 'HLS / DASH / MP4 (+ DRM if any)' },
  {
    label: 'Need',
    value: 'Issue Booster / Support / Offline / Custom UI / Boilerplate',
  },
  { label: 'Timeline', value: 'ASAP / planned' },
  { label: 'Repro/design link', value: '(optional)' },
];

export function Contact() {
  return (
    <div className={styles.content}>
      <div className={styles.checklist}>
        <p className={styles.intro}>When you reach out, please include:</p>
        <ul className={styles.list}>
          {CHECKLIST.map((item) => (
            <li key={item.label} className={styles.item}>
              <CheckIcon className={styles.checkIcon} />
              <span className={styles.itemLabel}>{item.label}:</span>
              <span className={styles.itemValue}>{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.cta}>
        <div className={styles.ctaIcon}>
          <MailIcon className={styles.mailIcon} />
        </div>
        <p className={styles.ctaText}>
          Ready to talk? We'll respond within 24 hours.
        </p>
        <Link to={CONTACT_URL} className={styles.ctaButton}>
          Contact us
        </Link>
      </div>
    </div>
  );
}
