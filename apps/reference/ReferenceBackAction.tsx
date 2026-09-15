import { useExpoBaseRouter } from '@expo-base/navigation-router';
import { Button, ResponsiveSlot } from '@expo-base/ui';
import { useReferenceCopy } from './ReferenceCopy';

export function ReferenceBackAction() {
  const router = useExpoBaseRouter();
  const copy = useReferenceCopy();
  return (
    <ResponsiveSlot until="expanded">
      <Button label={copy('Back')} variant="secondary" iconStart="arrowLeft" onPress={() => router.backOr('/')} />
    </ResponsiveSlot>
  );
}
