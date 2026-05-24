import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { bankApi } from "../../src/services/api";

interface Payeer {
  document: string;
  name: string;
}

interface TransferItem {
  value: number;
  date: string;
  currency: string;
  payeer: Payeer;
}

export default function HistoryScreen() {
  const { history, setHistory } = useAuth();
  const [filteredTransfers, setFilteredTransfers] = useState<TransferItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  //  Filtros de búsqueda con Rangos de Montos y Fecha por Objeto Date
  const [searchName, setSearchName] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchTransferList = useCallback(async () => {
    if (history.length > 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await bankApi.get(
        "https://n0qaa2fx3c.execute-api.us-east-1.amazonaws.com/default/transferList",
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setHistory(data);
    } catch (error: any) {
      Alert.alert("Error", "No se pudo cargar el historial de transferencias.");
    } finally {
      setIsLoading(false);
    }
  }, [setHistory]);

  useEffect(() => {
    fetchTransferList();
  }, [fetchTransferList]);

  // Manejador del cambio de fecha en el Picker
  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  // Lógica de filtrado con rangos matemáticos y fechas normalizadas
  useEffect(() => {
    let result = history;

    // 1. Filtrar por Nombre del Destinatario
    if (searchName.trim() !== "") {
      result = result.filter((item) =>
        item.payeer?.name?.toLowerCase().includes(searchName.toLowerCase()),
      );
    }

    // 2. Filtrar por Monto Mínimo
    if (minPrice.trim() !== "") {
      const min = parseFloat(minPrice.replace(",", "."));
      if (!isNaN(min)) {
        result = result.filter((item) => item.value >= min);
      }
    }

    // 3. Filtrar por Monto Máximo
    if (maxPrice.trim() !== "") {
      const max = parseFloat(maxPrice.replace(",", "."));
      if (!isNaN(max)) {
        result = result.filter((item) => item.value <= max);
      }
    }

    // 4. Filtrar por Fecha exacta seleccionada en el DatePicker
    if (selectedDate !== null) {
      const targetDateStr = format(selectedDate, "yyyy-MM-dd"); // Formato estándar de tu API
      result = result.filter((item) => item.date.includes(targetDateStr));
    }

    setFilteredTransfers(result);
  }, [searchName, minPrice, maxPrice, selectedDate, history]);

  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  };

  const formatDateStr = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: TransferItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nameText}>
          {item.payeer?.name || "Destinatario Desconocido"}
        </Text>
        <Text style={styles.transferValue}>
          {formatCurrency(item.value, item.currency)}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.documentText}>Doc: {item.payeer?.document}</Text>
        <Text style={styles.dateText}>{formatDateStr(item.date)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Contenedor de Filtros Avanzados */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filtros Avanzados:</Text>

        <TextInput
          style={styles.filterInput}
          placeholder="Buscar por nombre..."
          value={searchName}
          onChangeText={setSearchName}
        />

        {/* Fila de Rangos de Montos */}
        <View style={styles.rowFilters}>
          <TextInput
            style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
            placeholder="Monto mínimo..."
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.filterInput, { flex: 1 }]}
            placeholder="Monto máximo..."
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
          />

          {/* Fila del Selector de Fecha Dinámico */}
          <TouchableOpacity
            style={[
              styles.dateSelectorButton,
              { flex: 3, marginRight: selectedDate ? 8 : 0 },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateSelectorText}>
              {selectedDate
                ? format(selectedDate, "dd/MM/yyyy")
                : "Filtrar por fecha"}
            </Text>
          </TouchableOpacity>

          {/* Botón condicional para eliminar el filtro de fecha */}
          {selectedDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={styles.clearDateText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Control Nativo del DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          testID="history-date-picker"
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
        />
      )}

      {/* Listado de Resultados */}
      {isLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#0052cc" />
        </View>
      ) : (
        <FlatList
          data={filteredTransfers}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No se encontraron transferencias con los filtros aplicados.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  filterContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  filterInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#fafafa",
    fontSize: 14,
    color: "#1a1a1a",
  },
  rowFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateSelectorButton: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 4,
    marginLeft: 8,
  },
  dateSelectorText: {
    fontSize: 14,
    color: "#555",
  },
  clearDateButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#ffebe6",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  clearDateText: {
    color: "#de350b",
    fontWeight: "600",
    fontSize: 14,
  },
  centerLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    flex: 1,
  },
  transferValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#de350b",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentText: {
    fontSize: 12,
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
    fontSize: 14,
  },
});
