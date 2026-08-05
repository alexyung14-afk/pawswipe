import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../shared/auth/AuthContext';
import type { Animal } from '../../shared/db/types';
import { AnimalCard } from './components/AnimalCard';
import { fetchLikes, removeFromLikes } from './likesRepository';
import { AnimalDetailScreen } from './AnimalDetailScreen';

export function LikesScreen() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [viewingAnimal, setViewingAnimal] = useState<Animal | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { animals: result, error: fetchError } = await fetchLikes(user.id);
    setAnimals(result);
    setError(fetchError ? fetchError.message : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (animal: Animal) => {
    setAnimals((current) => current.filter((a) => a.id !== animal.id));
    if (!user) return;
    const { error: removeError } = await removeFromLikes(user.id, animal.id);
    if (removeError) {
      setBanner("Couldn't remove that. Check your connection and try again.");
      setAnimals((current) => [animal, ...current]);
    }
  };

  if (viewingAnimal) {
    return <AnimalDetailScreen animal={viewingAnimal} onClose={() => setViewingAnimal(null)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Likes</Text>
      </View>

      {banner ? (
        <Pressable style={styles.banner} onPress={() => setBanner(null)}>
          <Text style={styles.bannerText}>{banner} (tap to dismiss)</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn't load your likes</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : animals.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyMessage}>Swipe right on a pet to add it to your likes.</Text>
        </View>
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(animal) => animal.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View>
              <AnimalCard animal={item} onPress={() => setViewingAnimal(item)} />
              <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
                <Text style={styles.removeText}>Remove from Likes</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  banner: { backgroundColor: '#fff3cd', padding: 12 },
  bannerText: { color: '#856404', textAlign: 'center' },
  list: { padding: 16, gap: 16 },
  removeButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  removeText: { color: '#c0392b', fontWeight: '600' },
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
