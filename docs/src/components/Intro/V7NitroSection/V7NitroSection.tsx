import React from 'react';
import styles from './V7NitroSection.module.css';

export function V7NitroSection() {
  return (
    <div className={styles.container}>
      <p className={styles.text}>
        v7 was built on Nitro Modules, which delivers a strong boost in
        performance and stability.
      </p>
      <p className={styles.text}>
        Thanks to Nitro, it's easier to support both New and Old Architecture
        simultaneously - and faster to deliver new features.
      </p>
      <blockquote className={styles.quote}>
        Nitro enables us to support both the New and Old Architecture with
        minimal effort
      </blockquote>
    </div>
  );
}
