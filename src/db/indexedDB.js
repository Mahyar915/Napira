import { openDB } from 'idb';

const DB_NAME = 'NapiraDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('source', 'source');
        store.createIndex('type', 'type');
      }
    },
  });
}

/**
 * Requests the browser to store data permanently on disk without ever clearing it
 */
export async function enablePersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
  } catch (e) {
    console.warn('Storage persistence request failed:', e);
  }
}

/**
 * Load all videos from IndexedDB. Clean slate: returns empty array if no videos saved yet.
 */
export async function getAllVideos() {
  enablePersistentStorage();

  try {
    const db = await initDB();
    const items = await db.getAll(STORE_NAME);
    if (!items || items.length === 0) {
      return [];
    }

    // Sort by createdAt descending
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    console.error('Error fetching videos from NapiraDB:', err);
    return [];
  }
}

/**
 * Add a new video (local gallery video or social media link)
 */
export async function addVideo(videoItem) {
  const db = await initDB();
  await db.put(STORE_NAME, videoItem);
  return videoItem;
}

/**
 * Update an existing video (e.g. rename, tag, or toggle favorite)
 */
export async function updateVideo(id, updates) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const existing = await tx.store.get(id);
  if (existing) {
    const updated = { ...existing, ...updates };
    await tx.store.put(updated);
    await tx.done;
    return updated;
  }
  await tx.done;
  return null;
}

/**
 * Toggle favorite status of a video
 */
export async function toggleFavorite(id) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const existing = await tx.store.get(id);
  if (existing) {
    existing.favorite = !existing.favorite;
    await tx.store.put(existing);
    await tx.done;
    return existing.favorite;
  }
  await tx.done;
  return false;
}

/**
 * Delete a video by ID
 */
export async function deleteVideo(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Clear all videos from the database
 */
export async function resetToDefaults() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
  return [];
}
