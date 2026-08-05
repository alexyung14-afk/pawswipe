import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Animal } from '../../shared/db/types';

export function AnimalDetailScreen({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityLabel="Back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {animal.photos.length > 0 ? (
          animal.photos.map((uri, i) => (
            <Image
              key={uri}
              source={{ uri }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={`${animal.name} photo ${i + 1} of ${animal.photos.length}`}
            />
          ))
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>No photo yet</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{animal.name}</Text>
          <Text style={styles.meta}>
            {[animal.breed, animal.size, animal.age_years ? `${animal.age_years} years old` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {animal.location || animal.shelter_name ? (
            <Text style={styles.shelter}>
              {[animal.shelter_name, animal.location].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          {animal.description ? <Text style={styles.description}>{animal.description}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { color: '#ff7a59', fontWeight: '600', fontSize: 16 },
  scrollContent: { paddingBottom: 32 },
  photo: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#f2f2f2',
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { color: '#999' },
  info: { padding: 16 },
  name: { fontSize: 26, fontWeight: '700' },
  meta: { color: '#666', marginTop: 4, fontSize: 16 },
  shelter: { color: '#999', fontSize: 14, marginTop: 6 },
  description: { marginTop: 16, color: '#333', fontSize: 16, lineHeight: 22 },
});
