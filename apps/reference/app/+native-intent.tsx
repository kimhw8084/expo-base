import { linking } from '../linking';

/** Native-only system-path rewriting. Never throw from this Expo Router hook. */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    return linking.redirectIncoming(path, { initial });
  } catch {
    return '/link-error';
  }
}
