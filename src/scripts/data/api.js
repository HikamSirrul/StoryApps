import CONFIG from '../config';

class StoryApi {
  static async list() {
    const response = await fetch(`${CONFIG.BASE_URL}/stories`);
    const responseJson = await response.json();
    return responseJson.listStory
  }
}

export default StoryApi;