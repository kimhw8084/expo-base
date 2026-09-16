import { AsyncStateView, Button, Dialog, FormScreen, TextField } from '@expo-base/ui';
import { useExpoBaseAsyncAction } from '@expo-base/runtime';
import { expoBaseQueryKey, useExpoBaseQuery } from '@expo-base/server-state';

export function Example() {
  const save = useExpoBaseAsyncAction(async () => undefined);
  useExpoBaseQuery({ key: expoBaseQueryKey.list('projects'), query: async () => [] });
  return <FormScreen><TextField id="name" label="Name" value="" onChangeText={() => {}} /><Button label="Save" loading={save.state.status === 'loading'} onPress={() => { void save.run(); }} /><Dialog open={false} title="Discard changes?" onOpenChange={() => {}}><AsyncStateView state="success" /></Dialog></FormScreen>;
}
