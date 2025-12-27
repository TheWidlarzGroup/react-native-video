import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import styles from './Buttons.module.css';

const ArrowIcon = require('@site/static/img/arrow-icon.svg').default;
const GitHubIcon = require('@site/static/img/github-icon.svg').default;

interface ButtonsProps {
  docsLink: string;
  githubLink: string;
}

export function Buttons({ docsLink, githubLink }: ButtonsProps): ReactNode {
  return (
    <div className={styles.buttons}>
      <Link to={docsLink} className={styles.primary}>
        Get Started
        <ArrowIcon role="img" className={styles.icon} />
      </Link>
      <Link to={githubLink} className={styles.secondary}>
        <GitHubIcon role="img" className={styles.icon} />
        View on GitHub
      </Link>
    </div>
  );
}
