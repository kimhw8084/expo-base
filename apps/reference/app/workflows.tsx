import { useState } from 'react';
import { Alert } from 'react-native';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import {
  CommandLauncher,
  CompletionLayout,
  OfflineWorkspaceLayout,
  PermissionRationaleLayout,
  type PrecisionCommand,
} from '@precision-calm/ui';
import { Button, Card, HStack, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { useReferenceCopy } from '../ReferenceCopy';

type WorkflowView = 'offline' | 'completion' | 'permission';

/** Living specification for the Phase 5 workflow owners. */
export default function WorkflowLabScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const [view, setView] = useState<WorkflowView>('offline');
  const [launcherOpen, setLauncherOpen] = useState(false);
  const commands: readonly PrecisionCommand[] = [
    { id: 'offline', label: copy('Show offline workspace'), description: copy('Retain usable content with an honest offline status.'), shortcut: 'O', onSelect: () => setView('offline') },
    { id: 'completion', label: copy('Show completion handoff'), description: copy('End a bounded workflow with clear next actions.'), shortcut: 'C', onSelect: () => setView('completion') },
    { id: 'permission', label: copy('Show permission rationale'), description: copy('Explain an optional capability before requesting it.'), shortcut: 'P', onSelect: () => setView('permission') },
    { id: 'home', label: copy('Return home'), description: copy('Use router ownership for navigation.'), onSelect: () => router.replace('/') },
  ];

  const actions = <HStack gap="sm"><Button label={copy('Commands')} size="sm" variant="secondary" iconStart="command" testID="workflow-command-trigger" onPress={() => setLauncherOpen(true)} /><Button label={copy('Home')} size="sm" variant="ghost" onPress={() => router.replace('/')} /></HStack>;
  const content = view === 'completion'
    ? <CompletionLayout eyebrow={copy('WORKFLOW LAB')} title={copy('Import complete')} description={copy('Completion owns the handoff hierarchy, not product geometry.')} message={copy('Your file is ready for product-specific processing.')} primaryAction={<Button label={copy('View imports')} onPress={() => setView('offline')} />} secondaryAction={<Button label={copy('Start another')} variant="secondary" onPress={() => Alert.alert(copy('Product acquisition starts here.'))} />} details={<Text tone="secondary">{copy('Products supply the destination, copy, and domain result.')}</Text>} actions={actions} />
    : view === 'permission'
      ? <PermissionRationaleLayout eyebrow={copy('WORKFLOW LAB')} title={copy('Allow document access')} description={copy('The capability package owns availability and permission state; product copy owns the reason.')} message={copy('Document selection is optional. You can continue without importing a file.')} primaryAction={<Button label={copy('Choose a document')} onPress={() => Alert.alert(copy('A selected media capability would request access here.'))} />} secondaryAction={<Button label={copy('Not now')} variant="secondary" onPress={() => setView('offline')} />} actions={actions} />
      : <OfflineWorkspaceLayout eyebrow={copy('WORKFLOW LAB')} title={copy('Activity')} description={copy('Offline is honest: retained content remains visible, but write synchronization is not implied.')} actions={actions}><Card variant="elevated"><VStack gap="md"><Text variant="h2">{copy('Recent activity')}</Text><Text tone="secondary">{copy('This retained sample content represents a stale server-state result. Explicit refresh remains a product action after reconnect.')}</Text><Button label={copy('Refresh when online')} onPress={() => Alert.alert(copy('The server-state query refreshes through its shared owner.'))} /></VStack></Card></OfflineWorkspaceLayout>;

  return (
    <>
      <CommandLauncher open={launcherOpen} onOpenChange={setLauncherOpen} commands={commands} />
      <ScrollScreen>{content}</ScrollScreen>
    </>
  );
}
