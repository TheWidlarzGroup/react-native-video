import React from 'react';
import styles from './V7OpenSource.module.css';

export function V7OpenSource() {
  return (
    <div className={styles.container}>
      <p className={styles.text}>
        The library remains <strong>community-first</strong> - the core
        functionality will stay free and open source, just like today.
      </p>
      <p className={styles.text}>
        There is a set of paid plugins and services that enhance the
        functionality.
      </p>
    </div>
  );
}
