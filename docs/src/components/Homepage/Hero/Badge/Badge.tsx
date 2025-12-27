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
      <span className={styles.dot} />
      {children}
    </motion.div>
  );
}
