import { Screen, StateView } from '@precision-calm/ui';
import { usePrecisionAuth } from '@precision-calm/runtime';
export default function SessionErrorScreen() {
  const auth = usePrecisionAuth();
  return <Screen><StateView kind="error" title="Session could not be restored" message="Your protected information is still hidden. Retry the secure session check." actionLabel="Retry" onAction={() => { void auth.refresh(); }} /></Screen>;
}
