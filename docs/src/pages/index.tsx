import React, { type ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Enterprise } from '@site/src/components/Homepage/Enterprise/Enterprise';
import { Features } from '@site/src/components/Homepage/Features/Features';
import Layout from '@theme/Layout';
import { Hero } from '../components/Homepage/Hero/Hero';

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Video player for React Native."
    >
      <Hero />
      <main>
        <Features />
        <Enterprise />
      </main>
    </Layout>
  );
}
