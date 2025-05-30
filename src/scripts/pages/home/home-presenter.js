import StoryApi from '../../data/story-api';
import IdbHelper from '../../utils/idb-helper';

const HomePresenter = {
  async getStories() {
    const token = localStorage.getItem('authToken');

    if (!token) {
      return { error: true, message: 'Token tidak ditemukan. Silakan login ulang.' };
    }

    const isOffline = !navigator.onLine;

    if (isOffline) {
      console.log('[HomePresenter] Offline mode: ambil data dari IndexedDB');
      const cachedStories = await IdbHelper.getAllStories();
      if (cachedStories.length === 0) {
        return { error: true, message: 'Data offline belum tersedia. Mohon koneksi internet untuk pertama kali.' };
      }
      return { error: false, listStory: cachedStories, fromCache: true };
    }

    try {
      const response = await StoryApi.getAllStories(token);

      if (response.error) {
        throw new Error(response.message);
      }

      const stories = response.listStory || [];

      // Tidak lagi menyimpan otomatis ke IndexedDB di sini
      return { error: false, listStory: stories, fromCache: false };
    } catch (err) {
      console.error('[HomePresenter] Gagal ambil data dari API, fallback ke cache:', err);
      const fallback = await IdbHelper.getAllStories();
      if (fallback.length === 0) {
        return { error: true, message: 'Gagal ambil data dan tidak ada cache tersedia.' };
      }
      return { error: false, listStory: fallback, fromCache: true };
    }
  }
};

export default HomePresenter;
