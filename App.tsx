import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/shared/auth/AuthContext';
import { SignInScreen } from './src/shared/auth/SignInScreen';
import { SwipeDeckScreen } from './src/features/swiping/SwipeDeckScreen';
import { ShortlistScreen } from './src/features/swiping/ShortlistScreen';

type Tab = 'swipe' | 'shortlist';

function SignedInApp() {
  const [tab, setTab] = useState<Tab>('swipe');

  return (
    <View style={styles.appContainer}>
      <View style={styles.screenArea}>
        {tab === 'swipe' ? <SwipeDeckScreen /> : <ShortlistScreen />}
      </View>
      <View style={styles.tabBar}>
        <Pressable style={styles.tabButton} onPress={() => setTab('swipe')}>
          <Text style={[styles.tabLabel, tab === 'swipe' && styles.tabLabelActive]}>Swipe</Text>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => setTab('shortlist')}>
          <Text style={[styles.tabLabel, tab === 'shortlist' && styles.tabLabelActive]}>
            Shortlist
          </Text>
        </Pressable>
      </View>
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

  return (
    <>
      {session ? <SignedInApp /> : <SignInScreen />}
      <StatusBar style="auto" />
    </>
  );
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
  appContainer: { flex: 1, backgroundColor: '#fff' },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { color: '#999', fontWeight: '600' },
  tabLabelActive: { color: '#ff7a59' },
});
