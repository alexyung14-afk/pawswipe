import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../shared/auth/AuthContext';
import type { ApplicationStatus } from '../../shared/db/types';
import { fetchApplications, retryApplication, type ApplicationWithAnimal } from './applicationsRepository';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Sending…',
  submitted: 'Submitted',
  failed: 'Failed to send',
  no_response: 'No response yet',
  update_received: 'Update received',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: '#856404',
  submitted: '#27ae60',
  failed: '#c0392b',
  no_response: '#666',
  update_received: '#2980b9',
};

export function ApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { applications: result, error: fetchError } = await fetchApplications(user.id);
    setApplications(result);
    setError(fetchError ? fetchError.message : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRetry = async (applicationId: string) => {
    setRetryingId(applicationId);
    await retryApplication(applicationId);
    setRetryingId(null);
    load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't load your applications</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (applications.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No applications yet</Text>
        <Text style={styles.emptyMessage}>
          Tap Apply on an animal's profile to send your first application.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applications</Text>
      </View>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.animal?.photos[0] ? (
              <Image source={{ uri: item.animal.photos[0] }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.name}>{item.animal?.name ?? 'Unknown'}</Text>
              <Text style={styles.shelter}>{item.shelter_name}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] }]}>
                {STATUS_LABELS[item.status]}
              </Text>
              {item.status === 'failed' ? (
                <Pressable
                  style={styles.retryChip}
                  onPress={() => handleRetry(item.id)}
                  disabled={retryingId === item.id}
                >
                  {retryingId === item.id ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.retryChipText}>Retry</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  photo: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f2f2f2' },
  photoPlaceholder: {},
  cardBody: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  shelter: { color: '#999', fontSize: 12, marginTop: 2 },
  status: { fontWeight: '600', marginTop: 4 },
  retryChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fdecea',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  retryChipText: { color: '#c0392b', fontWeight: '600', fontSize: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  errorMessage: { color: '#666', textAlign: 'center' },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyMessage: { color: '#666', textAlign: 'center' },
});
