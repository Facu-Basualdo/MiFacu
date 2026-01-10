import { Ionicons } from '@expo/vector-icons';
// import * as Notifications from 'expo-notifications'; (Removed)
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const CARD_WIDTH = width - (CARD_MARGIN * 2);
const BUTTON_WIDTH = 80;

const PALETA_COLORES = [
  '#FF9500', // Naranja
  '#007AFF', // Azul
  '#FF3B30', // Rojo
  '#34C759', // Verde
  '#5856D6', // Violeta
];

// Notifications setup removed

import { DataRepository } from '../src/services/dataRepository';
import { useAuth } from '../src/context/AuthContext';

export default function FinalesScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();

  const [examenes, setExamenes] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevoColor, setNuevoColor] = useState(PALETA_COLORES[0]);

  // const notificationListener = useRef<Notifications.Subscription>();
  // const responseListener = useRef<Notifications.Subscription>();

  const loadData = async () => {
    try {
      const data = await DataRepository.getFinales(isGuest);
      const mapped = data.map((item: any) => ({
        id: item.id,
        // In Guest mode, we have materiaNombre. In DB mode, we have item.materia.nombre
        materia: item.materia?.nombre || item.materiaNombre || 'Unknown',
        fecha: item.fecha.toString().split('T')[0].split('-').reverse().slice(0, 2).join('/'),
        hora: item.hora ? item.hora.toString().slice(0, 5) : "00:00",
        color: item.color,
      }));
      setExamenes(mapped);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadData();
    loadData();
  }, [isGuest]); // Re-load when guest status changes

  const parseDate = (fechaStr: string) => {
    if (!fechaStr || !fechaStr.includes('/')) return new Date();
    const [dia, mes] = fechaStr.split('/').map(Number);
    const hoy = new Date();
    let anio = hoy.getFullYear();
    if (mes < (hoy.getMonth() + 1)) anio += 1;
    return new Date(anio, mes - 1, dia);
  };

  const getTiempoRestante = (fechaStr: string) => {
    const fechaExamen = parseDate(fechaStr);
    const hoy = new Date();
    const diffTime = fechaExamen.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Finalizado";
    if (diffDays === 0) return "¡Es hoy!";
    if (diffDays === 1) return "Mañana";
    if (diffDays < 30) return `Dentro de ${diffDays} días`;
    if (diffDays >= 30) return `Dentro de ${Math.floor(diffDays / 30)} mes(es)`;
    return `${diffDays} días`;
  };

  const getExamenesOrdenados = () => {
    return [...examenes].sort((a, b) => parseDate(a.fecha) - parseDate(b.fecha));
  };

  const confirmarEliminacion = (id) => {
    Alert.alert(
      "¿Borrar Mesa?",
      "Se eliminará de tu lista.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar", style: "destructive", onPress: async () => {
            try {
              await DataRepository.deleteFinal(isGuest, id);
              loadData();
            } catch (e) { Alert.alert("Error al borrar"); }
          }
        }
      ]
    );
  };

  // --- NUEVA LÓGICA DE TOGGLE NOTIFICACIÓN ---
  // (Simplified for now as backend update is not implemented)
  // Notifications logic removed

  const handleChangeFecha = (text) => {
    let limpio = text.replace(/[^0-9]/g, '');
    if (text.length < nuevaFecha.length && nuevaFecha.endsWith('/')) limpio = limpio.slice(0, -1);
    if (limpio.length > 2) limpio = limpio.slice(0, 2) + '/' + limpio.slice(2, 4);
    setNuevaFecha(limpio);
  };

  const handleChangeHora = (text) => {
    let limpio = text.replace(/[^0-9]/g, '');
    if (limpio.length > 2) limpio = limpio.slice(0, 2) + ':' + limpio.slice(2, 4);
    setNuevaHora(limpio);
  };

  // testNotificacion removed

  const handleAgregar = async () => {
    if (!nuevaMateria || nuevaFecha.length < 5) return Alert.alert("Faltan datos");

    const [d, m] = nuevaFecha.split('/');
    const currentYear = new Date().getFullYear();
    const isoDate = `${currentYear}-${m}-${d}`;

    const nuevo = {
      materiaNombre: nuevaMateria.toUpperCase(),
      fecha: isoDate,
      hora: nuevaHora || "09:00",
      color: nuevoColor,
    };

    try {
      await DataRepository.createFinal(isGuest, nuevo);
      setModalVisible(false);
      loadData();
    } catch (e) { Alert.alert("Error creando"); }

    setNuevaMateria(''); setNuevaFecha(''); setNuevaHora(''); setNuevoColor(PALETA_COLORES[0]);
  };

  // registerForPushNotificationsAsync removed

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cuentas regresivas</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {getExamenesOrdenados().map((examen) => (
            <View key={examen.id} style={styles.swipeWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToOffsets={[0, BUTTON_WIDTH]}
                snapToEnd={false}
                decelerationRate="fast"
                contentContainerStyle={{ width: CARD_WIDTH + BUTTON_WIDTH }}
              >

                {/* TARJETA */}
                <View style={[styles.card, { backgroundColor: examen.color }]}>

                  {/* Ícono Circular */}
                  <View style={styles.iconCircle}>
                    <Ionicons name="star" size={24} color={examen.color} />
                  </View>

                  {/* Textos */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{examen.materia}</Text>
                    <Text style={styles.cardDate}>{examen.fecha}/2026 - {examen.hora}hs</Text>
                    <Text style={styles.cardCountdown}>{getTiempoRestante(examen.fecha)}</Text>
                  </View>

                  {/* Bell button removed */}

                </View>

                {/* BOTÓN BORRAR (SWIPE) */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmarEliminacion(examen.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={28} color="#FF3B30" />
                </TouchableOpacity>

              </ScrollView>
            </View>
          ))}

          {examenes.length === 0 && (
            <Text style={styles.emptyText}>No hay cuentas regresivas activas.</Text>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color="#007AFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Cuenta Regresiva</Text>

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: FINAL ARQUITECTURA"
              value={nuevaMateria}
              onChangeText={setNuevaMateria}
              autoCapitalize="characters"
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Fecha (DD/MM)</Text>
                <TextInput style={styles.input} placeholder="19/02" value={nuevaFecha} onChangeText={handleChangeFecha} keyboardType="numeric" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hora</Text>
                <TextInput style={styles.input} placeholder="09:00" value={nuevaHora} onChangeText={handleChangeHora} keyboardType="numeric" maxLength={5} />
              </View>
            </View>

            <Text style={styles.label}>Elige un color</Text>
            <View style={styles.colorPalette}>
              {PALETA_COLORES.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }, nuevoColor === color && styles.colorSelected]}
                  onPress={() => setNuevoColor(color)}
                >
                  {nuevoColor === color && <Ionicons name="checkmark" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleAgregar}>
                <Text style={styles.btnTextConfirm}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#000' },
  iconBtn: { padding: 5 },
  content: { padding: CARD_MARGIN },
  swipeWrapper: { marginBottom: 15, borderRadius: 14, overflow: 'hidden' },

  card: {
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: CARD_WIDTH,
    height: 90,
    elevation: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
  },

  iconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },

  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 2, letterSpacing: 0.5 },
  cardDate: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  cardCountdown: { fontSize: 14, fontWeight: 'bold', color: '#fff' },

  // --- ESTILO CAMPANA ---
  bellButton: {
    padding: 10,
    marginLeft: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)' // Fondo sutil para que sea fácil de tocar
  },

  deleteButton: {
    backgroundColor: '#f2f2f2',
    width: BUTTON_WIDTH,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },

  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    backgroundColor: '#F2F2F7', borderRadius: 30,
    width: 60, height: 60,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  colorPalette: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 5 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#ddd' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnConfirm: { flex: 1, backgroundColor: '#007AFF', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontWeight: '600' },
  btnTextConfirm: { color: '#fff', fontWeight: 'bold' }
});