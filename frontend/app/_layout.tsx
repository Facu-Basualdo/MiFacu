// Suprimir warnings ANTES de importar expo-notifications
import '../src/utils/suppress-warnings';
// Polyfills and global setup
import '../src/utils/notifications';

import { Stack, useRouter, usePathname } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "../src/constants/theme";
import { useEffect } from "react";

function RootNavigator() {
  const { user, loading } = useAuth();
  const { colorScheme, isDark } = useTheme();
  const theme = Colors[colorScheme];
  const router = useRouter();
  const pathname = usePathname();

  // Handle auth state changes
  useEffect(() => {
    if (loading) return;

    const isLoggedIn = !!user;

    // Si la ruta es "/" o "/index", estamos en el Login
    const isAtLogin = pathname === "/" || pathname === "/index";

    if (!isLoggedIn && !isAtLogin) {
      // Forzar salida inmediata si no hay sesión y no estamos en Login
      router.replace("/");
    } else if (isLoggedIn && isAtLogin) {
      // Si hay sesión y estamos en el Login, ir al dashboard
      router.replace("/(tabs)");
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  // Guard de montaje: Si no hay usuario y se intenta acceder a una ruta protegida,
  // devolvemos null para forzar el desmontaje mientras el useEffect redirige.
  const isPublicRoute = pathname === "/" || pathname === "/index";
  if (!user && !isPublicRoute) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Login */}
        <Stack.Screen name="index" />

        {/* Tabs */}
        <Stack.Screen name="(tabs)" />

        {/* Stack screens */}
        <Stack.Screen name="finales" options={{ presentation: 'card' }} />
        <Stack.Screen name="parciales" options={{ presentation: 'card' }} />
        <Stack.Screen name="simulador" options={{ presentation: 'card' }} />
        <Stack.Screen name="horarios" options={{ presentation: 'card' }} />
        <Stack.Screen name="repositorio" options={{ presentation: 'card' }} />
        <Stack.Screen name="calificaciones" options={{ presentation: 'card' }} />
        <Stack.Screen name="selectMateria" options={{ presentation: 'card' }} />
        <Stack.Screen name="detalle-materia" options={{ presentation: 'card' }} />
        <Stack.Screen name="plan-estudios" options={{ presentation: 'card' }} />

        {/* Legacy routes */}
        <Stack.Screen name="mis-materias" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}

function AppContent() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
