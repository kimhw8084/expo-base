import { Alert } from 'react-native';
import { useMemo, useState } from 'react';
import { FormScreen, Page, PageHeader, Section } from '@precision-calm/ui';
import { Badge, Button, Card, Link, Tag } from '@precision-calm/ui';
import { Checkbox, CheckboxGroup, CodeField, ComboboxField, CurrencyField, EmailField, FormActions, FormDiscardDialog, FormErrorSummary, FormRow, FormSection, FormSectionGroup, MultiSelectField, NumberField, NumberStepper, PasswordField, PhoneField, RadioGroup, SearchField, SegmentedField, SelectField, SwitchField, TextArea, TextField, UrlField } from '@precision-calm/ui';
import { ControlledCheckbox, ControlledPasswordField, ControlledTextField, createPrecisionFormKeyboardFlow, createPrecisionFormSubmit, usePrecisionForm, usePrecisionFormLifecycle, type PrecisionFormField } from '@precision-calm/form-rhf';
import { HStack, Text, VStack } from '@precision-calm/ui';
import { ReferenceBackAction } from '../ReferenceBackAction';
import { useReferenceCopy } from '../ReferenceCopy';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

type DemoForm = { name: string; email: string; password: string; terms: boolean };

export default function FormsReferenceScreen() {
  const router = usePrecisionRouter();
  const copy = useReferenceCopy();
  const demoFormFields = useMemo(() => [
    { name: 'name', label: copy('Full name') },
    { name: 'email', label: copy('Email address') },
    { name: 'password', label: copy('Password') },
    { name: 'terms', label: copy('Terms and consent') },
  ] as const satisfies readonly PrecisionFormField<DemoForm>[], [copy]);
  const form = usePrecisionForm<DemoForm>({ defaultValues: { name: '', email: '', password: '', terms: false } });
  const lifecycle = usePrecisionFormLifecycle(form, demoFormFields);
  const submit = createPrecisionFormSubmit(form, (values) => Alert.alert('Validated form', JSON.stringify(values, null, 2)));

  const keyboard = createPrecisionFormKeyboardFlow(form);
  return <FormScreen><Page width="form" header={<PageHeader eyebrow={copy('GATE 05 / FORMS')} title={copy('Form interaction acceptance surface')} description={copy('Keyboard-aware scrolling, visible labels, deterministic focus, validation summary, server-error mapping, and unsaved-change protection remain outside the visual component package.')} actions={<ReferenceBackAction />} />}>
    <Section><Card><VStack gap="xl">
      <FormErrorSummary errors={lifecycle.errors} testID="adapter-form-error-summary" />
      <FormSectionGroup testID="adapter-form-sections">
        <FormSection eyebrow={copy('IDENTITY')} title={copy('Profile information')} description={copy('Related identity fields share one responsive section while each field keeps its own validation and keyboard contract.')} accessory={<Badge label={copy('Required')} tone="info" />} testID="adapter-profile-section">
          <FormRow testID="adapter-identity-row">
            <ControlledTextField control={form.control} name="name" rules={{ required: copy('Enter your name.') }} id="demo-name" label={copy('Full name')} required placeholder="Alex Morgan" autoComplete="name" textContentType="name" {...keyboard.next('email')} />
            <ControlledTextField control={form.control} name="email" rules={{ required: copy('Enter your email.'), pattern: { value: /.+@.+\..+/, message: copy('Enter a valid email address.') } }} id="demo-email" label={copy('Email address')} required placeholder="alex@example.com" autoCapitalize="none" autoCorrect={false} autoComplete="email" inputMode="email" textContentType="emailAddress" {...keyboard.next('password')} />
          </FormRow>
        </FormSection>
        <FormSection eyebrow={copy('SECURITY')} title={copy('Account security')} description={copy('Security inputs remain visually grouped without coupling the forms package to a state library.')} accessory={<Badge label={copy('10+ characters')} tone="positive" />} testID="adapter-security-section">
          <ControlledPasswordField control={form.control} name="password" rules={{ required: copy('Create a password.'), minLength: { value: 10, message: copy('Use at least 10 characters.') } }} id="demo-password" label={copy('Password')} required description={copy('At least 10 characters.')} {...keyboard.done(submit)} />
        </FormSection>
        <FormSection eyebrow={copy('CONSENT')} title={copy('Terms and consent')} description={copy('Selection controls keep their own error and focus behavior while the section owns content hierarchy.')} testID="adapter-consent-section">
          <ControlledCheckbox control={form.control} name="terms" id="demo-terms" rules={{ validate: (value) => value || copy('Accept the terms to continue.') }} label={copy('I agree to the terms')} description={copy('Required for the reference validation flow.')} required />
        </FormSection>
      </FormSectionGroup>
      <FormActions testID="adapter-form-actions" secondary={<Button label={copy('Reset')} variant="ghost" responsiveWidth="compact-full" onPress={lifecycle.reset} />} primary={<Button label={copy('Validate form')} responsiveWidth="compact-full" loading={form.formState.isSubmitting} onPress={submit} />} />
      <HStack gap="sm"><Button label={copy('Apply server validation')} variant="outline" responsiveWidth="compact-full" onPress={() => lifecycle.applyServerErrors({ fields: { email: copy('This email address is already in use.') }, form: copy('The profile could not be saved until the highlighted field is resolved.') })} /><Button label={copy('Leave form')} variant="ghost" responsiveWidth="compact-full" onPress={() => lifecycle.leaveGuard.requestLeave(() => router.replace('/'))} /></HStack>
    </VStack></Card></Section>

    <Section><Text variant="h2">State-library-agnostic controls</Text><Card><FormSection title="Field taxonomy" description="These controls can be used with React Hook Form, another state library, or direct controlled state without changing their visual API.">
      <StaticFieldExamples />
    </FormSection></Card></Section>
  </Page><FormDiscardDialog guard={lifecycle.leaveGuard} /></FormScreen>;
}

