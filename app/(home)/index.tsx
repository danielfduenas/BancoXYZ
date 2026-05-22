import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { bankApi } from "../../src/services/api";

interface BalanceData {
  currency: string;
  accountBalance: number;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await bankApi.get("/balance");
      setBalance(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401) {
        Alert.alert("Sesión expirada", "Por favor, inicia sesión nuevamente.");
        logout();
      } else {
        Alert.alert("Error", "No se pudo obtener el saldo de la cuenta.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Función auxiliar para dar formato de moneda limpio (Ej: R$ 1.500,50)
  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  };

  return (
    <View style={styles.container}>
      {/* Encabezado de Bienvenida */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hola,</Text>
          <Text style={styles.userName}>{user?.name || "Usuario"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta de Saldo */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo disponible</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" style={styles.loader} />
        ) : balance ? (
          <Text style={styles.balanceAmount}>
            {formatCurrency(balance.accountBalance, balance.currency)}
          </Text>
        ) : (
          <Text style={styles.balanceError}>--</Text>
        )}
      </View>

      {/* Acciones Rápidas sugeridas para cumplir el flujo */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsContainer}>
        <View style={styles.placeholderAction}>
          <Text style={styles.actionPlaceholderText}>
            Las opciones de transferencia irán en las pestañas/menú del Tab.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#ffebe6",
  },
  logoutText: {
    color: "#de350b",
    fontWeight: "600",
    fontSize: 14,
  },
  balanceCard: {
    backgroundColor: "#0052cc",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  loader: {
    alignSelf: "flex-start",
    marginTop: 16,
  },
  balanceError: {
    color: "#fff",
    fontSize: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  actionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  placeholderAction: {
    padding: 12,
  },
  actionPlaceholderText: {
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
