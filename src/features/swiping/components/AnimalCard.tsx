import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Animal } from '../../../shared/db/types';

function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <View style={[styles.photo, styles.photoPlaceholder]}>
        <Text style={styles.photoPlaceholderText}>No photo yet</Text>
      </View>
    );
  }

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(photos.length - 1, i + 1));

  return (
    <View style={styles.photo}>
      <Image
        source={{ uri: photos[index] }}
        style={styles.photo}
        resizeMode="cover"
        accessibilityLabel={`${name} photo ${index + 1} of ${photos.length}`}
      />
      {photos.length > 1 ? (
        <>
          <View style={styles.dotRow}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <Pressable
            style={styles.tapZoneLeft}
            onPress={goPrev}
            accessibilityLabel="Previous photo"
          />
          <Pressable
            style={styles.tapZoneRight}
            onPress={goNext}
            accessibilityLabel="Next photo"
          />
        </>
      ) : null}
    </View>
  );
}

export function AnimalCard({ animal, onPress }: { animal: Animal; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <PhotoGallery photos={animal.photos} name={animal.name} />
      <Text style={styles.name}>{animal.name}</Text>
      <Text style={styles.meta}>
        {[animal.breed, animal.size, animal.age_years ? `${animal.age_years}y` : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {animal.location || animal.shelter_name ? (
        <Text style={styles.shelter}>
          {[animal.shelter_name, animal.location].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {animal.description ? (
        <Text style={styles.description} numberOfLines={5}>
          {animal.description}
        </Text>
      ) : null}
    </Pressable>
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
    aspectRatio: 4 / 5,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
    overflow: 'hidden',
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { color: '#999' },
  dotRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  tapZoneLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '35%',
  },
  tapZoneRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '35%',
  },
  name: { fontSize: 20, fontWeight: '700' },
  meta: { color: '#666', marginTop: 2 },
  shelter: { color: '#999', fontSize: 12, marginTop: 4 },
  description: { marginTop: 8, color: '#333' },
});
