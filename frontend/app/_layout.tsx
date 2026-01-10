import { Slot } from "expo-router";
import { View } from "react-native";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <Slot />
      </View>
    </AuthProvider>
  );
}
