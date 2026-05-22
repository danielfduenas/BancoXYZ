import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0052cc",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="homeScreen" options={{ title: "Inicio / Saldo" }} />
      <Stack.Screen
        name="transferScreen"
        options={{ title: "Realizar Transferencia" }}
      />
      <Stack.Screen
        name="historyScreen"
        options={{ title: "Historial de Transferencias" }}
      />
    </Stack>
  );
}
