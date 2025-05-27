import LoginPresenter from './login-presenter';

class LoginPage {
  async render() {
    return `
      <a href="#main-content" class="skip-link">Lewati ke konten utama</a>
      <main id="main-content" tabindex="-1">
        <section class="login-section">
          <div class="login-container">
            <div class="login-header">
              <i class="fas fa-user-circle login-icon" aria-hidden="true"></i>
              <h2 class="login-title">Welcome to StoryApp</h2>
              <p class="login-subtitle">Share your stories with the world</p>
            </div>
            
            <form id="loginForm" class="login-form" role="form">
              <div class="input-group">
                <label for="email" class="input-label">
                  <i class="fas fa-envelope" aria-hidden="true"></i> Email Address
                </label>
                <input 
                  id="email" 
                  type="email" 
                  name="email" 
                  class="form-input"
                  placeholder="your@email.com"
                  required
                  aria-label="Email address"
                >
              </div>
              
              <div class="input-group">
                <label for="password" class="input-label">
                  <i class="fas fa-lock" aria-hidden="true"></i> Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  class="form-input"
                  placeholder="••••••••"
                  required
                  aria-label="Password"
                >
              </div>
              
              <button type="submit" class="login-button">
                <i class="fas fa-sign-in-alt" aria-hidden="true"></i> Sign In
              </button>
            </form>
            
            <div class="login-footer">
              <p id="loginMessage" class="message"></p>
              <p class="register-prompt">
                Don't have an account? <a href="#/register" class="register-link">Register here</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);

    const form = document.querySelector('#loginForm');
    const message = document.querySelector('#loginMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value;
      const password = form.password.value;

      const result = await LoginPresenter.login({ email, password });
      message.textContent = result.message;

      if (!result.error) {
        localStorage.setItem('authToken', result.loginResult.token);
        window.location.hash = '/';
      }
    });
  }
}

export default LoginPage;
