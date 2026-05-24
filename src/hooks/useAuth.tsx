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
  balance: number;
  history: TransferItem[];
  isBalanceLoaded: boolean; // Bandera para saber si el saldo ya se cargó alguna vez
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  setHistory: React.Dispatch<React.SetStateAction<TransferItem[]>>;
  setIsBalanceLoaded: React.Dispatch<React.SetStateAction<boolean>>; // Setter de la bandera
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<TransferItem[]>([]);

  //  Control de carga inicial independiente del valor numérico
  const [isBalanceLoaded, setIsBalanceLoaded] = useState<boolean>(false);

  // Cargar y VALIDAR la sesión al iniciar la app
  useEffect(() => {
    const loadAndValidateStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("userToken");
        const storedUser = await SecureStore.getItemAsync("userData");

        if (storedToken && storedUser) {
          // 1. Inyección temporal del token en Axios para la verificación
          // (Ajusta 'authApi' según los headers compartidos)
          authApi.defaults.headers.common["Authorization"] =
            `Bearer ${storedToken}`;

          try {
            // 2. Petición rápida de verificación al servidor.
            // Se usa /balance porque requiere token obligatorio y nos sirve como termómetro de validez.
            const response = await authApi.get("/balance");

            // Si el servidor responde con éxito, el token sigue vigente:
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setBalance(response.data.accountBalance); // Se precarga el saldo de una vez
            setIsBalanceLoaded(true); // Se cargó con éxito en el inicio
          } catch (apiError: any) {
            // 3. Si el servidor dice que el token caducó (401), se limpia todo de inmediato
            console.log(
              "Token local expirado en el servidor, limpiando credenciales...",
            );
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userData");
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error(
          "Error en el proceso de verificación de autenticación",
          e,
        );
      } finally {
        setIsLoading(false); // Apagamos el splash screen / loader raíz
      }
    };

    loadAndValidateStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Petición al endpoint del documento
      const response = await authApi.post("/login", { email, password });
      const { token: resToken, user: resUser } = response.data;

      // Guardar en el estado
      setToken(resToken);
      setUser(resUser);
      setIsBalanceLoaded(false); // Reseteamos al loguear para que el homeScreen descargue el saldo fresco

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
    setIsBalanceLoaded(false); // Limpiamos la bandera al cerrar sesión
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
        isBalanceLoaded, // Compartimos la bandera
        login,
        logout,
        setBalance,
        setHistory,
        setIsBalanceLoaded, // Compartimos el setter
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
