import StoryApi from '../../data/story-api';
import IdbHelper from '../../utils/idb-helper'; 

const AddStoryPresenter = {
  async submitStory(formData) {
    try {
      const token = localStorage.getItem('authToken');

      const base64 = formData.get('photoData');
      if (base64) {
        const blob = await (await fetch(base64)).blob();
        formData.delete('photoData');
        formData.append('photo', blob, 'photo.jpg');
      }

      const response = await StoryApi.addStory(formData, token);

      if (!response.error && response.story?.id) {
        await IdbHelper.saveStory(response.story);
      }

      return response;
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  },
};

export default AddStoryPresenter;
