import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  },
});

const IdbHelper = {
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  async getStory(id) {
    return (await dbPromise).get(STORE_NAME, id);
  },
  async putStory(story) {
    if (!story.id) return;

    const completeStory = {
      id: story.id,
      name: story.name || 'Anonim',
      description: story.description || '',
      createdAt: story.createdAt || new Date().toISOString(),
      photoUrl: story.photoUrl || story.photo || 'default.jpg',
      lat: typeof story.lat === 'number' ? story.lat : null,
      lon: typeof story.lon === 'number' ? story.lon : null,
    };

    return (await dbPromise).put(STORE_NAME, completeStory);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
};

export default IdbHelper;
