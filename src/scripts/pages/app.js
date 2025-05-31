import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { VAPID_PUBLIC_KEY } from '../config.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    if (this.#drawerButton && this.#navigationDrawer) {
      this._setupDrawer();
    }
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async renderPage() {
    if (this.currentPage?.destroy) {
      await this.currentPage.destroy();
    }

    const url = getActiveRoute();
    const page = routes[url];
    const isAuthenticated = localStorage.getItem('authToken');

    if (!isAuthenticated && url !== '/login' && url !== '/register') {
      if (window.location.hash !== '#/login') {
        window.location.hash = '/login';
      }
      return;
    }

    const isAuthPage = url === '/login' || url === '/register';
    if (isAuthPage) {
      this.#drawerButton.style.display = 'none';
      this.#navigationDrawer.style.display = 'none';
    } else {
      this.#drawerButton.style.display = 'inline-block';
      this.#navigationDrawer.style.display = 'block';
    }

    if (document.startViewTransition) {
      await document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      });
    } else {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    }

    this.currentPage = page;

    const logoutBtn = document.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        window.location.hash = '/login';
      });
    }
  }

  // Getter untuk akses konten dari luar class
  get content() {
    return this.#content;
  }
}

// Fungsi helper untuk konversi key VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Fungsi menambahkan tombol Push Notification ke DOM
function addPushNotificationButton(container) {
  if (!container) return;
  if (document.getElementById('enablePushBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'enablePushBtn';
  btn.textContent = 'Aktifkan Notifikasi';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1000;
  `;

  btn.addEventListener('click', async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Browser Anda tidak mendukung Push Notification.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Izin notifikasi ditolak');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[Push] Subscription baru:', subscription);

      // Kirim subscription ke server jika diperlukan
      await fetch('/StoryApps/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      alert('Notifikasi berhasil diaktifkan!');
      btn.style.display = 'none'; // sembunyikan tombol setelah aktif
    } catch (error) {
      console.error('[Push] Gagal berlangganan:', error);
      alert('Gagal mengaktifkan notifikasi.');
    }
  });

  container.appendChild(btn);
}

// Override renderPage untuk menambahkan tombol push notification setelah halaman selesai dirender
const originalRenderPage = App.prototype.renderPage;
App.prototype.renderPage = async function () {
  await originalRenderPage.apply(this);

  const url = getActiveRoute();
  if (url !== '/login' && url !== '/register') {
    addPushNotificationButton(this.content);
  }
};

// Registrasi Service Worker dan subscribe otomatis (jika belum subscribe)
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/StoryApps/sw.js');
      console.log('[SW] Registered:', registration.scope);

      const existing = await registration.pushManager.getSubscription();
      if (!existing) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('[Push] Subscription berhasil');
        // Kirim subscription ke server jika perlu
      } else {
        console.log('[Push] Sudah berlangganan');
      }
    } catch (err) {
      console.error('[Push] Gagal:', err);
    }
  });
}

export default App;
