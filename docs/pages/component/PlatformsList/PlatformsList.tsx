import React from 'react';
import styles from './PlatformsList.module.css';

type Platform = 'Android' | 'iOS' | 'visionOS' | 'tvOS' | 'Windows UWP' | 'All';

interface Platforms {
  types: Platform[];
}

function PlatformsList({types}: Platforms) {
  return (
    <p className={styles.paragraphStyle}>
      Platforms:
      <span className={styles.spanStyle}>{' ' + types.join(' | ')}</span>
    </p>
  );
}

export default PlatformsList;
