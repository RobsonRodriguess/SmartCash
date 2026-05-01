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

// --- Insights ---

export const getInsights = async () => {
  const { data } = await api.get('/insights');
  return data;
};
