import React from 'react';
import { Enterprise } from '@site/src/components/Homepage/Enterprise/Enterprise';
import { Features } from '@site/src/components/Homepage/Features/Features';
import Layout from '@theme/Layout';
import { Hero } from '../components/Homepage/Hero/Hero';

export default function Home() {
  return (
    <Layout
      title="Cross-Platform Video Player for React Native"
      description="React Native Video — a performant, cross-platform video player for iOS, Android, and tvOS with DRM support, plugin architecture, and Nitro Modules."
    >
      <Hero />
      <main>
        <Features />
        <Enterprise />
      </main>
    </Layout>
  );
}
