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
      <Stack.Screen name="index" options={{ title: "Inicio / Saldo" }} />
      <Stack.Screen
        name="transfer"
        options={{ title: "Realizar Transferencia" }}
      />
      <Stack.Screen
        name="history"
        options={{ title: "Historial de Transferencias" }}
      />
    </Stack>
  );
}
