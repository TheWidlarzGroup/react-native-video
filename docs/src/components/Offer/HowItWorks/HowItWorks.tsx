import React from 'react';
import styles from './HowItWorks.module.css';

interface FlowLine {
  label: string;
  steps: string[];
  variant: 'community' | 'booster' | 'support';
  highlight?: boolean;
}

const FLOWS: FlowLine[] = [
  {
    label: 'Community Support',
    steps: [
      'Search docs & examples',
      'Post issue / discussion',
      'Wait for community response',
    ],
    variant: 'community',
  },
  {
    label: 'Issue Booster',
    steps: [
      'Submit bug report with repro',
      'Maintainer prioritizes & fixes',
      'Receive patch/PR/release',
    ],
    variant: 'booster',
    highlight: true,
  },
  {
    label: 'Support Plan',
    steps: [
      'Define your needs & scope',
      'Get ongoing maintainer access',
      'Ship with confidence',
    ],
    variant: 'support',
  },
];

function FlowLine({ label, steps, variant, highlight }: FlowLine) {
  return (
    <div
      className={`${styles.flowLine} ${styles[variant]} ${highlight ? styles.highlight : ''}`}
    >
      <span className={styles.flowLabel}>{label}</span>
      <span className={styles.arrow}>→</span>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <span
            className={`${styles.step} ${index === steps.length - 1 && highlight ? styles.stepHighlight : ''}`}
          >
            {step}
          </span>
          {index < steps.length - 1 && <span className={styles.arrow}>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <div className={styles.container}>
      <div className={styles.flows}>
        {FLOWS.map((flow) => (
          <FlowLine key={flow.label} {...flow} />
        ))}
      </div>
      <p className={styles.note}>
        Most users only need the community path - the other options exist for
        teams with tighter deadlines or advanced requirements.
      </p>
    </div>
  );
}
