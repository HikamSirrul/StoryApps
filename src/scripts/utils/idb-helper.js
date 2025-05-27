const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

const IdbHelper = {
  getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('[IdbHelper] DB open blocked');
      };
    });
  },

  async saveStory(story) {
    const db = await this.getDB();

    // Jika story ada photoUrl tapi belum ada photoBlob, fetch Blob foto
    if (story.photoUrl && !story.photoBlob) {
      try {
        const response = await fetch(story.photoUrl);
        if (response.ok) {
          const blob = await response.blob();
          story.photoBlob = blob;
        }
      } catch (err) {
        console.warn('[IdbHelper] Gagal fetch photo untuk offline:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(story);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllStories() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteStory(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

export default IdbHelper;
