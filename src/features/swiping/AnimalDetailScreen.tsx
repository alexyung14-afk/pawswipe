import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Animal, Application } from '../../shared/db/types';
import { useAuth } from '../../shared/auth/AuthContext';
import {
  findExistingApplication,
  retryApplication,
  submitApplication,
} from '../applications/applicationsRepository';

function ApplyStatus({ application }: { application: Application }) {
  if (application.status === 'submitted') {
    return (
      <View style={[styles.statusBox, styles.statusSuccess]}>
        <Text style={styles.statusSuccessText}>✓ Application sent</Text>
      </View>
    );
  }
  return null;
}

export function AnimalDetailScreen({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    setChecking(true);
    const { application: existing } = await findExistingApplication(user.id, animal.id);
    setApplication(existing);
    setChecking(false);
  }, [user, animal.id]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleApply = async () => {
    if (!user) return;
    setApplying(true);
    setApplyError(null);
    const { application: result, error } = await submitApplication(
      user.id,
      animal.id,
      animal.shelter_name
    );
    setApplying(false);
    setApplication(result);
    if (error || result?.status === 'failed') {
      setApplyError("Couldn't reach this shelter. Your application was saved -- try again.");
    }
  };

  const handleRetry = async () => {
    if (!application) return;
    setApplying(true);
    setApplyError(null);
    const { application: result, error } = await retryApplication(application.id);
    setApplying(false);
    if (result) setApplication(result);
    if (error || result?.status === 'failed') {
      setApplyError("Still couldn't reach this shelter. Try again in a bit.");
    }
  };

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

          <View style={styles.applySection}>
            {checking ? (
              <ActivityIndicator />
            ) : application?.status === 'submitted' ? (
              <ApplyStatus application={application} />
            ) : (
              <>
                {applyError ? <Text style={styles.applyErrorText}>{applyError}</Text> : null}
                <Pressable
                  style={[styles.applyButton, applying && styles.applyButtonDisabled]}
                  onPress={application ? handleRetry : handleApply}
                  disabled={applying}
                >
                  {applying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.applyText}>
                      {application?.status === 'failed' ? 'Try Again' : 'Apply'}
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
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
  applySection: { marginTop: 24 },
  applyButton: {
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonDisabled: { opacity: 0.6 },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  applyErrorText: { color: '#c0392b', marginBottom: 8, textAlign: 'center' },
  statusBox: { padding: 14, borderRadius: 8, alignItems: 'center' },
  statusSuccess: { backgroundColor: '#eafaf1' },
  statusSuccessText: { color: '#27ae60', fontWeight: '700' },
});
