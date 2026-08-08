import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchSwipeDeck, type AnimalFilters } from '../../shared/data/AnimalRepository';
import type { Animal } from '../../shared/db/types';
import { useAuth } from '../../shared/auth/AuthContext';
import { SwipeCard, type SwipeCardHandle } from './components/SwipeCard';
import { FilterBar } from './components/FilterBar';
import { addToLikes } from './likesRepository';
import { AnimalDetailScreen } from './AnimalDetailScreen';

export function SwipeDeckScreen() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnimalFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewingAnimal, setViewingAnimal] = useState<Animal | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { animals: result, error: fetchError } = await fetchSwipeDeck(user.id, filters);
    setAnimals(result);
    setError(fetchError ? fetchError.message : null);
    setLoading(false);
  }, [user, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = () => {
    setAnimals((current) => current.slice(1));
  };

  const handlePass = () => {
    advance();
  };

  const handleLike = async (animal: Animal) => {
    advance();
    if (!user) return;
    const { error: likeError } = await addToLikes(user.id, animal.id);
    if (likeError) {
      setBanner("Couldn't save that to your likes. Check your connection and try again.");
    }
  };

  const currentAnimal = animals[0];

  if (viewingAnimal) {
    return (
      <AnimalDetailScreen
        animal={viewingAnimal}
        onClose={() => setViewingAnimal(null)}
        onSelectAnimal={setViewingAnimal}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pawswipe</Text>
        <Pressable onPress={() => setShowFilters((v) => !v)}>
          <Text style={styles.filtersToggle}>{showFilters ? 'Hide Filters' : 'Filters'}</Text>
        </Pressable>
      </View>

      {showFilters ? (
        <FilterBar
          filters={filters}
          onApply={(next) => {
            setFilters(next);
            setShowFilters(false);
          }}
        />
      ) : null}

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
          <Text style={styles.errorTitle}>Couldn't load pets</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !currentAnimal ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>You've seen everyone</Text>
          <Text style={styles.emptyMessage}>
            Check back soon for new listings, or adjust your filters.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.deck}>
            <SwipeCard
              key={currentAnimal.id}
              ref={cardRef}
              animal={currentAnimal}
              onSwipeLeft={handlePass}
              onSwipeRight={() => handleLike(currentAnimal)}
              onPress={() => setViewingAnimal(currentAnimal)}
            />
          </View>
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.passButton]}
              onPress={() => cardRef.current?.swipeLeft()}
              accessibilityLabel="Pass on this pet"
            >
              <Text style={[styles.actionIcon, styles.passIcon]}>✕</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => cardRef.current?.swipeRight()}
              accessibilityLabel="Like this pet"
            >
              <Text style={[styles.actionIcon, styles.likeIcon]}>♥</Text>
            </Pressable>
          </View>
        </>
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
  filtersToggle: { color: '#ff7a59', fontWeight: '600' },
  banner: { backgroundColor: '#fff3cd', padding: 12 },
  bannerText: { color: '#856404', textAlign: 'center' },
  deck: { flex: 1, padding: 16 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  passButton: { borderColor: '#ccc' },
  likeButton: { borderColor: '#ff7a59' },
  actionIcon: { fontSize: 28 },
  passIcon: { color: '#999' },
  likeIcon: { color: '#ff7a59' },
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
