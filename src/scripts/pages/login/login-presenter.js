import AuthApi from '../../data/auth-api';

const LoginPresenter = {
  async login(credentials) {
    return await AuthApi.login(credentials);
  }
};

export default LoginPresenter;
