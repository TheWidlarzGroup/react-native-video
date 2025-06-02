import Heading from '@theme/Heading';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'React Native First',
    Svg: require('@site/static/img/reactjs-icon.svg').default,
    description: (
      <>
        React Native Video is a video player created for React Native.
      </>
    ),
  },
  {
    title: 'Multi Subtitles & Audio Tracks',
    Svg: require('@site/static/img/download-icon.svg').default,
    description: (
      <>
        React Native Video supports multiple subtitles and audio tracks.
      </>
    ),
  },
  {
    title: 'DRM Protected Content',
    Svg: require('@site/static/img/drm-content-icon.svg').default,
    description: (
      <>
        React Native Video supports DRM protected content.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
