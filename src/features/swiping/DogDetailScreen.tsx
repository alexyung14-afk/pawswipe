import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Dog } from '../../shared/db/types';

export function DogDetailScreen({ dog, onClose }: { dog: Dog; onClose: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityLabel="Back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {dog.photos.length > 0 ? (
          dog.photos.map((uri, i) => (
            <Image
              key={uri}
              source={{ uri }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={`${dog.name} photo ${i + 1} of ${dog.photos.length}`}
            />
          ))
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>No photo yet</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.meta}>
            {[dog.breed, dog.size, dog.age_years ? `${dog.age_years} years old` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {dog.location || dog.shelter_name ? (
            <Text style={styles.shelter}>
              {[dog.shelter_name, dog.location].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          {dog.description ? <Text style={styles.description}>{dog.description}</Text> : null}
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
