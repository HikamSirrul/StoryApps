import IdbHelper from '../../utils/idb-helper';

class SavedPage {
  async render() {
    return `<section id="savedList"><h2>Disimpan Offline</h2></section>`;
  }

  async afterRender() {
    const stories = await IdbHelper.getAllStories();
    const container = document.getElementById('savedList');

    container.innerHTML = '<h2>Disimpan Offline</h2>'; // Header tetap
    if (stories.length === 0) {
      container.innerHTML += `<p>Tidak ada cerita yang disimpan.</p>`;
      return;
    }

    stories.forEach((story) => {
      const div = document.createElement('div');
      div.innerHTML = `
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <button class="delete-btn" data-id="${story.id}">Hapus</button>
      `;
      div.querySelector('.delete-btn').addEventListener('click', async () => {
        await IdbHelper.deleteStory(story.id);
        this.afterRender(); // Refresh tampilan setelah hapus
      });

      container.appendChild(div);
    });
  }
}

export default SavedPage;
