import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';

export function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpMessage, setSignedUpMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSignedUpMessage(null);
    setSubmitting(true);
    const result = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'sign-up') {
      setSignedUpMessage('Account created. Check your email to confirm it, then sign in.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pawswipe</Text>
      <Text style={styles.subtitle}>
        {mode === 'sign-in' ? 'Sign in to keep swiping' : 'Create an account'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {signedUpMessage ? <Text style={styles.success}>{signedUpMessage}</Text> : null}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !email || !password}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{mode === 'sign-in' ? 'Sign In' : 'Sign Up'}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          setError(null);
          setSignedUpMessage(null);
        }}
      >
        <Text style={styles.switchMode}>
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: '#c0392b',
    marginBottom: 12,
    textAlign: 'center',
  },
  success: {
    color: '#27ae60',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchMode: {
    color: '#ff7a59',
    textAlign: 'center',
  },
});
