import React, { type ReactNode } from 'react';
import styles from './Feature.module.css';

export interface FeatureItem {
  title: string;
  Icon: React.ComponentType<React.ComponentProps<'svg'>>;
  description: string;
}

export function Feature({ title, Icon, description }: FeatureItem): ReactNode {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <Icon role="img" className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
