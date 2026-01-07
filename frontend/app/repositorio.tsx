import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RepositorioScreen() {
  const router = useRouter();
  
  const [links, setLinks] = useState([
    { id: 1, nombre: "Drive Comisión 2K1", materia: "ANÁLISIS II", url: "https://drive.google.com", color: "#4285F4" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  // Estados del Formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [nuevaUrl, setNuevaUrl] = useState('');

  // FUNCIÓN PARA ABRIR EL LINK
  const abrirEnlace = async (url) => {
    try {
      const urlLimpia = url.trim(); // Elimina espacios invisibles
      const puedeAbrir = await Linking.canOpenURL(urlLimpia);
      
      if (puedeAbrir) {
        // 'window.open' no existe en RN, usamos Linking.openURL
        // Esto forzará al celular a elegir la app de Drive o el Navegador
        await Linking.openURL(urlLimpia);
      } else {
        Alert.alert("URL Inválida", "Asegúrate de que el link empiece con https://");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir el enlace.");
    }
  };

  const abrirModalParaEditar = (item) => {
    setEditandoId(item.id);
    setNuevoNombre(item.nombre);
    setNuevaMateria(item.materia);
    setNuevaUrl(item.url);
    setModalVisible(true);
  };

  const handleGuardar = () => {
    if (!nuevoNombre || !nuevaUrl) return Alert.alert("Faltan datos");
    
    let urlFinal = nuevaUrl.trim();
    if (!urlFinal.startsWith('http')) {
      urlFinal = 'https://' + urlFinal;
    }

    if (editandoId) {
      // Editar existente
      setLinks(links.map(l => l.id === editandoId ? { ...l, nombre: nuevoNombre, materia: nuevaMateria.toUpperCase(), url: urlFinal } : l));
    } else {
      // Crear nuevo
      const nuevo = {
        id: Date.now(),
        nombre: nuevoNombre,
        materia: nuevaMateria.toUpperCase() || "GENERAL",
        url: urlFinal,
        color: "#607D8B"
      };
      setLinks([nuevo, ...links]);
    }

    cerrarModal();
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditandoId(null);
    setNuevoNombre(''); setNuevaMateria(''); setNuevaUrl('');
  };

  const eliminarLink = (id) => {
    Alert.alert("Eliminar", "¿Borrar este acceso directo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => setLinks(links.filter(l => l.id !== id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Material de Estudio</Text>
          <View style={{width: 26}} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>MIS ACCESOS DIRECTOS</Text>

          {links.map((item) => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => abrirEnlace(item.url)}>
                <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name="link" size={24} color={item.color} />
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.linkMateria}>{item.materia}</Text>
                  <Text style={styles.linkNombre}>{item.nombre}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.btnAction} onPress={() => abrirModalParaEditar(item)}>
                  <Ionicons name="create-outline" size={22} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAction} onPress={() => eliminarLink(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {links.length === 0 && (
            <Text style={styles.emptyText}>No tienes links guardados todavía.</Text>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color="#fff" />
          <Text style={styles.fabText}>Agregar Link</Text>
        </TouchableOpacity>

      </SafeAreaView>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editandoId ? 'Editar Link' : 'Nuevo Acceso Directo'}</Text>
            
            <Text style={styles.label}>Nombre del recurso</Text>
            <TextInput style={styles.input} placeholder="Ej: Drive de la comisión" value={nuevoNombre} onChangeText={setNuevoNombre} />

            <Text style={styles.label}>Materia</Text>
            <TextInput style={styles.input} placeholder="Ej: ANÁLISIS II" value={nuevaMateria} onChangeText={setNuevaMateria} autoCapitalize="characters" />

            <Text style={styles.label}>Enlace (URL)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Pega el link aquí" 
              value={nuevaUrl} 
              onChangeText={setNuevaUrl} 
              autoCapitalize="none" 
              keyboardType="url" 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={cerrarModal}>
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleGuardar}>
                <Text style={styles.btnTextConfirm}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 15, letterSpacing: 1 },
  
  card: { 
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, marginBottom: 12, 
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoBox: { flex: 1 },
  linkMateria: { fontSize: 11, fontWeight: 'bold', color: '#888', marginBottom: 2 },
  linkNombre: { fontSize: 15, fontWeight: '600', color: '#333' },
  
  actionButtons: { flexDirection: 'row', paddingRight: 10 },
  btnAction: { padding: 8 },
  
  fab: { 
    position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#333', 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 25, 
    borderRadius: 30, elevation: 5
  },
  fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnConfirm: { flex: 1, backgroundColor: '#333', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontWeight: '600' },
  btnTextConfirm: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 }
});