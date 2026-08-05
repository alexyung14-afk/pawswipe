import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/shared/auth/AuthContext';
import { SignInScreen } from './src/shared/auth/SignInScreen';

function SignedInPlaceholder() {
  const { user, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text>Signed in as {user?.email}</Text>
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

function Root() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return session ? <SignedInPlaceholder /> : <SignInScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  signOutButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  signOutText: {
    fontWeight: '600',
  },
});
