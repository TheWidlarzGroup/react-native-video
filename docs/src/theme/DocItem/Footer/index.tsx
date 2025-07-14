import type { WrapperProps } from '@docusaurus/types';
import TWGBadge from '@site/src/components/TWGBadge/TWGBadge';
import Footer from '@theme-original/DocItem/Footer';
import type FooterType from '@theme/DocItem/Footer';
import { type ReactNode } from 'react';

type Props = WrapperProps<typeof FooterType>;

export default function FooterWrapper(props: Props): ReactNode {
  return (
    <>
      <Footer {...props} />
      <TWGBadge visibleOnLarge={false} />
    </>
  );
}
