import { useState } from 'react';
import { View } from 'react-native';
import {
  AdaptiveGrid,
  AdaptiveGridItem,
  AlertBanner,
  Button,
  Card,
  Checkbox,
  HStack,
  LineChart,
  LoadingState,
  Metric,
  Page,
  PageHeader,
  RadioGroup,
  ScrollScreen,
  Section,
  StateView,
  Text,
  TextField,
  VStack,
} from '@precision-calm/ui';
import { useReferenceCopy } from '../ReferenceCopy';
import { ownerFixtures } from '../workbenchFixtures';

const trend = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 49 },
  { label: 'Mar', value: 47 },
  { label: 'Apr', value: 58 },
  { label: 'May', value: 64 },
];

export default function StateWorkbenchScreen() {
  const copy = useReferenceCopy();
  const [fieldValue, setFieldValue] = useState('Owner fixture');
  const [checked, setChecked] = useState(false);
  const [choice, setChoice] = useState('ready');
  const [feedback, setFeedback] = useState<'empty' | 'error'>('empty');

  return (
    <ScrollScreen>
      <Page
        width="dashboard"
        header={<PageHeader eyebrow={copy('CERTIFICATION WORKBENCH')} title={copy('Owner state workbench')} description={copy('Deterministic fixtures for the stable visual owners declared in golden.owner-certification.json. Use the shell theme, density, locale, and direction controls to exercise the same surface without a backend.')} />}
      >
        <Section>
          <AlertBanner tone="info" title={copy('Certification surface')} message={copy('Each fixture is queryable by owner and exercises a meaningful state family. Product routes should compose these owners rather than copy their geometry.')} />
        </Section>

        <Section>
          <Card testID="owner-workbench-fixture-registry">
            <VStack gap="sm">
              <Text variant="h3">{copy('Registered owner fixture families')}</Text>
              {ownerFixtures.map((fixture) => <View key={fixture.ownerId} testID={`${fixture.testID}-registry`} accessibilityLabel={`${fixture.ownerId} fixture; ${fixture.states.length} declared states`}><Text variant="caption">{fixture.ownerId}</Text><Text testID={`${fixture.testID}-states`} variant="micro" tone="secondary">{fixture.states.join(' · ')}</Text></View>)}
            </VStack>
          </Card>
        </Section>

        <Section>
          <AdaptiveGrid>
            {ownerFixtures.map((fixture) => (
              <AdaptiveGridItem key={fixture.ownerId}>
                <Card testID={fixture.testID}>
                  <VStack gap="sm">
                    <Text variant="h3">{fixture.ownerId}</Text>
                    <Text variant="caption" tone="secondary">{copy('Certified state family')}</Text>
                    <Text variant="micro" tone="secondary">{fixture.states.join(' · ')}</Text>
                  </VStack>
                </Card>
              </AdaptiveGridItem>
            ))}
          </AdaptiveGrid>
        </Section>

        <Section>
          <AdaptiveGrid>
            <AdaptiveGridItem>
              <Card testID="owner-workbench-components.actions-detail">
                <VStack gap="lg">
                  <Text variant="h3">{copy('Actions')}</Text>
                  <HStack gap="sm"><Button label={copy('Enabled action')} onPress={() => setFeedback('error')} /><Button label={copy('Disabled action')} disabled onPress={() => setFeedback('empty')} /></HStack>
                  <HStack gap="sm"><Button label={copy('Loading action')} loading onPress={() => setFeedback('error')} /><Button label={copy('Destructive action')} variant="danger" onPress={() => setFeedback('empty')} /></HStack>
                </VStack>
              </Card>
            </AdaptiveGridItem>

            <AdaptiveGridItem>
              <Card testID="owner-workbench-forms.text-entry-detail">
                <VStack gap="lg">
                  <Text variant="h3">{copy('Form fields')}</Text>
                  <TextField id="owner-workbench-field" label={copy('Fixture label')} value={fieldValue} onChangeText={setFieldValue} description={copy('Controlled state remains visible during certification.')} />
                  <Checkbox label={copy('Include optional state')} checked={checked} onChange={setChecked} />
                  <RadioGroup label={copy('Presentation state')} value={choice} onChange={setChoice} options={[{ value: 'ready', label: copy('Ready') }, { value: 'review', label: copy('Needs review') }]} />
                </VStack>
              </Card>
            </AdaptiveGridItem>

            <AdaptiveGridItem>
              <Card testID="owner-workbench-feedback.async-detail">
                <VStack gap="lg">
                  <Text variant="h3">{copy('Async feedback')}</Text>
                  {feedback === 'empty' ? <StateView kind="empty" title={copy('No fixture results')} message={copy('Choose a deterministic state to render the shared empty anatomy.')} actionLabel={copy('Show error')} onAction={() => setFeedback('error')} /> : <StateView kind="error" title={copy('Fixture error')} message={copy('The shared error anatomy keeps recovery visible.')} actionLabel={copy('Restore empty')} onAction={() => setFeedback('empty')} />}
                  <LoadingState label={copy('Loading fixture state')} />
                </VStack>
              </Card>
            </AdaptiveGridItem>

            <AdaptiveGridItem>
              <Card testID="owner-workbench-data.table-detail">
                <VStack gap="lg">
                  <Text variant="h3">{copy('Data summary')}</Text>
                  <Metric label={copy('Selected state')} value={choice === 'ready' ? copy('Ready') : copy('Review')} trend={checked ? copy('Optional state on') : copy('Optional state off')} />
                  <LineChart data={trend} name={copy('Deterministic owner trend')} showDataTable />
                </VStack>
              </Card>
            </AdaptiveGridItem>
          </AdaptiveGrid>
        </Section>
      </Page>
    </ScrollScreen>
  );
}
