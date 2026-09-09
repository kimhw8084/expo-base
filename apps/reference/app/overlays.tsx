import { useState } from 'react';
import { ActionMenu, BottomSheet, Dialog, useOverlayManager } from '@precision-calm/ui';
import { Page, PageHeader, ScrollScreen, Section } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { ReferenceBackAction } from '../ReferenceBackAction';
import { useReferenceCopy } from '../ReferenceCopy';

export default function OverlayReferenceScreen() {
  const manager = useOverlayManager();
  const copy = useReferenceCopy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [longSheetOpen, setLongSheetOpen] = useState(false);

  return (
    <ScrollScreen>
      <Page width="standard" header={<PageHeader eyebrow={copy('GATE 07 / OVERLAYS')} title={copy('Overlay Manager acceptance surface')} description={copy('Anchored surfaces measure their real window position, flip when necessary, clamp to safe viewport bounds, and share exclusive lifecycle ownership.')} actions={<ReferenceBackAction />} />}>
        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">{copy('Anchored popover')}</Text>
              <Text tone="secondary">{copy('The trigger is measured with measureInWindow after render. The panel remains invisible until both anchor and content geometry are known, preventing a random first-frame jump.')}</Text>
              <HStack gap="sm">
                <ActionMenu
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  anchor={<Button testID="overlay-action-menu-trigger" label={copy('Open action menu')} variant="secondary" iconEnd="chevronDown" onPress={() => setMenuOpen(true)} />}
                  accessibilityLabel="Card actions"
                  testID="card-action-menu"
                  sections={[
                    {
                      key: 'general',
                      label: 'General',
                      items: [
                        { key: 'edit', label: 'Edit card', icon: 'edit', shortcut: 'E', onPress: () => manager.showToast('Edit selected') },
                        { key: 'duplicate', label: 'Duplicate setup', icon: 'copy', shortcut: 'D', onPress: () => manager.showToast('Setup duplicated') },
                        { key: 'archive', label: 'Archive', icon: 'archive', onPress: () => manager.showToast('Archived') },
                      ],
                    },
                    {
                      key: 'danger',
                      label: 'Danger zone',
                      items: [
                        { key: 'remove', label: 'Remove', icon: 'trash', destructive: true, onPress: () => setAlertOpen(true) },
                      ],
                    },
                  ]}
                />
                <Badge label="Collision-aware" tone="positive" />
              </HStack>
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">{copy('Dialog / alert / sheet hierarchy')}</Text>
              <HStack gap="sm">
                <Button label={copy('Open dialog')} onPress={() => setDialogOpen(true)} />
                <Button label={copy('Open destructive alert')} variant="danger" onPress={() => setAlertOpen(true)} />
                <Button label={copy('Open bottom sheet')} variant="secondary" onPress={() => setSheetOpen(true)} />
                <Button label={copy('Open long sheet')} variant="outline" onPress={() => setLongSheetOpen(true)} />
                <Button label={copy('Show toast')} variant="outline" onPress={() => manager.showToast(copy('Saved successfully'))} />
              </HStack>
            </VStack>
          </Card>
        </Section>
      </Page>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={copy('Review this recommendation')} description={copy('Standard dialogs may dismiss through the backdrop or Escape/back.')} actions={<HStack gap="sm"><Button label={copy('Cancel')} variant="ghost" onPress={() => setDialogOpen(false)} /><Button label={copy('Review')} onPress={() => { setDialogOpen(false); manager.showToast(copy('Review opened')); }} /></HStack>} />
      <Dialog open={alertOpen} onOpenChange={setAlertOpen} title="Remove this configuration?" description="Alert dialogs require explicit action and do not dismiss on backdrop." kind="alert" dismissOnBackdrop={false} actions={<HStack gap="sm"><Button label="Cancel" variant="secondary" onPress={() => setAlertOpen(false)} /><Button label="Remove" variant="danger" onPress={() => { setAlertOpen(false); manager.showToast('Configuration removed'); }} /></HStack>} />
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Quick actions"><Button label="Compare cards" fullWidth variant="secondary" onPress={() => { setSheetOpen(false); manager.showToast('Compare selected'); }} /><Button label="Plan bonus" fullWidth variant="secondary" onPress={() => { setSheetOpen(false); manager.showToast('Plan selected'); }} /><Button label="Close" fullWidth variant="ghost" onPress={() => setSheetOpen(false)} /></BottomSheet>
      <BottomSheet open={longSheetOpen} onOpenChange={setLongSheetOpen} title="Scrollable sheet acceptance">
        {Array.from({ length: 14 }, (_, index) => (
          <Card key={index}>
            <VStack gap="xs">
              <Text variant="label">Acceptance item {index + 1}</Text>
              <Text tone="secondary">Long sheets own their scroll behavior instead of clipping content at the viewport boundary.</Text>
            </VStack>
          </Card>
        ))}
        <Button label="Finish long-sheet review" fullWidth onPress={() => setLongSheetOpen(false)} />
      </BottomSheet>
    </ScrollScreen>
  );
}
