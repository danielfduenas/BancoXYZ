import { format, parseISO } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth"; // Importamos useAuth
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

  // Filtros de búsqueda
  const [searchName, setSearchName] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // 1. Obtener el historial desde la API (Controlado de forma segura)
  const fetchTransferList = useCallback(async () => {
    // Si el contexto global ya tiene datos (por ejemplo, de una carga previa),
    // simplemente los usamos y evitamos encender el loader o llamar a la API
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
      setIsLoading(false); // Ahora sí garantizamos que siempre se apague correctamente
    }
    // 💡 Quitamos 'history' de las dependencias para evitar re-disparos infinitos al mutar el estado
  }, [setHistory]);

  useEffect(() => {
    fetchTransferList();
  }, [fetchTransferList]);

  // 2. Lógica de filtrado combinada (Se mantiene igual, escuchando a 'history')
  useEffect(() => {
    let result = history;

    if (searchName.trim() !== "") {
      result = result.filter((item) =>
        item.payeer?.name?.toLowerCase().includes(searchName.toLowerCase()),
      );
    }

    if (searchValue.trim() !== "") {
      result = result.filter((item) =>
        item.value.toString().includes(searchValue),
      );
    }

    if (searchDate.trim() !== "") {
      result = result.filter((item) => {
        try {
          const formattedItemDate = format(parseISO(item.date), "dd/MM/yyyy");
          return (
            item.date.includes(searchDate) ||
            formattedItemDate.includes(searchDate)
          );
        } catch {
          return item.date.includes(searchDate);
        }
      });
    }

    setFilteredTransfers(result);
  }, [searchName, searchValue, searchDate, history]);

  // Función para dar formato de moneda limpio
  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  };

  // Función para dar formato visual legible a las fechas
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
        <Text style={styles.destinatarioName}>
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
      {/* Contenedor de Filtros */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filtrar transferencias:</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="🔎 Buscar por nombre..."
          value={searchName}
          onChangeText={setSearchName}
        />
        <View style={styles.rowFilters}>
          <TextInput
            style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
            placeholder="💰 Por monto..."
            value={searchValue}
            onChangeText={setSearchValue}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.filterInput, { flex: 1 }]}
            placeholder="📅 Por fecha (dd/mm/aaaa)..."
            value={searchDate}
            onChangeText={setSearchDate}
          />
        </View>
      </View>

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
              No se encontraron transferencias realizadas.
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
  },
  rowFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  destinatarioName: {
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
