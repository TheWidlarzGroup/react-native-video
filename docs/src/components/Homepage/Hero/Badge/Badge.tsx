import React, { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { itemVariants } from '../Hero';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
}

export function Badge({ children }: BadgeProps) {
  return (
    <motion.div className={styles.badge} variants={itemVariants}>
      <motion.span
        className={styles.dot}
        animate={{ opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
      />
      {children}
    </motion.div>
  );
}
