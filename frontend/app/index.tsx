import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');

  // Verificamos si ya hay un usuario guardado
  useEffect(() => {
    chequearSesion();
  }, []);

  async function chequearSesion() {
    const usuarioGuardado = await AsyncStorage.getItem('usuario_nombre');
    if (usuarioGuardado) {
      console.log("Usuario detectado:", usuarioGuardado);
      // router.replace('/home'); // Descomenta esto si quieres login automático
    }
  }

  // 1. Entrar con nombre propio
  async function ingresarConNombre() {
    if (nombre.trim().length < 2) {
      Alert.alert("Nombre muy corto", "Pon al menos 2 letras.");
      return;
    }
    await guardarYEntrar(nombre.trim().toLowerCase());
  }

  // 2. Entrar como USUARIO DEMO (Compartido)
  async function ingresarComoDemo() {
    Alert.alert(
      "Modo Tester 🧪", 
      "Entrarás con el usuario compartido 'demo'.\nTodos los que usen este botón verán los mismos datos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Entrar", onPress: () => guardarYEntrar('usuario_demo') } // ID FIJO
      ]
    );
  }

  // 3. Entrar como Invitado Random
  async function ingresarComoInvitado() {
    let idInvitado = await AsyncStorage.getItem('usuario_nombre');
    if (!idInvitado || !idInvitado.startsWith('invitado_')) {
      const numeroRandom = Math.floor(Math.random() * 10000);
      idInvitado = `invitado_${numeroRandom}`;
    }
    await guardarYEntrar(idInvitado);
  }

  // Función común para guardar y navegar
  async function guardarYEntrar(usuarioId) {
    try {
      await AsyncStorage.setItem('usuario_nombre', usuarioId);
      router.replace('/home');
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la sesión.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PLAID LABS 🚀</Text> 
      <Text style={styles.subtitle}>miFacu Mobile</Text>

      {/* --- OPCIÓN 1: USUARIO DEMO (El más importante ahora) --- */}
      <TouchableOpacity style={styles.buttonDemo} onPress={ingresarComoDemo}>
        <Text style={styles.demoText}>🧪 ENTRAR COMO TESTER</Text>
        <Text style={styles.demoSubtext}>(Cuenta compartida por todos)</Text>
      </TouchableOpacity>

      <Text style={{color: '#333', marginVertical: 20}}>──────── O ────────</Text>

      {/* --- OPCIÓN 2: NOMBRE PROPIO --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Tu nombre personal:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: Matias" 
          placeholderTextColor="#666"
          onChangeText={setNombre}
          value={nombre}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.buttonMain} onPress={ingresarConNombre}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>

      {/* --- OPCIÓN 3: INVITADO --- */}
      <TouchableOpacity onPress={ingresarComoInvitado} style={{ marginTop: 30 }}>
        <Text style={{ color: '#666', textDecorationLine: 'underline' }}>
          Entrar como anónimo (Random)
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#aaa', fontSize: 18, marginBottom: 40 },
  
  // Estilos del Botón Demo
  buttonDemo: { 
    width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', 
    backgroundColor: '#FFD700', // Dorado
    shadowColor: "#FFD700", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5
  },
  demoText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
  demoSubtext: { color: '#333', fontSize: 12 },

  // Estilos Tarjeta
  card: { width: '100%', backgroundColor: '#111', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginTop: 10 },
  label: { color: '#fff', marginBottom: 10, fontWeight: 'bold' },
  input: {
    backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 16
  },
  buttonMain: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});