import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "../src/constants/theme";
import { useEffect } from "react";

function RootNavigator() {
  const { user, isGuest, loading } = useAuth();
  const { colorScheme, isDark } = useTheme();
  const theme = Colors[colorScheme];
  const router = useRouter();
  const segments = useSegments();

  const isLoggedIn = !!user || isGuest;

  // Handle auth state changes
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (isLoggedIn && !inAuthGroup) {
      // Logged in but not in tabs, redirect to tabs
      router.replace("/(tabs)");
    } else if (!isLoggedIn && inAuthGroup) {
      // Not logged in but in tabs, redirect to login
      router.replace("/");
    }
  }, [isLoggedIn, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
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
        <Stack.Screen name="detalle-materia" options={{ presentation: 'card' }} />
        <Stack.Screen name="plan-estudios" options={{ presentation: 'card' }} />

        {/* Legacy routes */}
        <Stack.Screen name="home" />
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
