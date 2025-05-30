import SavedPresenter from './saved-presenter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default class SavedPage {
  async render() {
    return `
      <main class="saved-container">
        <h1 class="page-title">Story Tersimpan</h1>
        <div id="map" class="map-container" aria-label="Saved story locations map" role="region"></div>
        <div id="savedStories" class="story-list"></div>
      </main>
    `;
  }

  async afterRender() {
    const container = document.querySelector('#savedStories');
    const mapContainer = document.querySelector('#map');
    const stories = await SavedPresenter.getSavedStories();

    if (stories.length === 0) {
      container.innerHTML = '<p>Belum ada story yang disimpan.</p>';
      return;
    }

    // Tampilkan daftar story
    const html = stories.map((story) => `
      <article class="story-item">
        <img src="${story.photoUrl || story.photo || 'default.jpg'}" alt="Photo from ${story.name}" class="story-img" />
        <h2 class="story-title">${story.name}</h2>
        <p class="story-description">${story.description}</p>
        <time datetime="${story.createdAt}" class="story-date">
          ${new Date(story.createdAt).toLocaleString()}
        </time>
        <button class="delete-story-btn" data-id="${story.id}">🗑️ Hapus</button>
      </article>
    `).join('');

    container.innerHTML = html;

    // Inisialisasi map
    const map = L.map(mapContainer).setView([-2.5, 118], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        L.marker([story.lat, story.lon])
          .addTo(map)
          .bindPopup(`<strong>${story.name}</strong><br>${story.description}`);
      }
    });

    document.querySelectorAll('.delete-story-btn').forEach((button) => {
      button.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await SavedPresenter.deleteSavedStory(id);
        e.target.closest('.story-item').remove();
      });
    });
  }
}
