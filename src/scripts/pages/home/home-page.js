import HomePresenter from './home-presenter';
import IdbHelper from '../../utils/idb-helper';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix path ikon Leaflet agar kompatibel dengan Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default class HomePage {
  constructor() {
    this.map = null;
    this.markers = [];
    this.stories = [];
  }

  async render() {
    return `
      <main id="main-content" class="home-container" tabindex="-1" role="main">
        <h1 class="page-title">Welcome to the Home Page</h1>
        <div id="map" class="map-container" aria-label="Story locations map" role="region"></div>
        <div id="storyList" class="story-list"></div>
      </main>
    `;
  }

  initMap() {
    const mapContainer = document.querySelector('#map');

    if (!this.map) {
      this.map = L.map(mapContainer).setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
    }

    // Hapus marker lama
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Tambahkan marker baru
    this.stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon])
          .addTo(this.map)
          .bindPopup(`<strong>${story.name}</strong><br>${story.description}`);
        this.markers.push(marker);
      }
    });

    // Sesuaikan view map supaya semua marker terlihat (jika ada)
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    } else {
      this.map.setView([0, 0], 2);
    }
  }

  renderStories(fromCache = false, errorMessage = '') {
    const storyContainer = document.querySelector('#storyList');
    if (!storyContainer) return;

    if (errorMessage) {
      storyContainer.innerHTML = `<p class="error-message" role="alert">${errorMessage}</p>`;
      return;
    }

    if (this.stories.length === 0) {
      storyContainer.innerHTML = '<p>Tidak ada story.</p>';
      return;
    }

    let storyHtml = '';
    if (fromCache) {
      storyHtml += `
        <p class="offline-info" aria-live="polite">
          📴 Anda sedang offline. Menampilkan data dari cache.
        </p>
      `;
    }

    storyHtml += this.stories.map(story => {
      // Jika dari cache dan photoBlob ada, buat URL Blob
      let imgSrc = story.photoUrl;
      if (fromCache && story.photoBlob) {
        imgSrc = URL.createObjectURL(story.photoBlob);
      }
      return `
        <article class="story-item" data-id="${story.id}">
          <img src="${imgSrc}" alt="Photo from ${story.name}" class="story-img" />
          <h2 class="story-title">${story.name}</h2>
          <p class="story-description">${story.description}</p>
          <time datetime="${story.createdAt}" class="story-date">
            ${new Date(story.createdAt).toLocaleString()}
          </time>
          <button class="btn-delete" aria-label="Hapus story ${story.name}">Hapus</button>
        </article>
      `;
    }).join('');

    storyContainer.innerHTML = storyHtml;

    // Pasang event handler tombol hapus
    const deleteButtons = storyContainer.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const article = event.target.closest('article');
        const id = article?.dataset.id;
        if (!id) return;

        if (confirm('Yakin ingin menghapus story ini?')) {
          try {
            await IdbHelper.deleteStory(id);
            alert('Story berhasil dihapus dari cache.');
            await this.loadStories();
          } catch (error) {
            alert('Gagal menghapus story.');
            console.error(error);
          }
        }
      });
    });
  }

  async loadStories() {
    try {
      const result = await HomePresenter.getStories();

      if (result.error) {
        this.stories = [];
        this.renderStories(false, result.message);
        this.initMap();
        return;
      }

      this.stories = result.listStory || [];
      this.renderStories(result.fromCache);
      this.initMap();
    } catch (error) {
      console.error('[HomePage] Gagal memuat story:', error);
      const fallback = await IdbHelper.getAllStories();
      if (fallback.length === 0) {
        this.renderStories(false, 'Gagal memuat story dan tidak ada data cache.');
      } else {
        this.stories = fallback;
        this.renderStories(true);
      }
      this.initMap();
    }
  }

  async afterRender() {
    await this.loadStories();
  }
}