function StaticFieldExamples() {
  const [plainValue, setPlainValue] = useState('Travel setup');
  const [searchValue, setSearchValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('demonstration');
  const [emailValue, setEmailValue] = useState('ada@example.com');
  const [urlValue, setUrlValue] = useState('https://example.com');
  const [phoneValue, setPhoneValue] = useState('+1 312 555 0199');
  const [rewardRate, setRewardRate] = useState('2,5');
  const [amount, setAmount] = useState('12500');
  const [invalidValue, setInvalidValue] = useState('');
  const [issuer, setIssuer] = useState('capital-one');
  const [networks, setNetworks] = useState<readonly string[]>(['visa']);
  const [notes, setNotes] = useState('A multiline control with a semantic minimum height and no feature-owned geometry.');
  const [includeFees, setIncludeFees] = useState(true);
  const [benefits, setBenefits] = useState<readonly string[]>(['travel']);
  const [sortCards, setSortCards] = useState('newest');
  const [density, setDensity] = useState('comfortable');
  const [bonusNotifications, setBonusNotifications] = useState(true);
  const [code, setCode] = useState('');
  const [priority, setPriority] = useState(2);
  return <VStack gap="xl">
    <TextField id="plain" label="Text field" value={plainValue} onChangeText={setPlainValue} description="Default field anatomy." iconStart="edit" />
    <SearchField id="search" label="Search" value={searchValue} onChangeText={setSearchValue} placeholder="Search cards, banks, rewards…" />
    <PasswordField id="password-static" label="Password visibility" value={passwordValue} onChangeText={setPasswordValue} />
    <FormRow><EmailField id="email-static" label="Email address" value={emailValue} onChangeText={setEmailValue} /><UrlField id="url-static" label="Portfolio URL" value={urlValue} onChangeText={setUrlValue} /></FormRow>
    <FormRow><PhoneField id="phone-static" label="Phone" value={phoneValue} onChangeText={setPhoneValue} /><NumberField id="number-static" label="Reward rate" value={rewardRate} locale="de-DE" onChangeText={setRewardRate} description="Locale separators parse through the i18n kernel." /></FormRow>
    <CurrencyField id="currency" label="Credit limit" value={amount} onChangeText={setAmount} currency="USD" description="Currency formatting waits for blur so partial entry remains intact." />
    <TextField id="invalid" label="Invalid field" value={invalidValue} onChangeText={setInvalidValue} error="This field demonstrates the persistent error state." required />
    <SelectField id="issuer" testID="static-issuer" label="Issuer" value={issuer} onChange={setIssuer} options={[{ value: 'amex', label: 'American Express' }, { value: 'capital-one', label: 'Capital One' }, { value: 'chase', label: 'Chase' }, { value: 'citi', label: 'Citi' }]} description="This dropdown uses the shared collision-aware Overlay Manager." />
    <ComboboxField id="combobox" testID="static-combobox" label="Primary issuer" value={issuer} onChange={setIssuer} options={[{ value: 'amex', label: 'American Express' }, { value: 'capital-one', label: 'Capital One' }, { value: 'chase', label: 'Chase' }, { value: 'citi', label: 'Citi' }]} description="Search, keyboard navigation, loading, empty, and retry state remain with one field owner." />
    <MultiSelectField id="networks" testID="static-networks" label="Accepted networks" values={networks} onChange={setNetworks} options={[{ value: 'visa', label: 'Visa' }, { value: 'mastercard', label: 'Mastercard' }, { value: 'amex', label: 'American Express' }]} />
    <TextArea id="notes" label="Notes" value={notes} onChangeText={setNotes} />
    <Checkbox testID="static-include-fees" label="Include annual fees" checked={includeFees} onChange={setIncludeFees} description="Checkbox rows use the same focus and press language." />
    <CheckboxGroup id="benefits" testID="static-benefits" label="Benefit categories" values={benefits} onChange={setBenefits} options={[{ value: 'travel', label: 'Travel' }, { value: 'dining', label: 'Dining' }, { value: 'credits', label: 'Credits' }]} />
    <RadioGroup testID="static-sort" label="Sort cards" value={sortCards} onChange={setSortCards} options={[{ value: 'newest', label: 'Newest first' }, { value: 'value', label: 'Highest value', description: 'Uses estimated net value.' }]} />
    <SegmentedField id="density" testID="static-density" label="Display density" value={density} onChange={setDensity} options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} />
    <SwitchField testID="static-notifications" label="Bonus notifications" value={bonusNotifications} onChange={setBonusNotifications} description="Uses the native switch control inside system-owned spacing." />
    <NumberStepper id="priority" testID="static-priority" label="Review priority" value={priority} minimum={1} maximum={5} onChange={setPriority} description="A bounded adjustment stays touch-safe without a product-local button pair." />
    <CodeField id="verification-code" testID="static-verification-code" label="Verification code" value={code} onChangeText={setCode} description="Paste and sequential focus work through the shared provider-neutral code entry owner." />
    <HStack gap="sm"><Tag label="Valid" tone="positive" icon="check" /><Tag label="Needs review" tone="warning" icon="warning" /><Link label="Accessibility guidance" iconEnd="externalLink" onPress={() => Alert.alert('Guidance', 'Documentation route will be wired during the docs gate.')} /></HStack>
  </VStack>;
}
