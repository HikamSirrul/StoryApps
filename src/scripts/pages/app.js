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

    // Tambahkan tombol push notification jika bukan di halaman login/register
    if (!isAuthPage) {
      setTimeout(() => addPushNotificationButton(this.#content), 0);
    }
  }

  get content() {
    return this.#content;
  }
}

// Fungsi konversi VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Fungsi menambahkan tombol push notification ke halaman
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

  container.appendChild(btn);

  setTimeout(() => {
    const buttonEl = document.getElementById('enablePushBtn');
    if (!buttonEl) return;

    buttonEl.addEventListener('click', async () => {
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

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          alert('Notifikasi sudah diaktifkan sebelumnya.');
          buttonEl.style.display = 'none';
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log('[Push] Subscription berhasil:', subscription);

        await fetch('/StoryApps/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });

        alert('Notifikasi berhasil diaktifkan!');
        buttonEl.style.display = 'none';
      } catch (error) {
        console.error('[Push] Gagal berlangganan:', error);
        alert('Gagal mengaktifkan notifikasi.');
      }
    });
  }, 0); // Pastikan tombol benar-benar sudah di-DOM
}

// Registrasi Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/StoryApps/sw.js');
      console.log('[SW] Registered:', registration.scope);
    } catch (err) {
      console.error('[SW] Gagal registrasi:', err);
    }
  });
}

export default App;
