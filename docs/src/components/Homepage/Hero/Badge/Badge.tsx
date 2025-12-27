import React, { type ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
}

export function Badge({ children }: BadgeProps): ReactNode {
  return (
    <div className={styles.badge}>
      <span className={styles.dot} />
      {children}
    </div>
  );
}
