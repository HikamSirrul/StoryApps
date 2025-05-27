import AuthApi from '../../data/auth-api';

const RegisterPresenter = {
  async register(userData) {
    return await AuthApi.register(userData);
  }
};

export default RegisterPresenter;
