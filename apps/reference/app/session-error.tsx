import { Screen, StateView } from '@expo-base/ui';
import { useExpoBaseAuth } from '@expo-base/runtime';
export default function SessionErrorScreen() {
  const auth = useExpoBaseAuth();
  return <Screen><StateView kind="error" title="Session could not be restored" message="Your protected information is still hidden. Retry the secure session check." actionLabel="Retry" actionLoading={auth.actionStatus === 'refreshing'} onAction={() => { void auth.refresh(); }} /></Screen>;
}
