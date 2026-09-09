import { linking } from '../linking';

function isDevelopmentClientLaunchUrl(path: string): boolean {
  try {
    const parsed = new URL(path);
    return parsed.protocol.toLowerCase().startsWith('exp+') && parsed.hostname === 'expo-development-client';
  } catch {
    return false;
  }
}

/** Native-only system-path rewriting. Never throw from this Expo Router hook. */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (isDevelopmentClientLaunchUrl(path)) return '/';
    return linking.redirectIncoming(path, { initial });
  } catch {
    return '/link-error';
  }
}
