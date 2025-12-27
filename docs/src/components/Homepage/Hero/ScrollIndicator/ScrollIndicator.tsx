import React, { type ReactNode } from 'react';
import styles from './ScrollIndicator.module.css';

interface ScrollIndicatorProps {
  label?: string;
}

export function ScrollIndicator({
  label = 'Explore',
}: ScrollIndicatorProps): ReactNode {
  return (
    <div className={styles.indicator}>
      <span>{label}</span>
      <div className={styles.line} />
    </div>
  );
}
