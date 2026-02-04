import React from 'react';
import styles from './V7FeatureCards.module.css';

interface FeatureCard {
  title: string;
  description: string;
  badge?: string;
  wide?: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Player ≠ View',
    description:
      'Playback logic is separated from the UI component - the player can exist independently from the view.',
  },
  {
    title: 'Preloading',
    description:
      'Prepare the player in advance before showing video to the user.',
    badge: 'In our tests: 6x faster loading',
  },
  {
    title: 'Better resource management',
    description:
      'The new separation unlocks better resource management and enables feed/video list scenarios.',
  },
  {
    title: 'Performance',
    description:
      'Fewer FPS drops during player creation - we focused on one of the biggest pain points.',
  },
  {
    title: 'Nitro Modules + New Architecture',
    description:
      'Nitro is the foundation of v7: more performance and stability plus easier support for both New and Old Architecture.',
    wide: true,
  },
];

function FeatureCard({ title, description, badge, wide }: FeatureCard) {
  return (
    <div className={`${styles.card} ${wide ? styles.wide : ''}`}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
  );
}

export function V7FeatureCards() {
  return (
    <div className={styles.grid}>
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
}
