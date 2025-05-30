import HomePresenter from './home-presenter';
import IdbHelper from '../../utils/idb-helper';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    this.stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon])
          .addTo(this.map)
          .bindPopup(`<strong>${story.name}</strong><br>${story.description}`);
        this.markers.push(marker);
      }
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    } else {
      this.map.setView([0, 0], 2);
    }
  }

  renderStories(fromCache = false, errorMessage = '') {
    const container = document.querySelector('#storyList');
    if (!container) return;

    if (errorMessage) {
      container.innerHTML = `<p class="error-message" role="alert">${errorMessage}</p>`;
      return;
    }

    if (this.stories.length === 0) {
      container.innerHTML = '<p>Tidak ada story.</p>';
      return;
    }

    let html = '';
    if (fromCache) {
      html += `
        <p class="offline-info" aria-live="polite">
          📴 Anda sedang offline. Menampilkan data dari cache.
        </p>
      `;
    }

    html += this.stories.map(story => {
      const imgSrc = story.photoBlob
        ? URL.createObjectURL(story.photoBlob)
        : story.photoUrl;

      return `
        <article class="story-item" data-id="${story.id}">
          <img src="${imgSrc}" alt="Photo from ${story.name}" class="story-img" />
          <h2 class="story-title">${story.name}</h2>
          <p class="story-description">${story.description}</p>
          <time datetime="${story.createdAt}" class="story-date">
            ${new Date(story.createdAt).toLocaleString()}
          </time>
          <button class="btn-delete" aria-label="Hapus story ${story.name}">Hapus</button>
          <button class="btn-save" aria-label="Simpan story ${story.name}">Simpan</button>
        </article>
      `;
    }).join('');

    container.innerHTML = html;

    // Tombol simpan
    container.querySelectorAll('.btn-save').forEach(button => {
      button.addEventListener('click', async event => {
        const article = event.target.closest('article');
        const id = article?.dataset.id;
        const story = this.stories.find(s => s.id === id);
        if (!story) return;

        try {
          const existing = await IdbHelper.getStory(id);
          if (existing) {
            alert('Story sudah disimpan sebelumnya.');
            return;
          }

          if (!story.photoBlob && story.photoUrl) {
            const res = await fetch(story.photoUrl);
            story.photoBlob = await res.blob();
          }

          await IdbHelper.putStory(story);
          alert('Story berhasil disimpan untuk offline.');
        } catch (err) {
          console.error('Gagal menyimpan story:', err);
          alert('Terjadi kesalahan saat menyimpan story.');
        }
      });
    });

    // Tombol hapus
    container.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', async event => {
        const article = event.target.closest('article');
        const id = article?.dataset.id;
        if (!id) return;

        if (confirm('Yakin ingin menghapus story ini?')) {
          try {
            await IdbHelper.deleteStory(id);
            this.stories = this.stories.filter(s => s.id !== id);
            this.renderStories(fromCache);
            this.initMap();
          } catch (err) {
            console.error('Gagal menghapus story:', err);
            alert('Gagal menghapus story.');
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
      this.renderStories(false);
      this.initMap();
    } catch (err) {
      console.error('Gagal mengambil story dari API:', err);
      const cache = await IdbHelper.getAllStories();

      if (cache.length === 0) {
        this.renderStories(false, 'Tidak dapat memuat story dan tidak ada cache.');
      } else {
        this.stories = cache;
        this.renderStories(true);
      }

      this.initMap();
    }
  }

  async afterRender() {
    await this.loadStories();
  }
}
