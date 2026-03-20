import React from 'react';
import styles from './PlatformsList.module.css';

type Platform =
  | 'Android'
  | 'iOS'
  | 'visionOS'
  | 'tvOS'
  | 'Windows UWP'
  | 'Web'
  | 'All';

interface Platforms {
  types: Platform[];
}

function PlatformsList({ types }: Platforms) {
  return (
    <p className={styles.paragraphStyle}>
      {types.length === 1 && !types.includes('All')
        ? 'Platform:'
        : 'Platforms:'}
      <span className={styles.spanStyle}>{' ' + types.join(' | ')}</span>
    </p>
  );
}

export default PlatformsList;
