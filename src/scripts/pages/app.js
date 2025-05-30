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
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
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
      document.startViewTransition(async () => {
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
}

// SERVICE WORKER & PUSH NOTIFICATIONS
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/StoryApp/sw.js');
      console.log('[SW] Registered:', registration.scope);

      const existing = await registration.pushManager.getSubscription();
      if (!existing) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('[Push] Subscription berhasil');
        // Kirim subscription ke server jika diperlukan
      } else {
        console.log('[Push] Sudah terlangganan');
      }
    } catch (err) {
      console.error('[Push] Gagal:', err);
    }
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default App;
