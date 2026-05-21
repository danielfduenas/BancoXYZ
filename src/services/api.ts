import axios from "axios";

export const authApi = axios.create({
  baseURL: "https://qf5k9fspl0.execute-api.us-east-1.amazonaws.com/default",
});

export const bankApi = axios.create();

// Interceptor para inyectar el token dinámicamente en las peticiones de saldo y transferencias
bankApi.interceptors.request.use(async (config) => {
  // Aquí se recupera el token (por ejemplo, de un contexto de autenticación o SecureStore)
  const token = "fake-jwt-token"; // O el token real obtenido del login

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
