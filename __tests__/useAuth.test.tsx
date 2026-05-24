import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";
import { authApi } from "../src/services/api";

// 1. Simular dependencias externas
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../src/services/api", () => ({
  authApi: {
    post: jest.fn(),
    get: jest.fn().mockResolvedValue({ data: { accountBalance: 0 } }),
    defaults: { headers: { common: {} } },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("Pruebas Unitarias - useAuth Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe inicializarse con valores nulos si no hay sesión guardada", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Esperamos a que termine el useEffect interno de carga
    await act(async () => {});

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("debe cargar los datos automáticamente si existen en SecureStore", async () => {
    const mockToken = "fake-jwt-token";
    const mockUser = {
      id: 1,
      name: "Gabriel Topaz",
      email: "gabriel@topaz.com",
    };

    (SecureStore.getItemAsync as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === "userToken") return Promise.resolve(mockToken);
        if (key === "userData")
          return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      },
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it("debe realizar login exitoso, actualizar el estado y guardar en el almacenamiento seguro", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const mockApiResponse = {
      data: {
        token: "xyz-new-token",
        user: { id: 1, name: "Gabriel Topaz", email: "gabriel@topaz.com" },
      },
    };
    (authApi.post as jest.Mock).mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {}); // saltar carga inicial

    await act(async () => {
      await result.current.login("gabriel@topaz.com", "1111");
    });

    // Validar estado de la app
    expect(result.current.token).toBe("xyz-new-token");
    expect(result.current.user?.name).toBe("Gabriel Topaz");

    // Validar persistencia cifrada
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "userToken",
      "xyz-new-token",
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "userData",
      JSON.stringify(mockApiResponse.data.user),
    );
  });

  it("debe manejar errores de inicio de sesión fallido de la API", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const mockError = {
      response: {
        data: { message: "Credenciales incorrectas" },
      },
    };
    (authApi.post as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await expect(
        result.current.login("wrong@email.com", "0000"),
      ).rejects.toThrow("Credenciales incorrectas");
    });

    // El estado debe permanecer vacío
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("debe borrar los datos del dispositivo al cerrar sesión", async () => {
    // Empezar con sesión cargada
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === "userToken") return Promise.resolve("some-token");
        return Promise.resolve(JSON.stringify({ id: 1 }));
      },
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("userToken");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("userData");
  });
});
