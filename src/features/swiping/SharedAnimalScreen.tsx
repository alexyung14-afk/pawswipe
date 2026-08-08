import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Animal } from '../../shared/db/types';
import { fetchAnimalById } from '../../shared/data/AnimalRepository';
import { AnimalDetailScreen } from './AnimalDetailScreen';

export function SharedAnimalScreen({
  animalId,
  onClose,
}: {
  animalId: string;
  onClose: () => void;
}) {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAnimalById(animalId).then(({ animal: result, error: fetchError }) => {
      if (cancelled) return;
      setAnimal(result);
      setError(fetchError ? fetchError.message : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [animalId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !animal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Couldn't find that pet</Text>
        <Text style={styles.message}>
          {error ?? 'This link may be out of date, or the listing is no longer available.'}
        </Text>
        <Pressable style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Back to Pawswipe</Text>
        </Pressable>
      </View>
    );
  }

  return <AnimalDetailScreen animal={animal} onClose={onClose} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  message: { color: '#666', textAlign: 'center' },
  button: {
    marginTop: 8,
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
