import React, { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { itemVariants } from '../Hero';
import styles from './Stats.module.css';

interface StatItem {
  value: string;
  label: string;
}

interface StatsProps {
  stats: StatItem[];
}

export function Stats({ stats }: StatsProps): ReactNode {
  return (
    <motion.div className={styles.stats} variants={itemVariants}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.stat}>
          <span className={styles.value}>{stat.value}</span>
          <span className={styles.label}>{stat.label}</span>
        </div>
      ))}
    </motion.div>
  );
}
