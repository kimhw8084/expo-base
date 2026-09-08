import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@precision-calm/components';
import { BottomSheet } from '@precision-calm/overlays';
import { VStack } from '@precision-calm/primitives';

export interface FilterDrawerProps {
  title?: string;
  activeCount?: number;
  children: ReactNode;
  onClear?: (() => void) | undefined;
  triggerLabel?: string;
  testID?: string | undefined;
}

/** A shared filter-workflow composition for dense browse screens; products retain filter values and query parameters. */
export function FilterDrawer({ title = 'Filters', activeCount = 0, children, onClear, triggerLabel = 'Filters', testID }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const label = activeCount > 0 ? `${triggerLabel} (${activeCount})` : triggerLabel;
  return (
    <>
      <Button label={label} variant="secondary" size="sm" iconStart="filter" onPress={() => setOpen(true)} {...(testID ? { testID } : {})} />
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={title}
        footer={(
          <View style={styles.actions}>
            {onClear ? <Button label="Clear filters" variant="ghost" responsiveWidth="compact-full" onPress={onClear} /> : null}
            <Button label="Apply filters" responsiveWidth="compact-full" onPress={() => setOpen(false)} />
          </View>
        )}
      >
        <View role="form" accessibilityLabel={title} style={styles.content}>{children}</View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { minWidth: 0 },
  actions: { minWidth: 0, flexDirection: { compact: 'column-reverse', medium: 'row' }, justifyContent: 'flex-end', gap: theme.spacing.sm },
}));
