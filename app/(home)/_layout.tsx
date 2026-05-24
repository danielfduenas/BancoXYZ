import LogoXYZ from "@/src/components/LogoXYZwhite";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

export default function HomeLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0052cc" translucent={false} />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0052cc",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 16,
          },
          headerRight: () => (
            <View style={styles.headerLogoContainer}>
              <LogoXYZ height={50} width={150} />
            </View>
          ),
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0052cc",
    paddingTop: 10,
  },
  headerLogoContainer: {
    width: 160,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -30 }],
  },
});
