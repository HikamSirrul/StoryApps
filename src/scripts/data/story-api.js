const StoryApi = {
  async addStory(formData, token) {
    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menambahkan story');
      }

      return await response.json();
    } catch (error) {
      console.error('[StoryApi] addStory error:', error);
      throw error;  // biar caller bisa tangani
    }
  },

  async getAllStories(token) {
    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil daftar story');
      }

      return await response.json();
    } catch (error) {
      console.error('[StoryApi] getAllStories error:', error);
      throw error;  // biar caller bisa fallback ke IndexedDB
    }
  },
};

export default StoryApi;
