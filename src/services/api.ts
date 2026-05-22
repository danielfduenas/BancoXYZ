import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const authApi = axios.create({
  baseURL: "https://qf5k9fspl0.execute-api.us-east-1.amazonaws.com/default",
});

export const bankApi = axios.create({
  baseURL: "https://2k0ic4z7s5.execute-api.us-east-1.amazonaws.com/default",
});

// Interceptor para inyectar dinámicamente el token real o el de pruebas
bankApi.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("userToken");

    // El documento indica que se puede usar 'fake-jwt-token' en ambientes de prueba
    config.headers.Authorization = `Bearer ${token || "fake-jwt-token"}`;
  } catch (error) {
    config.headers.Authorization = "Bearer fake-jwt-token";
  }
  return config;
});
