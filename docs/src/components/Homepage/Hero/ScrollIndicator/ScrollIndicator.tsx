import React, { type ReactNode } from 'react';
import { motion } from 'motion/react';
import styles from './ScrollIndicator.module.css';

interface ScrollIndicatorProps {
  label?: string;
}

export function ScrollIndicator({
  label = 'Explore',
}: ScrollIndicatorProps): ReactNode {
  return (
    <motion.div
      className={styles.indicator}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: [0.5, 1, 0.5],
        y: [0, 10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.6,
      }}
    >
      <span>{label}</span>
      <div className={styles.line} />
    </motion.div>
  );
}
