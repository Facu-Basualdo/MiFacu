import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

function RootNavigator() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  const isLoggedIn = !!user || isGuest;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="home" />
      ) : (
        <Stack.Screen name="index" />
      )}
    </Stack>
  );
}

import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <RootNavigator />
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
