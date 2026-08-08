import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../shared/auth/AuthContext';
import { fetchProfile, saveProfile } from './profileRepository';

const HOUSING_TYPES = ['House', 'Apartment', 'Condo', 'Other'];

function YesNoChips({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.chip, value === true && styles.chipSelected]}
        onPress={() => onChange(true)}
      >
        <Text style={[styles.chipText, value === true && styles.chipTextSelected]}>Yes</Text>
      </Pressable>
      <Pressable
        style={[styles.chip, value === false && styles.chipSelected]}
        onPress={() => onChange(false)}
      >
        <Text style={[styles.chipText, value === false && styles.chipTextSelected]}>No</Text>
      </Pressable>
    </View>
  );
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [housingType, setHousingType] = useState<string | null>(null);
  const [hasYard, setHasYard] = useState<boolean | null>(null);
  const [yardFenced, setYardFenced] = useState<boolean | null>(null);
  const [workSchedule, setWorkSchedule] = useState('');
  const [householdMembers, setHouseholdMembers] = useState('');
  const [petExperience, setPetExperience] = useState('');
  const [references, setReferences] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { profile, error: fetchError } = await fetchProfile(user.id);
    if (profile) {
      setHousingType(profile.housing_type);
      setHasYard(profile.has_yard);
      setYardFenced(profile.yard_fenced);
      setWorkSchedule(profile.work_schedule ?? '');
      setHouseholdMembers((profile.household_members?.notes as string) ?? '');
      setPetExperience(profile.pet_experience ?? '');
      setReferences((profile.references?.notes as string) ?? '');
    }
    setError(fetchError ? fetchError.message : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);
    const { error: saveError } = await saveProfile(user.id, {
      housing_type: housingType,
      has_yard: hasYard,
      yard_fenced: hasYard ? yardFenced : null,
      work_schedule: workSchedule.trim() || null,
      household_members: householdMembers.trim() || null,
      pet_experience: petExperience.trim() || null,
      references: references.trim() || null,
    });
    setSaving(false);
    setSaveMessage(
      saveError ? "Couldn't save. Check your connection and try again." : 'Saved!'
    );
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
        <Text style={styles.errorTitle}>Couldn't load your profile</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.subtitle}>
        Fill this out once. We'll use it to apply to any dog or cat in one tap.
      </Text>

      <Text style={styles.label}>Housing type</Text>
      <View style={styles.row}>
        {HOUSING_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[styles.chip, housingType === type && styles.chipSelected]}
            onPress={() => setHousingType(type)}
          >
            <Text style={[styles.chipText, housingType === type && styles.chipTextSelected]}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Do you have a yard?</Text>
      <YesNoChips value={hasYard} onChange={setHasYard} />

      {hasYard ? (
        <>
          <Text style={styles.label}>Is it fenced?</Text>
          <YesNoChips value={yardFenced} onChange={setYardFenced} />
        </>
      ) : null}

      <Text style={styles.label}>Work schedule</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Work from home most days"
        value={workSchedule}
        onChangeText={setWorkSchedule}
      />

      <Text style={styles.label}>Who else lives with you?</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="e.g. Spouse, 2 kids, no other pets"
        value={householdMembers}
        onChangeText={setHouseholdMembers}
        multiline
      />

      <Text style={styles.label}>Your experience with pets</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Tell shelters about pets you've owned or cared for"
        value={petExperience}
        onChangeText={setPetExperience}
        multiline
      />

      <Text style={styles.label}>References</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="1-2 people who can vouch for you, with contact info"
        value={references}
        onChangeText={setReferences}
        multiline
      />

      {saveMessage ? (
        <Text
          style={saveMessage === 'Saved!' ? styles.successMessage : styles.errorMessage}
        >
          {saveMessage}
        </Text>
      ) : null}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 4, marginBottom: 16 },
  label: { fontWeight: '600', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
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
  saveButton: {
    marginTop: 24,
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  successMessage: { color: '#27ae60', marginTop: 12, textAlign: 'center' },
  errorMessage: { color: '#c0392b', marginTop: 12, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#ff7a59',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  signOutButton: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  signOutText: { color: '#999', fontWeight: '600' },
});
