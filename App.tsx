import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/shared/auth/AuthContext';
import { SignInScreen } from './src/shared/auth/SignInScreen';
import { SwipeDeckScreen } from './src/features/swiping/SwipeDeckScreen';
import { LikesScreen } from './src/features/swiping/LikesScreen';

type Tab = 'find' | 'likes';

function SignedInApp() {
  const [tab, setTab] = useState<Tab>('find');

  return (
    <View style={styles.appContainer}>
      <View style={styles.screenArea}>
        {tab === 'find' ? <SwipeDeckScreen /> : <LikesScreen />}
      </View>
      <View style={styles.tabBar}>
        <Pressable style={styles.tabButton} onPress={() => setTab('find')}>
          <Text style={[styles.tabLabel, tab === 'find' && styles.tabLabelActive]}>Find pets</Text>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => setTab('likes')}>
          <Text style={[styles.tabLabel, tab === 'likes' && styles.tabLabelActive]}>Likes</Text>
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
