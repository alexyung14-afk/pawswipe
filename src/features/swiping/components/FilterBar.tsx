import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AnimalFilters } from '../../../shared/data/AnimalRepository';
import type { AnimalSize, Species } from '../../../shared/db/types';

const SPECIES_OPTIONS: { label: string; value: Species | null }[] = [
  { label: 'Any', value: null },
  { label: 'Dogs', value: 'dog' },
  { label: 'Cats', value: 'cat' },
  { label: 'Other', value: 'other' },
];

const SIZES: { label: string; value: AnimalSize | null }[] = [
  { label: 'Any', value: null },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

export function FilterBar({
  filters,
  onApply,
}: {
  filters: AnimalFilters;
  onApply: (filters: AnimalFilters) => void;
}) {
  const [species, setSpecies] = useState<Species | null>(filters.species ?? null);
  const [breed, setBreed] = useState(filters.breed ?? '');
  const [size, setSize] = useState<AnimalSize | null>(filters.size ?? null);
  const [maxAge, setMaxAge] = useState(filters.maxAgeYears?.toString() ?? '');
  const [location, setLocation] = useState(filters.location ?? '');

  const apply = () => {
    onApply({
      species: species ?? undefined,
      breed: breed.trim() || undefined,
      size: size ?? undefined,
      maxAgeYears: maxAge.trim() ? Number(maxAge) : undefined,
      location: location.trim() || undefined,
    });
  };

  const clear = () => {
    setSpecies(null);
    setBreed('');
    setSize(null);
    setMaxAge('');
    setLocation('');
    onApply({});
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>Species</Text>
      <View style={styles.row}>
        {SPECIES_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={[styles.chip, species === option.value && styles.chipSelected]}
            onPress={() => setSpecies(option.value)}
          >
            <Text style={[styles.chipText, species === option.value && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Labrador"
        value={breed}
        onChangeText={setBreed}
      />

      <Text style={styles.label}>Size</Text>
      <View style={styles.row}>
        {SIZES.map((option) => (
          <Pressable
            key={option.label}
            style={[styles.chip, size === option.value && styles.chipSelected]}
            onPress={() => setSize(option.value)}
          >
            <Text style={[styles.chipText, size === option.value && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Max age (years)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5"
        keyboardType="numeric"
        value={maxAge}
        onChangeText={setMaxAge}
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Austin, TX"
        value={location}
        onChangeText={setLocation}
      />

      <View style={styles.row}>
        <Pressable style={styles.clearButton} onPress={clear}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.applyButton} onPress={apply}>
          <Text style={styles.applyText}>Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 4,
  },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: '#ff7a59', borderColor: '#ff7a59' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  clearText: { fontWeight: '600', color: '#333' },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ff7a59',
  },
  applyText: { fontWeight: '600', color: '#fff' },
});
