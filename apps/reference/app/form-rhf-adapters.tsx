import { useState } from 'react';
import { Button, Card, FormScreen, Page, PageHeader, Section, Text, VStack } from '@expo-base/ui';
import { ControlledDateField, ControlledTextArea, createExpoBaseFormSubmit, useExpoBaseForm } from '@expo-base/form-rhf';

type AdapterProofForm = {
  effectiveDate: string;
  notes: string;
  disabledNotes: string;
};

export default function FormRHFAdaptersReferenceScreen() {
  const form = useExpoBaseForm<AdapterProofForm>({ defaultValues: { effectiveDate: '', notes: '', disabledNotes: '' } });
  const [dateBlurCount, setDateBlurCount] = useState(0);
  const [dateValueChangeCount, setDateValueChangeCount] = useState(0);
  const [textAreaBlurCount, setTextAreaBlurCount] = useState(0);
  const submit = createExpoBaseFormSubmit(form, () => {});

  return (
    <FormScreen onSubmit={submit}>
      <Page
        width="form"
        header={<PageHeader eyebrow="CHG-119" title="React Hook Form field adapters" description="A governed acceptance fixture for portable dates and multiline text." />}
      >
        <Section>
          <Card>
            <VStack gap="lg">
              <ControlledDateField
                control={form.control}
                name="effectiveDate"
                id="chg119-date"
                label="Effective date"
                required
                min="2026-01-01"
                max="2026-12-31"
                rules={{ required: 'Effective date is required.' }}
                onValueChange={() => setDateValueChangeCount((count) => count + 1)}
                onBlur={() => setDateBlurCount((count) => count + 1)}
              />
              <ControlledTextArea
                control={form.control}
                name="notes"
                id="chg119-notes"
                label="Notes"
                required
                rules={{ required: 'Notes are required.' }}
                onBlur={() => setTextAreaBlurCount((count) => count + 1)}
              />
              <ControlledTextArea
                control={form.control}
                name="disabledNotes"
                id="chg119-disabled-notes"
                label="Disabled notes"
                required
                disabled
              />
              <Button type="submit" label="Validate adapter form" onPress={submit} testID="chg119-submit" />
              <VStack gap="xs">
                <Text testID="chg119-date-value">{form.watch('effectiveDate')}</Text>
                <Text testID="chg119-notes-value">{form.watch('notes')}</Text>
                <Text testID="chg119-date-touched">{String(Boolean(form.formState.touchedFields.effectiveDate))}</Text>
                <Text testID="chg119-notes-touched">{String(Boolean(form.formState.touchedFields.notes))}</Text>
                <Text testID="chg119-date-blur-count">{dateBlurCount}</Text>
                <Text testID="chg119-date-value-change-count">{dateValueChangeCount}</Text>
                <Text testID="chg119-text-area-blur-count">{textAreaBlurCount}</Text>
              </VStack>
            </VStack>
          </Card>
        </Section>
      </Page>
    </FormScreen>
  );
}
