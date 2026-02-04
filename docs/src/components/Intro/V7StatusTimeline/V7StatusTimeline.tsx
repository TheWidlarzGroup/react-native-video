import React from 'react';
import styles from './V7StatusTimeline.module.css';

const STATUS_POINTS = [
  {
    label: 'v7 was rewritten from scratch',
    description: 'to deliver a stable, modern API.',
  },
  {
    label: 'Public version (alpha → beta)',
    description:
      'is available for testing - your feedback really impacts the final release.',
  },
  {
    label: 'Public roadmap includes new features',
    description: 'and improvements planned for upcoming releases.',
  },
];

export function V7StatusTimeline() {
  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {STATUS_POINTS.map((point) => (
          <li key={point.label} className={styles.item}>
            <strong>{point.label}</strong> {point.description}
          </li>
        ))}
      </ul>

      <div className={styles.timeline}>
        <div className={styles.step}>
          <span className={`${styles.dot} ${styles.completed}`} />
          <span className={styles.label}>Alpha</span>
        </div>
        <div className={styles.line} />
        <div className={styles.step}>
          <span className={`${styles.dot} ${styles.active}`} />
          <span className={styles.label}>Beta</span>
        </div>
        <div className={styles.line} />
        <div className={`${styles.step} ${styles.upcoming}`}>
          <span className={styles.dot} />
          <span className={styles.label}>Stable</span>
        </div>
      </div>
    </div>
  );
}
