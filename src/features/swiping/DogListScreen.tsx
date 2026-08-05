import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchAvailableDogs } from '../../shared/data/DogRepository';
import type { Dog } from '../../shared/db/types';
import { useAuth } from '../../shared/auth/AuthContext';

function Header() {
  const { signOut } = useAuth();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Pawswipe</Text>
      <Pressable onPress={signOut}>
        <Text style={styles.signOut}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

export function DogListScreen() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const { dogs: result, error: fetchError } = await fetchAvailableDogs();
    setDogs(result);
    setError(fetchError ? fetchError.message : null);
    isRefresh ? setRefreshing(false) : setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Header />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn't load dogs</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : dogs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No dogs yet</Text>
          <Text style={styles.emptyMessage}>
            We haven't synced any listings yet. Check back soon.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dogs}
          keyExtractor={(dog) => dog.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.photos[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]} />
              )}
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {[item.breed, item.size, item.age_years ? `${item.age_years}y` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {item.shelter_name ? <Text style={styles.shelter}>{item.shelter_name}</Text> : null}
              {item.description ? (
                <Text style={styles.description} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  signOut: { color: '#ff7a59', fontWeight: '600' },
  list: { padding: 16, gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  photo: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8, backgroundColor: '#f2f2f2' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700' },
  meta: { color: '#666', marginTop: 2 },
  shelter: { color: '#999', fontSize: 12, marginTop: 4 },
  description: { marginTop: 8, color: '#333' },
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
