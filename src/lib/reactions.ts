import type { SpecId } from './specsCatalog';

export type VoteValue = 'up' | 'down' | 'none';
export type StoredVote = 'up' | 'down';

const FIRESTORE_COMMIT_URL =
  'https://firestore.googleapis.com/v1/projects/xai-suite/databases/livingpriceatlas/documents:commit';
const DOC_PREFIX = 'projects/xai-suite/databases/livingpriceatlas/documents/sectionReactions';
const VOTER_STORAGE_KEY = 'lpa_voter_v1';
const VOTES_STORAGE_KEY = 'lpa_votes_v1';

const memoryStore = new Map<string, string>();

function readStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Fallback to memoryStore when localStorage is restricted.
  }
  return memoryStore.get(key) ?? null;
}

function writeStorage(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Keep in-memory fallback when localStorage is restricted.
  }
}

function createRandomHex16(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getOrCreateVoterHash(): string {
  const existing = readStorage(VOTER_STORAGE_KEY);
  if (existing && /^[0-9a-f]{32}$/.test(existing)) {
    return existing;
  }
  const fresh = createRandomHex16();
  writeStorage(VOTER_STORAGE_KEY, fresh);
  return fresh;
}

export function loadSavedVotes(): Record<string, StoredVote> {
  const raw = readStorage(VOTES_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    const clean: Record<string, StoredVote> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === 'up' || v === 'down') {
        clean[k] = v;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveVotes(votes: Record<string, StoredVote>): void {
  writeStorage(VOTES_STORAGE_KEY, JSON.stringify(votes));
}

export async function submitSectionReaction(params: {
  specId: SpecId;
  sectionId: string;
  sectionHeading: string;
  vote: VoteValue;
}): Promise<boolean> {
  const voterHash = getOrCreateVoterHash();
  const safeSectionId = params.sectionId.slice(0, 64);
  const safeHeading = params.sectionHeading.slice(0, 200);
  const docId = `${voterHash}_${params.specId}_${safeSectionId}`;

  const payload = {
    writes: [
      {
        update: {
          name: `${DOC_PREFIX}/${docId}`,
          fields: {
            specId: { stringValue: params.specId },
            sectionId: { stringValue: safeSectionId },
            sectionHeading: { stringValue: safeHeading },
            vote: { stringValue: params.vote },
            voterHash: { stringValue: voterHash },
          },
        },
        updateTransforms: [
          {
            fieldPath: 'updatedAt',
            setToServerValue: 'REQUEST_TIME',
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(FIRESTORE_COMMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
