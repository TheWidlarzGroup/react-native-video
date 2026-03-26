import React from 'react';
import Link from '@docusaurus/Link';
import styles from './OfferCards.module.css';

const CommunityIcon =
  require('@site/static/img/intro/community-icon.svg').default;
const SupportIcon = require('@site/static/img/intro/support-icon.svg').default;
const ExtensionsIcon =
  require('@site/static/img/intro/extensions-icon.svg').default;

interface Badge {
  label: string;
  variant?: 'accent' | 'secondary' | 'pro';
}

interface OfferCard {
  title: string;
  description: string;
  Icon: React.ComponentType<React.ComponentProps<'svg'>>;
  badges?: Badge[];
  linkText: string;
  linkHref: string;
  variant?: 'default' | 'highlight';
}

const CARDS: OfferCard[] = [
  {
    title: 'Community',
    description:
      'Access comprehensive documentation, browse code examples, and get help through GitHub issues and community discussions. Support is best-effort based on maintainer availability and community engagement.',
    Icon: CommunityIcon,
    linkText: 'Get started',
    linkHref: 'https://github.com/react-native-video/react-native-video',
    variant: 'default',
  },
  {
    title: 'Maintainer support',
    description:
      'Get priority assistance directly from the core maintainers when you need faster response times than community support can provide. Available as one-time fixes or ongoing partnerships.',
    Icon: SupportIcon,
    badges: [
      { label: 'Issue Booster', variant: 'secondary' },
      { label: 'Support plan', variant: 'accent' },
    ],
    linkText: 'See services',
    linkHref: '#services',
    variant: 'highlight',
  },
  {
    title: 'Extensions',
    description:
      'Enhance your video implementation with optional building blocks: offline playback capabilities, chapters navigation, custom UI components, and production-ready starter templates.',
    Icon: ExtensionsIcon,
    badges: [
      { label: 'Offline Video', variant: 'pro' },
      { label: 'Chapters / Custom UI', variant: 'pro' },
      { label: 'Boilerplates', variant: 'accent' },
    ],
    linkText: 'See extensions',
    linkHref: '#extensions',
    variant: 'default',
  },
];

function OfferCard({
  title,
  description,
  Icon,
  badges,
  linkText,
  linkHref,
  variant = 'default',
}: OfferCard) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.iconWrapper}>
        <Icon className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {badges && badges.length > 0 && (
        <div className={styles.badges}>
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`${styles.badge} ${styles[`badge${badge.variant?.charAt(0).toUpperCase()}${badge.variant?.slice(1)}`]}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
      <Link to={linkHref} className={styles.link}>
        {linkText}
        <span className={styles.arrow}>→</span>
      </Link>
    </div>
  );
}

export function OfferCards() {
  return (
    <div className={styles.grid}>
      {CARDS.map((card) => (
        <OfferCard key={card.title} {...card} />
      ))}
    </div>
  );
}
