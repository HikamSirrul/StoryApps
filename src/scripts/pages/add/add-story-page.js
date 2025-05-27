import AddStoryPresenter from './add-story-presenter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import IdbHelper from '../../utils/idb-helper';


// Fix path ikon Leaflet agar kompatibel dengan Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default class AddStoryPage {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.map = null;
    this.marker = null;
  }

  async render() {
    return `
      <main id="main-content" tabindex="-1">
        <section class="container add-story-container" role="form" aria-labelledby="addStoryFormTitle">
          <h1 id="addStoryFormTitle">Tambah Story Baru</h1>
          <form id="addStoryForm" class="story-form" aria-describedby="formInstructions">
            <p id="formInstructions" class="visually-hidden">Isi deskripsi cerita Anda, pilih lokasi di peta, dan ambil foto dengan kamera untuk melengkapi cerita.</p>

            <div class="form-group">
              <label for="description">Deskripsi:</label>
              <textarea id="description" name="description" required placeholder="Deskripsikan cerita Anda..." aria-required="true"></textarea>
            </div>

            <div class="form-group">
              <label>Ambil Foto dengan Kamera:</label>
              <video id="video" autoplay playsinline style="width: 100%; max-height: 200px; border: 1px solid #ccc;" aria-live="polite" aria-label="Video untuk ambil foto"></video>
              <button type="button" id="startCamera" aria-label="Buka kamera untuk ambil foto">Buka Kamera</button>
              <button type="button" id="stopCamera" style="display: none;" aria-label="Tutup kamera" aria-disabled="true">Tutup Kamera</button>
              <button type="button" id="capture" disabled aria-label="Ambil foto" aria-disabled="true">Ambil Foto</button>
              <canvas id="canvas" style="display: none;"></canvas>
              <input type="hidden" id="photoData" name="photoData" />
              <img id="capturedImage" style="display: none; max-width: 100%; margin-top: 10px;" alt="Foto yang diambil" />
            </div>

            <div class="form-group">
              <label>Lokasi:</label>
              <div id="map" class="leaflet-map" style="height: 300px;" role="application" aria-label="Peta lokasi cerita Anda"></div>
              <input type="hidden" id="lat" name="lat" />
              <input type="hidden" id="lon" name="lon" />
            </div>

            <button type="submit" class="submit-btn" aria-label="Tambah story baru">Tambah Story</button>
          </form>
          <p id="formMessage" class="form-message" role="alert"></p>
        </section>
      </main>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#addStoryForm');
    const messageElement = document.querySelector('#formMessage');

    // Inisialisasi peta
    this.map = L.map('map').setView([-6.2, 106.8], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.querySelector('#lat').value = lat;
      document.querySelector('#lon').value = lng;

      if (this.marker) this.map.removeLayer(this.marker);
      this.marker = L.marker([lat, lng]).addTo(this.map).bindPopup('Lokasi dipilih').openPopup();
    });

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureButton = document.getElementById('capture');
    const startCameraButton = document.getElementById('startCamera');
    const stopCameraButton = document.getElementById('stopCamera');
    const capturedImage = document.getElementById('capturedImage');
    const photoDataInput = document.getElementById('photoData');

    this.videoElement = video;

    startCameraButton.addEventListener('click', async () => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = this.stream;
        startCameraButton.style.display = 'none';
        stopCameraButton.style.display = 'inline-block';
        captureButton.disabled = false;
      } catch (err) {
        console.error('Gagal mengakses kamera:', err);
        alert('Tidak bisa membuka kamera. Pastikan izin kamera diaktifkan.');
      }
    });

    stopCameraButton.addEventListener('click', () => {
      this.stopCamera();
      startCameraButton.style.display = 'inline-block';
      stopCameraButton.style.display = 'none';
      captureButton.disabled = true;
    });

    captureButton.addEventListener('click', () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      photoDataInput.value = dataUrl;

      capturedImage.style.display = 'block';
      capturedImage.src = dataUrl;

      this.stopCamera();

      captureButton.disabled = true;
      captureButton.textContent = 'Foto Diambil';
    });

   form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const storyData = {
    id: Date.now().toString(), // ID unik
    name: 'Cerita Baru',
    description: formData.get('description'),
    lat: formData.get('lat'),
    lon: formData.get('lon'),
    photo: formData.get('photoData'),
  };

  if (navigator.onLine) {
    // ONLINE → Kirim ke server
    const result = await AddStoryPresenter.submitStory(formData);

    if (result.error) {
      messageElement.textContent = `❌ ${result.message}`;
      messageElement.style.color = 'red';
    } else {
      messageElement.textContent = `✅ ${result.message}`;
      messageElement.style.color = 'white';
      form.reset();
      if (this.marker) this.map.removeLayer(this.marker);
      capturedImage.style.display = 'none';
      captureButton.textContent = 'Ambil Foto';
    }
  } else {
    // OFFLINE → Simpan ke IndexedDB
    try {
      await IdbHelper.saveStory(storyData);
      messageElement.textContent = '✅ Tidak ada koneksi. Story disimpan offline.';
      messageElement.style.color = 'white';

      form.reset();
      if (this.marker) this.map.removeLayer(this.marker);
      capturedImage.style.display = 'none';
      captureButton.textContent = 'Ambil Foto';
    } catch (err) {
      messageElement.textContent = '❌ Gagal menyimpan offline.';
      messageElement.style.color = 'red';
      console.error(err);
    }
  }
});

window.addEventListener('online', async () => {
  const offlineStories = await IdbHelper.getAllStories();
  for (const story of offlineStories) {
    const fakeFormData = new FormData();
    fakeFormData.append('description', story.description);
    fakeFormData.append('lat', story.lat);
    fakeFormData.append('lon', story.lon);
    fakeFormData.append('photoData', story.photo); // sesuaikan dengan backend jika perlu

    const result = await AddStoryPresenter.submitStory(fakeFormData);
    if (!result.error) {
      await IdbHelper.deleteStory(story.id); // Hapus dari IndexedDB jika berhasil
    }
  }
});
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }
      this.stream = null;
    }
  }

  destroy() {
    this.stopCamera();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
