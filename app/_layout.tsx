// app/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";

function InitialLayout() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Verificar si el usuario está dentro del grupo protegido (home)
    const inAuthGroup = segments[0] === "(home)";

    if (!token && inAuthGroup) {
      // Si no hay token y quiere entrar al Home, redirigir al Login
      router.replace("/");
    } else if (token && !inAuthGroup) {
      // Si hay token y está en el Login, redirigir al Home
      router.replace("/(home)");
    }
  }, [token, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
