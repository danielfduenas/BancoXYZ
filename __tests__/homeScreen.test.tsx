import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";
import HomeScreen from "../app/(home)/homeScreen";
import { useAuth } from "../src/hooks/useAuth";
import { bankApi } from "../src/services/api";

jest.mock("../src/hooks/useAuth");

// 2. Simular el cliente HTTP de la API del banco
jest.mock("../src/services/api", () => ({
  bankApi: {
    get: jest.fn(),
  },
}));

// 3. Simular el enrutador de Expo Router para el botón de salir
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("Pruebas Unitarias - HomeScreen (Saldo y Flujos)", () => {
  const mockLogout = jest.fn();
  const mockUser = { id: 1, name: "Gabriel Topaz", email: "gabriel@topaz.com" };

  const renderWithAuth = (ui: React.ReactElement) => {
    const useAuthMock = useAuth as jest.Mock;

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const [balance, setBalance] = React.useState(0);

      useAuthMock.mockImplementation(() => ({
        user: mockUser,
        logout: mockLogout,
        balance,
        setBalance,
        history: [],
        setHistory: jest.fn(),
        token: null,
        isLoading: false,
        login: jest.fn(),
      }));

      return <>{children}</>;
    };

    return render(ui, { wrapper: Wrapper });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe mostrar el saludo al usuario y renderizar el saldo correctamente en moneda local", async () => {
    // Simular la respuesta HTTP exitosa del endpoint /balance provisto en el documento
    const mockBalanceResponse = {
      data: {
        currency: "BRL",
        accountBalance: 1500.5,
      },
    };
    (bankApi.get as jest.Mock).mockResolvedValue(mockBalanceResponse);

    renderWithAuth(<HomeScreen />);

    // Verificar que salude al usuario autenticado usando su nombre
    expect(screen.getByText("Gabriel Topaz")).toBeTruthy();

    // Esperar a que la promesa de la API se resuelva y el componente aplique Intl.NumberFormat
    await waitFor(() => {
      // Usamos una expresión regular para buscar el monto formateado de manera flexible (1.500,50)
      expect(screen.getByText(/1\.500,50/)).toBeTruthy();
    });
  });

  it("debe ejecutar el flujo de handleLogout y redirección al presionar el botón Salir", async () => {
    // Evitar que el fetch inicial falle rompiendo el test
    (bankApi.get as jest.Mock).mockResolvedValue({
      data: { currency: "BRL", accountBalance: 0 },
    });

    renderWithAuth(<HomeScreen />);

    // Buscar el botón por su texto e interactuar con él
    const logoutButton = screen.getByText("Salir");
    fireEvent.press(logoutButton);

    // Verificar que se llame de forma secuencial a la limpieza del contexto y luego a la redirección raíz
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("debe forzar el cierre de sesión si el endpoint responde con un error 401 (Unauthorized)", async () => {
    // Simular el escenario de Token inválido o expirado que describe el documento técnico
    const mockError401 = {
      response: { status: 401 },
    };
    (bankApi.get as jest.Mock).mockRejectedValue(mockError401);

    renderWithAuth(<HomeScreen />);

    // El componente debe proteger al usuario cerrando la sesión automáticamente
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
