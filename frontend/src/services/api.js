import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// injects JWT into all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---

export const googleLogin = async (credential) => {
  const { data } = await api.post('/auth/google', { credential });
  return data;
};

export const register = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/auth/profile', profileData);
  return data.user;
};

export const updatePassword = async (passwordData) => {
  const { data } = await api.put('/auth/password', passwordData);
  return data;
};

// --- Transactions ---

export const getTransactions = async () => {
  const { data } = await api.get('/transactions');
  return data.data;
};

export const createTransaction = async (transactionData) => {
  const { data } = await api.post('/transactions', transactionData);
  return data.data;
};

export const deleteTransaction = async (id) => {
  await api.delete(`/transactions/${id}`);
};

export const updateTransaction = async (id, transactionData) => {
  const { data } = await api.put(`/transactions/${id}`, transactionData);
  return data.data;
};

// --- Insights ---

export const getInsights = async () => {
  const { data } = await api.get('/insights');
  return data;
};

// --- Recuperação de Senha ---

/** Passo 1: envia o código OTP para o e-mail */
export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

/** Passo 2: verifica o código OTP, retorna resetToken */
export const verifyResetCode = async (email, code) => {
  const { data } = await api.post('/auth/verify-reset-code', { email, code });
  return data;
};

/** Passo 3: aplica a nova senha usando o resetToken */
export const resetPassword = async (resetToken, password) => {
  const { data } = await api.put('/auth/reset-password', { resetToken, password });
  return data;
};
