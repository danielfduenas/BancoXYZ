import { useRouter } from "expo-router";
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
  const router = useRouter(); // Instancia del enrutador
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para manejar el cierre de sesión manual con redirección forzada
  const handleLogout = async () => {
    try {
      console.log("Cerrando sesión y navegando al Login...");
      await logout(); // Limpia los estados y el secureStore
      setTimeout(() => {
        router.replace("/"); // Fuerza al enrutador a mover la vista al Login raíz inmediatamente
      }, 0);
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
    }
  };

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await bankApi.get("/balance");
      setBalance(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        Alert.alert("Error", "No se pudo obtener el saldo.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hola,</Text>
          <Text style={styles.userName}>{user?.name || "Usuario"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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

      {/* Menú de Acciones Rápidas Funcionales */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/transferScreen" as any)}
        >
          <Text style={styles.actionIcon}>💸</Text>
          <Text style={styles.actionText}>Enviar Dinero</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push("/historyScreen" as any)}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Ver Historial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    padding: 24,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 1,
  },
  actionButtonSecondary: {
    marginRight: 0,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0052cc",
  },
});
