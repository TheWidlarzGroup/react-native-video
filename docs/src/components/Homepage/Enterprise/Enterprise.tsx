import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { FeatureCard, type FeatureCardItem } from './FeatureCard/FeatureCard';
import styles from './Enterprise.module.css';

const ArrowIcon = require('@site/static/img/arrow-icon.svg').default;
const LayersIcon =
  require('@site/static/img/homepage/enterprise/layers-icon.svg').default;
const ShieldIcon =
  require('@site/static/img/homepage/enterprise/shield-icon.svg').default;
const LightningIcon =
  require('@site/static/img/homepage/enterprise/lightning-icon.svg').default;

const CONTACT_URL =
  'https://www.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs&utm_campaign=landing-enterprise-solutions&utm_id=enterprise#Contact';

const FEATURE_LIST: FeatureCardItem[] = [
  {
    title: 'Custom Integration',
    description: 'Custom solutions for your specific requirements',
    Icon: LayersIcon,
  },
  {
    title: 'Dedicated Support',
    description: 'Priority support with direct access to our team',
    Icon: ShieldIcon,
  },
  {
    title: 'Expert Consultation',
    description: 'Architecture guidance and best practices',
    Icon: LightningIcon,
  },
];

export function Enterprise(): ReactNode {
  return (
    <section className={styles.enterprise}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <span className={styles.label}>Enterprise Solutions</span>
            <h2 className={styles.title}>
              Need custom integration or support?
            </h2>
            <p className={styles.description}>
              Our team provides enterprise-grade integration services, custom
              development, and dedicated support to help you build the perfect
              video solution for your business.
            </p>
            <Link
              to={CONTACT_URL}
              className={styles.ctaButton}
              target="_blank"
              rel="noreferrer"
            >
              Get in touch
              <ArrowIcon className={styles.arrowIcon} />
            </Link>
          </div>
          <div className={styles.featuresList}>
            {FEATURE_LIST.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
