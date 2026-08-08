import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pawswipe.pendingSharedAnimal';

export interface PendingReferral {
  animalId: string;
  ref: string | null;
}

export async function getPendingReferral(): Promise<PendingReferral | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PendingReferral) : null;
}

export async function setPendingReferral(value: PendingReferral): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function clearPendingReferral(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
