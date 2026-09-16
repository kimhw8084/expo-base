import '../unistyles';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { ExpoBaseWebAccessibilityStyles } from '@expo-base/ui';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <ExpoBaseWebAccessibilityStyles />
      </head>
      <body>{children}</body>
    </html>
  );
}
