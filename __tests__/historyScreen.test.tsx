import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";
import React from "react";
import HistoryScreen from "../app/(home)/historyScreen";
import { useAuth } from "../src/hooks/useAuth";
import { bankApi } from "../src/services/api";

// 1. Simular el hook de autenticación global
jest.mock("../src/hooks/useAuth");

// 2. Simular el cliente HTTP de la API
jest.mock("../src/services/api", () => ({
  bankApi: {
    get: jest.fn(),
  },
}));

// Datos simulados (Mock Data) para las pruebas
const mockTransfersBase = [
  {
    value: 150.0,
    date: "2026-05-20",
    currency: "BRL",
    payeer: { document: "11122233344", name: "Gabriel Topaz" },
  },
  {
    value: 500.5,
    date: "2026-05-21",
    currency: "BRL",
    payeer: { document: "55566677788", name: "Ana Silva" },
  },
  {
    value: 1200.0,
    date: "2026-05-22",
    currency: "BRL",
    payeer: { document: "99900011122", name: "Carlos Souza" },
  },
];

describe("Pruebas Unitarias - HistoryScreen (Filtros Avanzados)", () => {
  const mockSetHistory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe consultar la API e inicializar el historial si el contexto está vacío", async () => {
    // Escenario: history viene inicialmente vacío []
    (useAuth as jest.Mock).mockReturnValue({
      history: [],
      setHistory: mockSetHistory,
    });
    (bankApi.get as jest.Mock).mockResolvedValue({ data: mockTransfersBase });

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(bankApi.get).toHaveBeenCalledWith(
        "https://n0qaa2fx3c.execute-api.us-east-1.amazonaws.com/default/transferList",
      );
      expect(mockSetHistory).toHaveBeenCalledWith(mockTransfersBase);
    });
  });

  it("debe filtrar correctamente las transacciones por el nombre del destinatario", async () => {
    // Escenario: El contexto ya tiene datos cargados (no llama a la API)
    (useAuth as jest.Mock).mockReturnValue({
      history: mockTransfersBase,
      setHistory: mockSetHistory,
    });

    render(<HistoryScreen />);

    // Verificar que inicialmente se ven todos los registros
    expect(screen.getByText("Gabriel Topaz")).toBeTruthy();
    expect(screen.getByText("Ana Silva")).toBeTruthy();

    // Interactuar con el filtro de nombre
    const nameInput = screen.getByPlaceholderText("Buscar por nombre...");
    fireEvent.changeText(nameInput, "Ana");

    // Deben filtrarse los elementos reactivamente
    expect(screen.getByText("Ana Silva")).toBeTruthy();
    expect(screen.queryByText("Gabriel Topaz")).toBeNull();
  });

  it("debe filtrar de forma cruzada por rango de montos (Mínimo y Máximo)", () => {
    (useAuth as jest.Mock).mockReturnValue({
      history: mockTransfersBase,
      setHistory: mockSetHistory,
    });

    render(<HistoryScreen />);

    const minInput = screen.getByPlaceholderText("Monto mínimo...");
    const maxInput = screen.getByPlaceholderText("Monto máximo...");

    // Aplicar rango entre 200 y 600 BRL
    fireEvent.changeText(minInput, "200");
    fireEvent.changeText(maxInput, "600");

    // El único que cumple con el rango (200 <= 500.50 <= 600) es Ana Silva
    expect(screen.getByText("Ana Silva")).toBeTruthy();
    expect(screen.queryByText("Gabriel Topaz")).toBeNull(); // Vale 150
    expect(screen.queryByText("Carlos Souza")).toBeNull(); // Vale 1200
  });

  it("debe mostrar el mensaje de error de filtros si no hay coincidencias", () => {
    (useAuth as jest.Mock).mockReturnValue({
      history: mockTransfersBase,
      setHistory: mockSetHistory,
    });

    render(<HistoryScreen />);

    const minInput = screen.getByPlaceholderText("Monto mínimo...");
    fireEvent.changeText(minInput, "99999"); // Monto absurdamente alto

    expect(
      screen.getByText(
        "No se encontraron transferencias con los filtros aplicados.",
      ),
    ).toBeTruthy();
  });

  it("debe abrir el DatePicker al pulsar el botón de fecha", () => {
    // Nota: El DateTimePicker nativo es complejo de evaluar en entornos simulados de Node (sin UI real),
    // pero podemos asegurar que el botón dispara el cambio de estado 'showDatePicker' a true.
    (useAuth as jest.Mock).mockReturnValue({
      history: mockTransfersBase,
      setHistory: mockSetHistory,
    });

    render(<HistoryScreen />);

    const dateButton = screen.getByText("Filtrar por fecha");
    fireEvent.press(dateButton);

    expect(screen.getByTestId("history-date-picker")).toBeTruthy();
  });
});
