import { useState } from 'react';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { BottomSheet, Dialog, MenuGroup, MenuItem, Popover, useOverlayManager } from '@precision-calm/ui';
import { Page, PageHeader, ScrollScreen, Section } from '@precision-calm/ui';
import { Badge, Button, Card } from '@precision-calm/ui';
import { HStack, Text, VStack } from '@precision-calm/ui';

export default function OverlayReferenceScreen() {
  const router = usePrecisionRouter();
  const manager = useOverlayManager();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ScrollScreen>
      <Page width="standard" header={<PageHeader eyebrow="GATE 07 / OVERLAYS" title="Overlay Manager acceptance surface" description="Anchored surfaces measure their real window position, flip when necessary, clamp to safe viewport bounds, and share exclusive lifecycle ownership." actions={<Button label="Back" variant="secondary" iconStart="arrowLeft" onPress={router.back} />} />}>
        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">Anchored popover</Text>
              <Text tone="secondary">The trigger is measured with measureInWindow after render. The panel remains invisible until both anchor and content geometry are known, preventing a random first-frame jump.</Text>
              <HStack gap="sm">
                <Popover
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  anchor={<Button label="Open action menu" variant="secondary" iconEnd="chevronDown" onPress={() => setMenuOpen(true)} />}
                >
                  <MenuGroup>
                    <MenuItem label="Edit card" icon="edit" onPress={() => { setMenuOpen(false); manager.showToast('Edit selected'); }} />
                    <MenuItem label="Duplicate setup" icon="copy" onPress={() => { setMenuOpen(false); manager.showToast('Setup duplicated'); }} />
                    <MenuItem label="Archive" icon="archive" onPress={() => { setMenuOpen(false); manager.showToast('Archived'); }} />
                    <MenuItem label="Remove" icon="trash" destructive onPress={() => { setMenuOpen(false); setAlertOpen(true); }} />
                  </MenuGroup>
                </Popover>
                <Badge label="Collision-aware" tone="positive" />
              </HStack>
            </VStack>
          </Card>
        </Section>

        <Section>
          <Card>
            <VStack gap="lg">
              <Text variant="h3">Dialog / alert / sheet hierarchy</Text>
              <HStack gap="sm">
                <Button label="Open dialog" onPress={() => setDialogOpen(true)} />
                <Button label="Open destructive alert" variant="danger" onPress={() => setAlertOpen(true)} />
                <Button label="Open bottom sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
                <Button label="Show toast" variant="outline" onPress={() => manager.showToast('Saved successfully')} />
              </HStack>
            </VStack>
          </Card>
        </Section>
      </Page>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Review this recommendation" description="Standard dialogs may dismiss through the backdrop or Escape/back." actions={<HStack gap="sm"><Button label="Cancel" variant="ghost" onPress={() => setDialogOpen(false)} /><Button label="Review" onPress={() => { setDialogOpen(false); manager.showToast('Review opened'); }} /></HStack>} />
      <Dialog open={alertOpen} onOpenChange={setAlertOpen} title="Remove this configuration?" description="Alert dialogs require explicit action and do not dismiss on backdrop." kind="alert" dismissOnBackdrop={false} actions={<HStack gap="sm"><Button label="Cancel" variant="secondary" onPress={() => setAlertOpen(false)} /><Button label="Remove" variant="danger" onPress={() => { setAlertOpen(false); manager.showToast('Configuration removed'); }} /></HStack>} />
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Quick actions"><Button label="Compare cards" variant="secondary" onPress={() => { setSheetOpen(false); manager.showToast('Compare selected'); }} /><Button label="Plan bonus" variant="secondary" onPress={() => { setSheetOpen(false); manager.showToast('Plan selected'); }} /><Button label="Close" variant="ghost" onPress={() => setSheetOpen(false)} /></BottomSheet>
    </ScrollScreen>
  );
}
