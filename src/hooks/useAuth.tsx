import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
}

// Interfaz para estructurar los elementos del historial
interface TransferItem {
  value: number;
  date: string;
  currency: string;
  payeer: {
    document: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  balance: number; // ✨ NUEVO: Saldo reactivo global
  history: TransferItem[]; // ✨ NUEVO: Historial reactivo global
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setBalance: React.Dispatch<React.SetStateAction<number>>; // ✨ NUEVO: Setter de saldo
  setHistory: React.Dispatch<React.SetStateAction<TransferItem[]>>; // ✨ NUEVO: Setter de historial
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Nuevos estados para simular persistencia en memoria durante la sesión
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<TransferItem[]>([]);

  // Cargar el token guardado al iniciar la app
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("userToken");
        const storedUser = await SecureStore.getItemAsync("userData");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Error cargando datos de autenticación", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Petición al endpoint del documento
      const response = await authApi.post("/login", { email, password });
      const { token: resToken, user: resUser } = response.data;

      // Guardar en el estado
      setToken(resToken);
      setUser(resUser);

      // Persistir de forma segura en el dispositivo
      await SecureStore.setItemAsync("userToken", resToken);
      await SecureStore.setItemAsync("userData", JSON.stringify(resUser));
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Credenciales incorrectas",
      );
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setBalance(0); //  Limpia el saldo al cerrar sesión
    setHistory([]); //  Limpia el historial al cerrar sesión
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        balance,
        history,
        login,
        logout,
        setBalance,
        setHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
