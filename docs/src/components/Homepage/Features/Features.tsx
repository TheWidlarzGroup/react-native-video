import React, { type ReactNode } from 'react';
import { Feature, type FeatureItem } from './Feature/Feature';
import styles from './Features.module.css';

const FEATURE_LIST: FeatureItem[] = [
  {
    title: 'React Native First',
    Icon: require('@site/static/img/homepage/features/reactjs-icon.svg')
      .default,
    description:
      'Built specifically for React Native with a native-first approach. Seamless integration with your existing React Native projects.',
  },
  {
    title: 'Multi-Platform',
    Icon: require('@site/static/img/homepage/features/platforms-icon.svg')
      .default,
    description:
      'iOS, Android, tvOS, visionOS, Vega OS, Web, and Windows. One API across all platforms with platform-specific optimizations.',
  },
  {
    title: 'Subtitles & Audio',
    Icon: require('@site/static/img/homepage/features/subtitles-icon.svg')
      .default,
    description:
      'Full support for multiple subtitle formats and audio tracks. Switch between languages on the fly.',
  },
  {
    title: 'DRM Protected',
    Icon: require('@site/static/img/homepage/features/shield-icon.svg').default,
    description:
      'Industry-standard DRM support including Widevine, FairPlay, and PlayReady for secure content delivery.',
  },
  {
    title: 'High Performance',
    Icon: require('@site/static/img/homepage/features/performance-icon.svg')
      .default,
    description:
      'Optimized native players under the hood. Smooth playback with minimal memory footprint.',
  },
  {
    title: 'Plugin System',
    Icon: require('@site/static/img/homepage/features/plugins-icon.svg')
      .default,
    description:
      'Extensible architecture with a powerful plugin system. Add custom functionality without forking.',
  },
];

export function Features(): ReactNode {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Features</span>
          <h2 className={styles.title}>
            Everything you need for video playback
          </h2>
          <p className={styles.subtitle}>
            A comprehensive video solution trusted by thousands of developers
            worldwide
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURE_LIST.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
