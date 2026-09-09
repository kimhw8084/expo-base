import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ListRow } from '@precision-calm/data-display';
import { SearchField } from '@precision-calm/forms';
import { Dialog } from '@precision-calm/overlays';
import { Text, VStack } from '@precision-calm/primitives';

export interface PrecisionCommand {
  id: string;
  label: string;
  description?: string | undefined;
  group?: string | undefined;
  shortcut?: string | undefined;
  disabled?: boolean | undefined;
  destructive?: boolean | undefined;
  onSelect: () => void;
}

export interface CommandLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: readonly PrecisionCommand[];
  title?: string | undefined;
  shortcut?: string | undefined;
}

/**
 * A controlled, local command launcher. It intentionally has no global command
 * bus: products decide which commands are available at their navigation shell.
 */
export function CommandLauncher({ open, onOpenChange, commands, title = 'Command launcher', shortcut = 'k' }: CommandLauncherProps) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => commands.filter((command) => {
    const source = `${command.label} ${command.description ?? ''} ${command.group ?? ''}`.toLocaleLowerCase();
    return !normalized || source.includes(normalized);
  }), [commands, normalized]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const host = globalThis as typeof globalThis & {
      addEventListener?: (name: string, listener: (event: { key?: string; metaKey?: boolean; ctrlKey?: boolean; preventDefault?: () => void }) => void) => void;
      removeEventListener?: (name: string, listener: (event: { key?: string; metaKey?: boolean; ctrlKey?: boolean; preventDefault?: () => void }) => void) => void;
    };
    if (!host.addEventListener || !host.removeEventListener) return undefined;
    const onKeyDown = (event: { key?: string; metaKey?: boolean; ctrlKey?: boolean; preventDefault?: () => void }) => {
      if ((event.metaKey || event.ctrlKey) && event.key?.toLocaleLowerCase() === shortcut.toLocaleLowerCase()) {
        event.preventDefault?.();
        onOpenChange(true);
      }
    };
    host.addEventListener('keydown', onKeyDown);
    return () => host.removeEventListener?.('keydown', onKeyDown);
  }, [onOpenChange, shortcut]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={`Press Command or Control + ${shortcut.toUpperCase()} to open this launcher.`}>
      <VStack gap="md">
        <SearchField
          id="precision-command-search"
          label="Search commands"
          value={query}
          onChangeText={setQuery}
          onKeyPress={(event) => {
            const key = event.nativeEvent.key ?? (event as unknown as { key?: string }).key;
            if (key !== 'Escape' && key !== 'Esc') return;
            event.preventDefault();
            event.stopPropagation();
            onOpenChange(false);
          }}
          placeholder="Search commands"
          autoFocus
        />
        <View style={styles.results} accessibilityRole="list" role="list" accessibilityLabel="Available commands" aria-label="Available commands">
          {matches.map((command) => (
            <ListRow
              key={command.id}
              title={command.label}
              subtitle={command.description}
              testID={`command-result-${command.id}`}
              disclosure={false}
              disabled={Boolean(command.disabled)}
              trailing={command.shortcut ? <Text variant="caption" tone={command.destructive ? 'negative' : 'tertiary'}>{command.shortcut}</Text> : undefined}
              onPress={() => { if (command.disabled) return; onOpenChange(false); command.onSelect(); }}
            />
          ))}
          {matches.length === 0 ? <Text tone="secondary" align="center">No matching commands.</Text> : null}
        </View>
      </VStack>
    </Dialog>
  );
}

const styles = StyleSheet.create((theme) => ({
  results: { minWidth: 0, maxHeight: theme.componentMetrics.dialogMaxWidth },
}));
