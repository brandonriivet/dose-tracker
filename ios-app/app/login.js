import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../src/components/ui';
import { authErrorMessage, useAuth } from '../src/lib/auth';
import { colors, fonts } from '../src/theme';

export default function LoginScreen() {
  const { login, signup, resetPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await signup(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setInfo('');
    if (!email) {
      setError('Type your email above first, then tap "Forgot password?" again.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setInfo('Reset link sent — check that email inbox.');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.title}>Dose</Text>
          <Text style={styles.subtitle}>Your peptide &amp; supplement log.</Text>

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={styles.field}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            style={styles.field}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!info && <Text style={styles.info}>{info}</Text>}

          <Button onPress={handleSubmit} disabled={busy} style={styles.submit}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>

          {mode === 'login' && (
            <Pressable onPress={handleForgotPassword} disabled={busy} style={styles.link}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={styles.link}
          >
            <Text style={styles.switchMode}>
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  form: { width: '100%', maxWidth: 384, alignSelf: 'center' },
  title: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: { color: colors.paperDim, fontSize: 14, marginBottom: 32 },
  field: { marginBottom: 12, paddingVertical: 13 },
  error: { color: colors.coral, fontSize: 14, marginBottom: 8 },
  info: { color: colors.tealBright, fontSize: 14, marginBottom: 8 },
  submit: { marginTop: 8 },
  link: { paddingVertical: 10 },
  forgot: { color: colors.paperFaint, fontSize: 12, textAlign: 'center' },
  switchMode: { color: colors.paperDim, fontSize: 14, textAlign: 'center' },
});
