// __tests__/transferScreen.test.tsx
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";
import TransferScreen from "../app/(home)/transferScreen";
import { bankApi } from "../src/services/api";

// 1. Simular el cliente HTTP de la API
jest.mock("../src/services/api", () => ({
  bankApi: {
    post: jest.fn(),
  },
}));

// 2. Simular el enrutador de Expo Router
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Spy para interceptar las alertas nativas de validación y éxito
const alertSpy = jest.spyOn(Alert, "alert");

describe("Pruebas Unitarias - TransferScreen (Formulario de Envíos)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe renderizar todos los campos iniciales obligatorios y el botón de envío inmediato", () => {
    render(<TransferScreen />);

    // Verificar existencia de etiquetas y campos de texto
    expect(screen.getByText("Documento del Destinatario *")).toBeTruthy();
    expect(screen.getByText("Monto a Transferir (BRL) *")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ej: 12345678900")).toBeTruthy();
    expect(screen.getByPlaceholderText("0.00")).toBeTruthy();

    // El botón por defecto debe sugerir un envío inmediato
    expect(screen.getByText("Transferir Ahora")).toBeTruthy();

    // El selector de fecha no debe ser visible de entrada (programación opcional)
    expect(screen.queryByText("Fecha de Transferencia *")).toBeNull();
  });

  it("debe mostrar una alerta de error si el usuario intenta transferir con campos vacíos", async () => {
    render(<TransferScreen />);

    const submitButton = screen.getByText("Transferir Ahora");
    fireEvent.press(submitButton);

    // Debe detener la ejecución y alertar al usuario
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Por favor, completa todos los campos obligatorios.",
    );
    expect(bankApi.post).not.toHaveBeenCalled();
  });

  it("debe procesar exitosamente la transferencia inmediata enviando la llave corregida payeerDocument", async () => {
    // Simular que el servidor responde con éxito (200 OK)
    (bankApi.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: { status: "success" },
    });

    render(<TransferScreen />);

    // Rellenar los campos de texto del formulario
    const docInput = screen.getByPlaceholderText("Ej: 12345678900");
    const valueInput = screen.getByPlaceholderText("0.00");

    fireEvent.changeText(docInput, "03490758066");
    fireEvent.changeText(valueInput, "150.50");

    // Presionar el botón de envío
    const submitButton = screen.getByText("Transferir Ahora");
    fireEvent.press(submitButton);

    // Esperar a que se resuelva la lógica asíncrona de Axios
    await waitFor(() => {
      // 🔎 Verificación del Contrato Técnico: Debe usar 'payeerDocument' en CamelCase
      expect(bankApi.post).toHaveBeenCalledWith(
        "https://ofqx4zxgcf.execute-api.us-east-1.amazonaws.com/default/transfer",
        expect.objectContaining({
          value: 150.5,
          currency: "BRL",
          payeerDocument: "03490758066",
          transferDate: expect.any(String), // Valida que viaje un string de fecha (AAAA-MM-DD)
        }),
      );

      // Debe notificar el éxito en pantalla
      expect(alertSpy).toHaveBeenCalledWith(
        "Éxito",
        "Transferencia procesada con éxito.",
        expect.any(Array),
      );
    });

    // Simular el clic en el botón 'OK' de la alerta para verificar que redirige al homeScreen
    const alertActions = alertSpy.mock.calls[0][2];
    if (alertActions && alertActions[0]?.onPress) {
      alertActions[0].onPress();
      expect(mockReplace).toHaveBeenCalledWith("/homeScreen");
    }
  });
});
