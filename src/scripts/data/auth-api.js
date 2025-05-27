class AuthApi {
  static async register({ name, email, password }) {
    const response = await fetch('https://story-api.dicoding.dev/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  }

  static async login({ email, password }) {
    const response = await fetch('https://story-api.dicoding.dev/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }
}

export default AuthApi;
