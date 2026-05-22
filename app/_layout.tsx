import { Slot, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";

function InitialLayout() {
  const { token, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Pequeño ciclo para asegurar que el motor de navegación de Expo esté listo
  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup =
      pathname.startsWith("/homeScreen") ||
      pathname.includes("transferScreen") ||
      pathname.includes("historyScreen");

    if (!token && inAuthGroup) {
      // Si no hay token, va al Login
      router.replace("/");
    } else if (token && pathname === "/") {
      // Si hay token y está en el Login, lo mandamos directo a la nueva ruta limpia
      router.replace("/homeScreen" as any);
    }
  }, [token, isLoading, pathname, isNavigationReady]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0052cc" />
      </View>
    );
  }

  return <Slot />;
}

// El RootLayout se encarga UNICAMENTE de envolver la app
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
