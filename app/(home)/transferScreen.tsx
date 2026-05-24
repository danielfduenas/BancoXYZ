import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { bankApi } from "../../src/services/api";

export default function TransferScreen() {
  const router = useRouter();
  // Extraer 'history' para poder escanear los nombres existentes
  const { balance, setBalance, history, setHistory } = useAuth();

  const [value, setValue] = useState("");
  const [document, setDocument] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTransfer = async () => {
    // Tratamiento de caracteres numéricos limpios para el cálculo matemático
    const cleanValue = value.replace(",", ".");
    const numericValue = parseFloat(cleanValue);

    // Validaciones de negocio básicas
    if (!value || !document) {
      Alert.alert(
        "Error",
        "Por favor, completa todos los campos obligatorios.",
      );
      return;
    }

    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert("Error", "Por favor, ingresa un monto válido mayor a cero.");
      return;
    }

    // Bloqueo de seguridad local si excede los fondos disponibles
    if (numericValue > balance) {
      Alert.alert(
        "Error",
        "Fondos insuficientes para completar esta transferencia.",
      );
      return;
    }

    // Definir la fecha final del envío
    let finalTransferDate = new Date();

    if (isScheduled) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        Alert.alert(
          "Error",
          "La fecha programada no puede ser anterior a hoy.",
        );
        return;
      }
      finalTransferDate = date;
    }

    setIsSubmitting(true);

    try {
      const formattedDate = format(
        isScheduled ? finalTransferDate : new Date(),
        "yyyy-MM-dd",
      );

      const requestBody = {
        value: numericValue,
        currency: "BRL",
        payeerDocument: document,
        transferDate: formattedDate,
      };

      // LOG de inspección previo al envío
      console.log(
        "Cuerpo enviado a la API:",
        JSON.stringify(requestBody, null, 2),
      );

      const response = await bankApi.post(
        "https://ofqx4zxgcf.execute-api.us-east-1.amazonaws.com/default/transfer",
        requestBody,
      );

      console.log("Status Code recibido:", response.status);

      // Buscar si el destinatario ya existe en el historial cargado para clonar su nombre
      const existingTx = history.find((tx) => tx.payeer?.document === document);
      const resolvedName =
        existingTx?.payeer?.name || `Destinatario (Doc: ${document})`;

      // Modificaciones locales reactivas si la petición es exitosa
      // 1. Reducir el balance local de forma síncrona
      setBalance((prevBalance) => prevBalance - numericValue);

      // 2. Insertar el nuevo movimiento simulado al tope de la lista usando el nombre resuelto
      setHistory((prevHistory) => [
        {
          value: numericValue,
          date: formattedDate,
          currency: "BRL",
          payeer: {
            document: document,
            name: resolvedName, // Nombre dinámico no quemado
          },
        },
        ...prevHistory,
      ]);

      Alert.alert("Éxito", "Transferencia procesada con éxito.", [
        {
          text: "OK",
          onPress: () => {
            setValue("");
            setDocument("");
            router.replace("/homeScreen" as any);
          },
        },
      ]);
    } catch (error: any) {
      // LOG de inspección en caso de error
      if (error.response) {
        console.log("Detalle del Bad Request (Data):", error.response.data);
        console.log("Status Code recibido:", error.response.status);
      } else {
        console.log("Error de red o configuración:", error.message);
      }

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Hubo un problema al procesar la transferencia.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Documento del Destinatario *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 12345678900"
        value={document}
        onChangeText={setDocument}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Monto a Transferir (BRL) *</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
      />

      {/* Fila del Switch para activar/desactivar la programación */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>
          ¿Deseas programar esta transferencia para el futuro?
        </Text>
        <Switch
          value={isScheduled}
          onValueChange={(newValue) => {
            setIsScheduled(newValue);
            if (newValue) setDate(new Date());
          }}
          trackColor={{ false: "#767577", true: "#a5c5f5" }}
          thumbColor={isScheduled ? "#0052cc" : "#f4f3f4"}
        />
      </View>

      {/* Renderizado condicional del selector de fecha */}
      {isScheduled && (
        <View>
          <Text style={styles.label}>Fecha de Transferencia *</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{format(date, "dd/MM/yyyy")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && isScheduled && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleTransfer}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isScheduled ? "Agendar Transferencia" : "Transferir Ahora"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 16,
  },
  dateSelector: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
  },
  dateText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  button: {
    backgroundColor: "#0052cc",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  buttonDisabled: {
    backgroundColor: "#a5c5f5",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
