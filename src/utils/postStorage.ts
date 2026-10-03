import { PostItem } from '../types';

const LOCAL_STORAGE_KEY = 'f1bd_posts_history';
const DB_NAME = 'f1bd_creator_cms_db';
const DB_VERSION = 1;
const STORE_NAME = 'posts_store';

// Clean default: No hardcoded fake posts
export const DEFAULT_POSTS: PostItem[] = [];

export function isLegacyMock(p: any): boolean {
  if (!p) return true;
  if (p.title === 'BANGLADESH MOTORSPORT FUTURE: 2026 ROADMAP UNVEILED') return true;
  if (p.title === 'OSCAR PIASTRI STORMS TO SHANGHAI POLE UNDER THE LIGHTS') return true;
  if (p.image_path === 'ready/f1bd_1774029300_1.jpg' || p.image_path === 'published/f1bd_1773992400_2.jpg') return true;
  return false;
}

// Helper to open IndexedDB
function openIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Save a single post to IndexedDB
async function savePostToIndexedDB(post: PostItem): Promise<void> {
  if (isLegacyMock(post)) return;
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(post);
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

// Load all posts from IndexedDB
async function loadAllFromIndexedDB(): Promise<PostItem[]> {
  try {
    const db = await openIndexedDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Delete from IndexedDB
async function deleteFromIndexedDB(id: number): Promise<void> {
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}

// Synchronously load posts from localStorage (fast boot)
export function getInitialPosts(): PostItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Strip out any legacy hardcoded mock items
        const cleaned = parsed.filter((p) => !isLegacyMock(p));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Failed to parse localStorage posts:', e);
  }
  return [];
}

// Asynchronously load posts (combines localStorage + IndexedDB full-res images)
export async function loadPersistentPosts(): Promise<PostItem[]> {
  const localList = getInitialPosts();
  try {
    const idbList = await loadAllFromIndexedDB();
    if (idbList.length > 0) {
      const cleanedIdb = idbList.filter((p) => !isLegacyMock(p));
      // Clean legacy mocks out of IndexedDB
      for (const p of idbList) {
        if (isLegacyMock(p)) {
          deleteFromIndexedDB(p.id);
        }
      }

      const map = new Map<number, PostItem>();
      cleanedIdb.forEach((p) => map.set(p.id, p));
      localList.forEach((p) => {
        if (!map.has(p.id)) {
          map.set(p.id, p);
        } else {
          // Keep highest fidelity image
          const idbPost = map.get(p.id)!;
          if (!idbPost.imageDataUrl && p.imageDataUrl) {
            idbPost.imageDataUrl = p.imageDataUrl;
          }
        }
      });
      return Array.from(map.values()).sort((a, b) => b.post_timestamp - a.post_timestamp);
    }
  } catch (e) {
    console.warn('IndexedDB merge error:', e);
  }
  return localList;
}

// Persist posts array to both localStorage and IndexedDB
export async function savePostsPersistent(posts: PostItem[]): Promise<void> {
  if (typeof window === 'undefined') return;

  const filtered = posts.filter((p) => !isLegacyMock(p));

  // 1. Save into IndexedDB
  for (const post of filtered) {
    savePostToIndexedDB(post);
  }

  // 2. Save into localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    try {
      const lightweight = filtered.map((p) => ({
        ...p,
        imageDataUrl:
          p.imageDataUrl && p.imageDataUrl.length > 100000
            ? p.imageDataUrl.substring(0, 100000)
            : p.imageDataUrl,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }
}

// Delete a post from persistent storage
export async function deletePostPersistent(id: number): Promise<void> {
  await deleteFromIndexedDB(id);
}

// Clear all post history
export async function clearAllPostsPersistent(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  try {
    const db = await openIndexedDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    }
  } catch (e) {
    console.warn('Clear IndexedDB failed:', e);
  }
}

// Cloud Sync to Vercel Serverless Function / Supabase
export async function syncPostToCloud(post: PostItem): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  if (isLegacyMock(post)) return { success: false, error: 'Skipped mock item' };
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: post.title,
        caption: post.caption,
        imageDataUrl: post.imageDataUrl,
        scheduled_at: new Date(post.post_timestamp * 1000).toISOString(),
        status: post.status === 'Posted' ? 'posted' : 'scheduled',
        target_platforms: ['instagram'],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const data = await res.json();
    return {
      success: true,
      publicUrl: data.publicUrl || (data.post && data.post.image_public_url),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

// Fetch posts from Supabase cloud via /api/posts
export async function fetchCloudPosts(): Promise<PostItem[]> {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) return [];
    const data = await res.json();
    if (data.posts && Array.isArray(data.posts)) {
      return data.posts
        .filter((row: any) => !isLegacyMock(row))
        .map((row: any) => ({
          id: typeof row.id === 'number' ? row.id : Math.floor(Math.random() * 100000) + 100,
          title: row.title || 'UNTITLED POST',
          image_path: row.image_storage_path || 'ready/f1bd_cloud.jpg',
          image_public_url: row.image_public_url,
          imageDataUrl: row.image_public_url || undefined,
          caption: row.caption || '',
          post_timestamp: row.scheduled_at
            ? Math.floor(new Date(row.scheduled_at).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
          status: row.status === 'posted' ? 'Posted' : 'Scheduled',
          cloud_id: row.id,
          created_at: row.created_at || new Date().toISOString(),
        }));
    }
  } catch (e) {
    console.warn('fetchCloudPosts failed:', e);
  }
  return [];
}
