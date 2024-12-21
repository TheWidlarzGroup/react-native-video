import React from 'react';
import styles from './TWGBadge.module.css';

interface TWGBadgeProps {
  visibleOnLarge?: boolean;
}

const TWGBadge = ({visibleOnLarge}: TWGBadgeProps) => {
  const visibilityClass = visibleOnLarge
    ? styles.visibleOnLarge
    : styles.visibleOnSmall;

  return (
    <div className={[styles.extraContainer, visibilityClass].join(' ')}>
      <span className={styles.extraText}>We are TheWidlarzGroup</span>
      <a
        target="_blank"
        href="https://www.thewidlarzgroup.com/?utm_source=rnv&utm_medium=docs#Contact"
        className={styles.extraButton}
        rel="noreferrer">
        Premium support →
      </a>
    </div>
  );
};

export default TWGBadge;
