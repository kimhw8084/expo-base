import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Button, ResponsiveSlot } from '@precision-calm/ui';
import { useReferenceCopy } from './ReferenceCopy';

export function ReferenceBackAction() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  return (
    <ResponsiveSlot until="expanded">
      <Button label={copy('Back')} variant="secondary" iconStart="arrowLeft" onPress={() => router.backOr('/')} />
    </ResponsiveSlot>
  );
}
