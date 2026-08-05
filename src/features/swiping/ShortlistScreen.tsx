import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../shared/auth/AuthContext';
import type { Dog } from '../../shared/db/types';
import { DogCard } from './components/DogCard';
import { fetchShortlist } from './shortlistRepository';

export function ShortlistScreen() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { dogs: result, error: fetchError } = await fetchShortlist(user.id);
    setDogs(result);
    setError(fetchError ? fetchError.message : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't load your shortlist</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (dogs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Nothing here yet</Text>
        <Text style={styles.emptyMessage}>Swipe right on a dog to add it to your shortlist.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={dogs}
      keyExtractor={(dog) => dog.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <DogCard dog={item} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  list: { padding: 16, gap: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  errorMessage: { color: '#666', textAlign: 'center' },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyMessage: { color: '#666', textAlign: 'center' },
});
