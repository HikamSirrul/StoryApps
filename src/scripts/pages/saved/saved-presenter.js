import IdbHelper from '../../utils/idb-helper';

const SavedPresenter = {
  async getSavedStories() {
    return await IdbHelper.getAllStories();
  },
  async deleteSavedStory(id) {
    return await IdbHelper.deleteStory(id);
  }
};

export default SavedPresenter;
