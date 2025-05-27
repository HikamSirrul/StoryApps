import RegisterPresenter from './register-presenter';

class RegisterPage {
  async render() {
    return `
      <a href="#main-content" class="skip-link">Lewati ke konten utama</a>
      <main id="main-content" tabindex="-1">
        <section class="register-section">
          <div class="register-container">
            <div class="register-header">
              <i class="fas fa-user-plus register-icon" aria-hidden="true"></i>
              <h2 class="register-title">Create an Account</h2>
              <p class="register-subtitle">Join us and share your stories</p>
            </div>
            
            <form id="registerForm" class="register-form" role="form">
              <div class="input-group">
                <label for="name" class="input-label">
                  <i class="fas fa-user" aria-hidden="true"></i> Name
                </label>
                <input 
                  id="name" 
                  type="text" 
                  name="name" 
                  class="form-input"
                  required
                  aria-label="Full Name"
                >
              </div>
              
              <div class="input-group">
                <label for="email" class="input-label">
                  <i class="fas fa-envelope" aria-hidden="true"></i> Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  class="form-input"
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
                  required
                  minlength="8"
                  aria-label="Password"
                >
              </div>
              
              <button type="submit" class="register-button">
                <i class="fas fa-user-plus" aria-hidden="true"></i> Register
              </button>
            </form>
            
            <div class="register-footer">
              <p id="registerMessage" class="message"></p>
              <p class="login-prompt">
                Already have an account? <a href="#/login" class="login-link">Login here</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#registerForm');
    const message = document.querySelector('#registerMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.name.value;
      const email = form.email.value;
      const password = form.password.value;

      const result = await RegisterPresenter.register({ name, email, password });
      message.textContent = result.message;

      if (!result.error) {
        form.reset();
      }
    });
  }
}

export default RegisterPage;
