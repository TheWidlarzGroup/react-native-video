import React from 'react';
import Link from '@docusaurus/Link';
import { motion } from 'motion/react';
import { itemVariants } from '../Hero';
import styles from './Buttons.module.css';

const ArrowIcon = require('@site/static/img/arrow-icon.svg').default;
const GitHubIcon = require('@site/static/img/github-icon.svg').default;

interface ButtonsProps {
  docsLink: string;
  githubLink: string;
}

export function Buttons({ docsLink, githubLink }: ButtonsProps) {
  return (
    <motion.div className={styles.buttons} variants={itemVariants}>
      <Link to={docsLink} className={styles.primary}>
        Get Started
        <ArrowIcon role="img" className={styles.icon} />
      </Link>
      <Link to={githubLink} className={styles.secondary}>
        <GitHubIcon role="img" className={styles.icon} />
        View on GitHub
      </Link>
    </motion.div>
  );
}
