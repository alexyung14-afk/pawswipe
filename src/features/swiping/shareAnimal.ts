import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Animal } from '../../shared/db/types';

export function buildAnimalDeepLink(animalId: string, sharedByUserId: string): string {
  return `pawswipe://animal/${animalId}?ref=${sharedByUserId}`;
}

export type ShareResult = 'shared' | 'copied' | 'dismissed';

/**
 * Opens the OS share sheet. Falls back to copying the link to the clipboard on platforms
 * that don't support sharing (e.g. most desktop browsers), so the feature still does
 * something useful instead of just failing silently.
 */
export async function shareAnimal(animal: Animal, sharedByUserId: string): Promise<ShareResult> {
  const link = buildAnimalDeepLink(animal.id, sharedByUserId);
  const snippet = animal.breed ? ` (${animal.breed})` : '';
  const message = `Help me decide -- what do you think of ${animal.name}${snippet}? ${link}`;

  try {
    const result = await Share.share({ message, url: link });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    await Clipboard.setStringAsync(message);
    return 'copied';
  }
}
