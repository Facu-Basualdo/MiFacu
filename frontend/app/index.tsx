import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '../src/config/supabase';
import { useAuth } from '../src/context/AuthContext';
import { DataRepository } from '../src/services/dataRepository';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { isGuest, user, signInAsGuest } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Replace with Env Var
    iosClientId: 'YOUR_IOS_ID',
    androidClientId: 'YOUR_ANDROID_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      const signInWithSupabase = async () => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: id_token,
        });

        if (error) {
          Alert.alert("Login Error", error.message);
        } else {
          // Sync data on successful login (if previously guest)
          // This logic might need refinement: do we sync immediately or ask?
          // For now, auto-sync.
          await DataRepository.syncGuestData();
        }
      };

      signInWithSupabase();
    }
  }, [response]);

  useEffect(() => {
    if (user || isGuest) {
      router.replace('/home');
    }
  }, [user, isGuest]);

  const handleGoogleLogin = async () => {
    // promptAsync(); 
    // Note: Setup of Google Auth requires Expo Go or Build properties.
    // For this MVP, we might fallback to basic Supabase Auth UI or just mock the "Google" part if credentials aren't ready.
    // But to fulfill the request "Register with Google", we'll attempt the real flow logic.
    // If the user hasn't provided Client IDs, this will fail. 
    // We will use supabase.auth.signInWithOAuth for a simpler flow if possible.

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'mifacu://login'
      }
    });

    if (error) Alert.alert("Error", error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MiFacu 🚀</Text>
      <Text style={styles.subtitle}>Gestiona tu vida académica</Text>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleText}>Continuar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signInAsGuest} style={styles.guestButton}>
        <Text style={styles.guestText}>Ingresar como Invitado (Offline)</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Si ingresas como invitado, tus datos se guardarán en tu dispositivo.
        Al iniciar sesión después, se sincronizarán con tu cuenta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#aaa', fontSize: 18, marginBottom: 50 },
  googleButton: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 20,
    flexDirection: 'row', justifyContent: 'center'
  },
  googleText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  guestButton: { padding: 15 },
  guestText: { color: '#888', textDecorationLine: 'underline', fontSize: 16 },
  infoText: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 30, paddingHorizontal: 20 },
});