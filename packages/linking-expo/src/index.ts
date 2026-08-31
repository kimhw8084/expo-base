import * as Linking from 'expo-linking';
import type { ExternalNavigationAdapter } from '@precision-calm/linking';

/** Expo-specific bridge. URL policy remains in @precision-calm/linking. */
export class ExpoExternalNavigationAdapter implements ExternalNavigationAdapter {
  async canOpen(url: string): Promise<boolean> {
    return Linking.canOpenURL(url);
  }
  async open(url: string): Promise<void> {
    await Linking.openURL(url);
  }
}
