import { Alert } from 'react-native';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { FormScreen, Page, PageHeader, Section } from '@precision-calm/ui';
import { Button, Card, Link, Tag } from '@precision-calm/ui';
import { Checkbox, CurrencyField, FormActions, FormSection, PasswordField, RadioGroup, SearchField, SelectField, SwitchField, TextArea, TextField } from '@precision-calm/ui';
import { ControlledCheckbox, ControlledPasswordField, ControlledTextField, usePrecisionForm } from '@precision-calm/form-rhf';
import { HStack, Text, VStack } from '@precision-calm/ui';

type DemoForm = { name: string; email: string; password: string; terms: boolean };

export default function FormsReferenceScreen() {
  const router = usePrecisionRouter();
  const form = usePrecisionForm<DemoForm>({ defaultValues: { name: '', email: '', password: '', terms: false } });
  const submit = form.handleSubmit((values) => Alert.alert('Validated form', JSON.stringify(values, null, 2)));

  return <FormScreen><Page width="form" header={<PageHeader eyebrow="GATE 05 / FORMS" title="Form interaction acceptance surface" description="Keyboard-aware scrolling, visible labels, deterministic focus, validation messaging, semantic selection controls, and a React Hook Form adapter that remains outside the visual component package." actions={<Button label="Back" variant="secondary" iconStart="arrowLeft" onPress={() => router.back()} />} />}>
    <Section><Card><FormSection title="Production form adapter" description="This form uses the isolated React Hook Form adapter; visual fields remain state-library agnostic.">
      <ControlledTextField control={form.control} name="name" rules={{ required: 'Enter your name.' }} id="demo-name" label="Full name" required placeholder="Alex Morgan" autoComplete="name" textContentType="name" returnKeyType="next" submitBehavior="submit" />
      <ControlledTextField control={form.control} name="email" rules={{ required: 'Enter your email.', pattern: { value: /.+@.+\..+/, message: 'Enter a valid email address.' } }} id="demo-email" label="Email address" required placeholder="alex@example.com" autoCapitalize="none" autoCorrect={false} autoComplete="email" inputMode="email" textContentType="emailAddress" returnKeyType="next" submitBehavior="submit" />
      <ControlledPasswordField control={form.control} name="password" rules={{ required: 'Create a password.', minLength: { value: 10, message: 'Use at least 10 characters.' } }} id="demo-password" label="Password" required description="At least 10 characters." returnKeyType="done" submitBehavior="blurAndSubmit" />
      <ControlledCheckbox control={form.control} name="terms" rules={{ validate: (value) => value || 'Accept the terms to continue.' }} label="I agree to the terms" description="Required for the reference validation flow." />
      <FormActions secondary={<Button label="Reset" variant="ghost" onPress={() => form.reset()} />} primary={<Button label="Validate form" loading={form.formState.isSubmitting} onPress={submit} />} />
    </FormSection></Card></Section>

    <Section><Text variant="h2">State-library-agnostic controls</Text><Card><FormSection title="Field taxonomy" description="These controls can be used with React Hook Form, another state library, or direct controlled state without changing their visual API.">
      <StaticFieldExamples />
    </FormSection></Card></Section>
  </Page></FormScreen>;
}

function StaticFieldExamples() {
  const noop = () => undefined;
  return <VStack gap="xl">
    <TextField id="plain" label="Text field" value="Travel setup" onChangeText={noop} description="Default field anatomy." iconStart="edit" />
    <SearchField id="search" label="Search" value="" onChangeText={noop} placeholder="Search cards, banks, rewards…" />
    <PasswordField id="password-static" label="Password visibility" value="demonstration" onChangeText={noop} />
    <CurrencyField id="currency" label="Credit limit" value="12500" onChangeText={noop} description="Decimal keyboard intent is declared by the field." />
    <TextField id="invalid" label="Invalid field" value="" onChangeText={noop} error="This field demonstrates the persistent error state." required />
    <SelectField id="issuer" label="Issuer" value="capital-one" onChange={noop} options={[{ value: 'amex', label: 'American Express' }, { value: 'capital-one', label: 'Capital One' }, { value: 'chase', label: 'Chase' }, { value: 'citi', label: 'Citi' }]} description="This dropdown uses the shared collision-aware Overlay Manager." />
    <TextArea id="notes" label="Notes" value="A multiline control with a semantic minimum height and no feature-owned geometry." onChangeText={noop} />
    <Checkbox label="Include annual fees" checked onChange={noop} description="Checkbox rows use the same focus and press language." />
    <RadioGroup label="Sort cards" value="newest" onChange={noop} options={[{ value: 'newest', label: 'Newest first' }, { value: 'value', label: 'Highest value', description: 'Uses estimated net value.' }]} />
    <SwitchField label="Bonus notifications" value onChange={noop} description="Uses the native switch control inside system-owned spacing." />
    <HStack gap="sm"><Tag label="Valid" tone="positive" icon="check" /><Tag label="Needs review" tone="warning" icon="warning" /><Link label="Accessibility guidance" iconEnd="externalLink" onPress={() => Alert.alert('Guidance', 'Documentation route will be wired during the docs gate.')} /></HStack>
  </VStack>;
}
