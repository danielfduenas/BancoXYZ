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

export default function HomeScreen() {
  // Extraemos balance y setBalance de la única fuente de verdad: el contexto global
  const {
    user,
    logout,
    balance,
    setBalance,
    isBalanceLoaded,
    setIsBalanceLoaded,
  } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Función para manejar el cierre de sesión manual con redirección forzada
  const handleLogout = async () => {
    try {
      console.log("Cerrando sesión y navegando al Login...");
      await logout();
      setTimeout(() => {
        router.replace("/");
      }, 0);
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
    }
  };

  const verifyAndLoadBalance = useCallback(async () => {
    // Si la bandera global dice true, NO SE TOCA LA API.
    if (isBalanceLoaded) return;

    setIsLoading(true);
    try {
      const response = await bankApi.get("/balance");
      // Inyectamos el valor inicial de la API al estado compartido del contexto
      setBalance(response.data.accountBalance);
      setIsBalanceLoaded(true); // Encendemos la bandera global tras la primera descarga exitosa
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isBalanceLoaded, setBalance, setIsBalanceLoaded]);

  useEffect(() => {
    verifyAndLoadBalance();
  }, []); // Se ejecuta una sola vez al montar la pantalla

  // Función auxiliar para dar formato de moneda limpio (Ej: R$ 1.500,50)
  // Ahora forzamos "BRL" por defecto como indica el negocio de la API
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
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
        ) : (
          /* Lee directamente la variable del contexto global reactivo */
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
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
