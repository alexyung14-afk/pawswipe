import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import {
  clearPendingReferral,
  getPendingReferral,
  setPendingReferral,
  type PendingReferral,
} from '../../shared/referral/pendingReferral';

function parseAnimalLink(url: string): PendingReferral | null {
  const parsed = Linking.parse(url);
  // Native custom-scheme links (pawswipe://animal/123) parse with hostname="animal",
  // path="123", so they need rejoining. Web links (http://host/animal/123) already have
  // the full "animal/123" in path, and rejoining with hostname would break the match.
  const candidates = [parsed.path, [parsed.hostname, parsed.path].filter(Boolean).join('/')].filter(
    (value): value is string => Boolean(value)
  );
  for (const candidate of candidates) {
    const match = candidate.match(/^animal\/([^/?]+)/);
    if (match) {
      const ref = typeof parsed.queryParams?.ref === 'string' ? parsed.queryParams.ref : null;
      return { animalId: match[1], ref };
    }
  }
  return null;
}

/**
 * Tracks a pending shared-animal deep link across the sign-up flow. Persisted to disk
 * (not just React state) because email confirmation means the user may background or
 * fully close the app to check their inbox before coming back.
 */
export function useIncomingAnimalLink() {
  const [pending, setPendingState] = useState<PendingReferral | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [stored, initialUrl] = await Promise.all([
        getPendingReferral(),
        Linking.getInitialURL(),
      ]);
      const fromUrl = initialUrl ? parseAnimalLink(initialUrl) : null;
      const resolved = fromUrl ?? stored;
      if (resolved) {
        setPendingState(resolved);
        await setPendingReferral(resolved);
      }
      setLoaded(true);
    })();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const result = parseAnimalLink(url);
      if (result) {
        setPendingState(result);
        setPendingReferral(result);
      }
    });
    return () => subscription.remove();
  }, []);

  const clearPending = () => {
    setPendingState(null);
    clearPendingReferral();
  };

  return { pending: loaded ? pending : null, clearPending };
}
