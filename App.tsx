import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/shared/auth/AuthContext';
import { SignInScreen } from './src/shared/auth/SignInScreen';
import { SwipeDeckScreen } from './src/features/swiping/SwipeDeckScreen';
import { LikesScreen } from './src/features/swiping/LikesScreen';
import { ProfileScreen } from './src/features/profile/ProfileScreen';
import { ApplicationsScreen } from './src/features/applications/ApplicationsScreen';
import { SharedAnimalScreen } from './src/features/swiping/SharedAnimalScreen';
import { useIncomingAnimalLink } from './src/features/swiping/useIncomingAnimalLink';

type Tab = 'find' | 'likes' | 'applications' | 'profile';

const TABS: { key: Tab; label: string }[] = [
  { key: 'find', label: 'Find pets' },
  { key: 'likes', label: 'Likes' },
  { key: 'applications', label: 'Applications' },
  { key: 'profile', label: 'Profile' },
];

function SignedInApp() {
  const [tab, setTab] = useState<Tab>('find');

  return (
    <View style={styles.appContainer}>
      <View style={styles.screenArea}>
        {tab === 'find' ? (
          <SwipeDeckScreen />
        ) : tab === 'likes' ? (
          <LikesScreen />
        ) : tab === 'applications' ? (
          <ApplicationsScreen />
        ) : (
          <ProfileScreen />
        )}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tabButton} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Root() {
  const { session, loading } = useAuth();
  const { pending, clearPending } = useIncomingAnimalLink();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      {session && pending ? (
        <SharedAnimalScreen animalId={pending.animalId} onClose={clearPending} />
      ) : session ? (
        <SignedInApp />
      ) : (
        <SignInScreen />
      )}
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
