import React from 'react';
import styles from './FeatureCard.module.css';

export interface FeatureCardItem {
  title: string;
  description: string;
  Icon: React.ComponentType<React.ComponentProps<'svg'>>;
}

export function FeatureCard({ title, description, Icon }: FeatureCardItem) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <Icon role="img" className={styles.icon} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}
