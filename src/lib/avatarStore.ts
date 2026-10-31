// IndexedDB-backed avatar blob persistence (web PWA).
//
// DocumentPicker on web returns `uri: URL.createObjectURL(file)` — a blob URL
// that dies on page reload, which is why localStorage could never persist it.
// IndexedDB stores the raw Blob/File directly: no base64 inflation, no canvas
// recompression, original quality preserved, and no ~5MB localStorage quota.
const DB_NAME = "sinsay-avatar";
const DB_VERSION = 1;
const STORE_NAME = "avatars";

function isOpenable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAvatarBlob(userId: string, blob: Blob): Promise<void> {
  if (!isOpenable()) return;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      await promisifyRequest(tx.objectStore(STORE_NAME).put(blob, userId));
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn("avatarStore.saveAvatarBlob failed:", err);
  }
}

export async function loadAvatarBlob(userId: string): Promise<Blob | null> {
  if (!isOpenable()) return null;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const result = await promisifyRequest<Blob | undefined>(
        tx.objectStore(STORE_NAME).get(userId)
      );
      return result ?? null;
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn("avatarStore.loadAvatarBlob failed:", err);
    return null;
  }
}

export async function deleteAvatarBlob(userId: string): Promise<void> {
  if (!isOpenable()) return;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      await promisifyRequest(tx.objectStore(STORE_NAME).delete(userId));
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn("avatarStore.deleteAvatarBlob failed:", err);
  }
}
