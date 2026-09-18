import { useState } from 'react';
import { Button, Card, FormScreen, Text, TextField, VStack } from '@expo-base/ui';

export default function Chg110SubmitScreen() {
  const [email, setEmail] = useState('reference@example.com');
  const [password, setPassword] = useState('demo');
  const [submissions, setSubmissions] = useState(0);
  const [pressCallbacks, setPressCallbacks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <FormScreen onSubmit={() => setSubmissions((current) => current + 1)}>
      <Card>
        <VStack gap="lg">
          <Text variant="h2">CHG-110 submit interaction probe</Text>
          <TextField id="chg-110-email" label="Email" value={email} onChangeText={setEmail} autoComplete="email" />
          <TextField id="chg-110-password" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          <Button
            testID="chg-110-full-submit"
            type="submit"
            label="Full width submit"
            fullWidth
            onPress={() => setPressCallbacks((current) => current + 1)}
          />
          <Button
            testID="chg-110-compact-submit"
            type="submit"
            label="Compact-full submit"
            responsiveWidth="compact-full"
            disabled={disabled}
            loading={loading}
            onPress={() => setPressCallbacks((current) => current + 1)}
          />
          <Button label={loading ? 'Stop loading' : 'Start loading'} type="button" onPress={() => setLoading((current) => !current)} />
          <Button label={disabled ? 'Enable submit' : 'Disable submit'} type="button" onPress={() => setDisabled((current) => !current)} />
          <Text testID="chg-110-submissions">Form submissions: {submissions}</Text>
          <Text testID="chg-110-press-callbacks">Submit press callbacks: {pressCallbacks}</Text>
        </VStack>
      </Card>
    </FormScreen>
  );
}
