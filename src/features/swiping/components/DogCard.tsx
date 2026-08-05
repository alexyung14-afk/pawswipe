import { Image, StyleSheet, Text, View } from 'react-native';
import type { Dog } from '../../../shared/db/types';

export function DogCard({ dog }: { dog: Dog }) {
  return (
    <View style={styles.card}>
      {dog.photos[0] ? (
        <Image source={{ uri: dog.photos[0] }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>No photo yet</Text>
        </View>
      )}
      <Text style={styles.name}>{dog.name}</Text>
      <Text style={styles.meta}>
        {[dog.breed, dog.size, dog.age_years ? `${dog.age_years}y` : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {dog.location || dog.shelter_name ? (
        <Text style={styles.shelter}>
          {[dog.shelter_name, dog.location].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {dog.description ? (
        <Text style={styles.description} numberOfLines={5}>
          {dog.description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  photo: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { color: '#999' },
  name: { fontSize: 20, fontWeight: '700' },
  meta: { color: '#666', marginTop: 2 },
  shelter: { color: '#999', fontSize: 12, marginTop: 4 },
  description: { marginTop: 8, color: '#333' },
});
