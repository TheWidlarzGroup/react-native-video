import React from 'react';
import styles from './V7Lead.module.css';

export function V7Lead() {
  return (
    <div className={styles.lead}>
      <p className={styles.text}>
        <code className={styles.code}>react-native-video</code> v7 is the
        biggest change in the library's history: we rebuilt it from the ground
        up to be modern, stable, and ready for React Native's future.
      </p>
      <p className={styles.textSecondary}>
        The most important foundation of v7 is the separation of player logic
        from the view component and support for Nitro Modules - unlocking
        preloading, real performance improvements, and full compatibility with
        React Native's new architecture.
      </p>
    </div>
  );
}
