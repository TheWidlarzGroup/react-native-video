import React from 'react';
import Link from '@docusaurus/Link';
import styles from './V7ProPlugins.module.css';

export function V7ProPlugins() {
  return (
    <div className={styles.container}>
      {/* Offline Video SDK */}
      <div className={`${styles.plugin} ${styles.pro}`}>
        <h3 className={styles.title}>Offline Video SDK</h3>
        <p className={styles.description}>
          Download and play video content offline with full DRM support. Perfect
          for apps that need content available without an internet connection -
          streaming platforms, educational apps, or any app where users want to
          watch videos on the go.
        </p>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <strong>HLS/DASH/MP4 downloading</strong> - download and store
            streams for offline playback
          </div>
          <div className={styles.featureItem}>
            <strong>Offline DRM</strong> - play DRM-protected content offline
            with proper license handling
          </div>
          <div className={styles.featureItem}>
            <strong>Multiple audio tracks & subtitles</strong> - download
            specific language tracks to optimize storage
          </div>
          <div className={styles.featureItem}>
            <strong>Background download management</strong> - queuing, progress
            tracking, retries, pause/resume
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.platforms}>iOS, Android</span>
          <Link
            to="https://www.thewidlarzgroup.com/offline-video-sdk?utm_source=rnv&utm_medium=docs&utm_campaign=intro&utm_id=offline-video-sdk"
            className={styles.link}
          >
            Learn more →
          </Link>
        </div>
      </div>

      {/* Background Uploader */}
      <div className={`${styles.plugin} ${styles.accent}`}>
        <h3 className={styles.title}>Background Uploader</h3>
        <p className={styles.description}>
          Upload files in the background with enterprise-grade reliability.
          Ideal for apps that handle user-generated content - social media,
          video sharing platforms, or any app where users upload large files.
        </p>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <strong>Background uploading</strong> - continue uploads even when
            the app is in the background
          </div>
          <div className={styles.featureItem}>
            <strong>Retry support</strong> - automatic retries with exponential
            backoff
          </div>
          <div className={styles.featureItem}>
            <strong>Progress tracking</strong> - real-time upload progress
            monitoring
          </div>
          <div className={styles.featureItem}>
            <strong>Queue management</strong> - handle multiple uploads with
            priority control
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.platforms}>iOS, Android</span>
          <Link
            to="https://sdk.thewidlarzgroup.com/background-uploader?utm_source=rnv&utm_medium=docs&utm_campaign=intro&utm_id=background-uploader"
            className={styles.link}
          >
            Learn more →
          </Link>
        </div>
      </div>

      {/* Chapters */}
      <div className={`${styles.plugin} ${styles.secondary}`}>
        <h3 className={styles.title}>Chapters</h3>
        <p className={styles.description}>
          Add chapter markers to your video player for easy navigation between
          segments. Great for educational content, tutorials, podcasts, or any
          long-form video where users need to jump to specific sections.
        </p>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <strong>Visual markers</strong> - chapter points displayed on the
            seekbar
          </div>
          <div className={styles.featureItem}>
            <strong>Tooltip support</strong> - show chapter titles when
            hovering/tapping markers
          </div>
          <div className={styles.featureItem}>
            <strong>Programmatic navigation</strong> - jump to chapters via API
          </div>
          <div className={styles.featureItem}>
            <strong>Customizable styling</strong> - control marker colors and
            appearance
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.platforms}>iOS, Android</span>
          <Link
            to="https://sdk.thewidlarzgroup.com/chapters?utm_source=rnv&utm_medium=docs&utm_campaign=intro&utm_id=chapters"
            className={styles.link}
          >
            Learn more →
          </Link>
        </div>
      </div>

      {/* Custom CTA */}
      <div className={styles.customCta}>
        <div className={styles.customContent}>
          <h4 className={styles.customTitle}>Need something specific?</h4>
          <p className={styles.customText}>
            We can build any video-related plugin for your requirements. Our
            team maintains
            <code>react-native-video</code> and knows the codebase inside out.
          </p>
        </div>
        <Link
          to="https://sdk.thewidlarzgroup.com/ask-for-plugin?utm_source=rnv&utm_medium=docs&utm_campaign=intro&utm_id=ask-for-plugin"
          className={styles.customButton}
        >
          Request a custom plugin
        </Link>
      </div>
    </div>
  );
}
