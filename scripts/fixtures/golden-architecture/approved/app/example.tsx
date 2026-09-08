import { AsyncStateView, Button, Dialog, FormScreen, TextField } from '@precision-calm/ui';
import { usePrecisionAsyncAction } from '@precision-calm/runtime';
import { precisionQueryKey, usePrecisionQuery } from '@precision-calm/server-state';

export function Example() {
  const save = usePrecisionAsyncAction(async () => undefined);
  usePrecisionQuery({ key: precisionQueryKey.list('projects'), query: async () => [] });
  return <FormScreen><TextField id="name" label="Name" value="" onChangeText={() => {}} /><Button label="Save" loading={save.state.status === 'loading'} onPress={() => { void save.run(); }} /><Dialog open={false} title="Discard changes?" onOpenChange={() => {}}><AsyncStateView state="success" /></Dialog></FormScreen>;
}
