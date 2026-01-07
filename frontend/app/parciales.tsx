import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const CARD_WIDTH = width - (CARD_MARGIN * 2);
const BUTTON_WIDTH = 80;

const PALETA_COLORES = ['#FF9500', '#007AFF', '#FF3B30', '#34C759', '#5856D6'];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import { api } from '../src/services/api';

export default function ParcialesScreen() {
  const router = useRouter();

  const [eventos, setEventos] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const data = await api.getRecordatorios();
      // Map API data to component format
      const mapped = data.map(item => ({
        id: item.id,
        titulo: item.nombre,
        materia: item.materia ? item.materia.nombre : 'Sin Materia',
        tipo: item.tipo === 'Parcial' ? 'PARCIAL' : 'ENTREGA', // Adjust enum case if needed
        fecha: item.fecha.toString().split('T')[0].split('-').reverse().slice(0, 2).join('/'), // YYYY-MM-DD -> DD/MM
        hora: item.hora ? item.hora.toString().slice(0, 5) : "00:00",
        color: item.color,
        avisar: item.notificado
      }));
      setEventos(mapped);
    } catch (e) {
      console.error(e);
      // Keep silent or show error? For now silent as user might not have DB running
    }
  };

  useEffect(() => {
    loadData();
    // ... notifications ..
  }, []);

  const [modalVisible, setModalVisible] = useState(false);

  // Estados del Formulario
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('PARCIAL'); // 'PARCIAL' o 'ENTREGA'
  const [nuevoColor, setNuevoColor] = useState(PALETA_COLORES[0]);

  const notificationListener = useRef();
  const responseListener = useRef();

  // --- LÓGICA DE FECHAS ---
  const parseDate = (fechaStr) => {
    if (!fechaStr || !fechaStr.includes('/')) return new Date();
    const [dia, mes] = fechaStr.split('/').map(Number);
    const hoy = new Date();
    let anio = hoy.getFullYear();
    if (mes < (hoy.getMonth() + 1)) anio += 1;
    return new Date(anio, mes - 1, dia);
  };

  const getTiempoRestante = (fechaStr) => {
    const fechaEvento = parseDate(fechaStr);
    const hoy = new Date();
    const diffTime = fechaEvento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Finalizado";
    if (diffDays === 0) return "¡Es hoy!";
    if (diffDays === 1) return "Mañana";
    if (diffDays < 30) return `Faltan ${diffDays} días`;
    return `Faltan ${Math.floor(diffDays / 30)} mes(es)`;
  };

  const getEventosOrdenados = () => {
    return [...eventos].sort((a, b) => parseDate(a.fecha) - parseDate(b.fecha));
  };


  // --- INPUTS ---
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

  const toggleNotificacion = (id) => {
    setEventos(prev => prev.map(e => {
      if (e.id === id) {
        const nuevoEstado = !e.avisar;
        if (nuevoEstado) Alert.alert("🔔 Activado", "Te avisaremos 24hs antes.");
        return { ...e, avisar: nuevoEstado };
      }
      return e;
    }));
  };

  // --- NOTIFICACIÓN ---
  const programarNotificacion = async (titulo, materia, tipo) => {
    const cuerpo = tipo === 'PARCIAL'
      ? `¡A estudiar! Mañana es el ${titulo} de ${materia}.`
      : `¡Atención! Mañana vence la entrega: ${titulo} (${materia}).`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: `📅 ${tipo === 'PARCIAL' ? 'Parcial' : 'Entrega'} Mañana`, body: cuerpo, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, repeats: false },
      });
    } catch (e) { console.log(e); }
  };

  const handleAgregar = async () => {
    if (!nuevaMateria || !nuevoTitulo || nuevaFecha.length < 5) {
      Alert.alert("Faltan datos", "Por favor completa todos los campos requeridos");
      return;
    }

    // Convert DD/MM -> YYYY-MM-DD for backend
    const [d, m] = nuevaFecha.split('/');
    const currentYear = new Date().getFullYear();
    // Asegurar formato correcto con padding
    const dia = d.padStart(2, '0');
    const mes = m.padStart(2, '0');
    const isoDate = `${currentYear}-${mes}-${dia}`;

    // Formatear hora correctamente (HH:MM -> HH:MM:SS)
    let horaFormateada = nuevaHora || "18:00";
    if (horaFormateada.length === 5 && horaFormateada.includes(':')) {
      horaFormateada = horaFormateada + ':00'; // Agregar segundos si no están
    }

    const nuevo = {
      nombre: nuevoTitulo.toUpperCase(),
      materiaNombre: nuevaMateria.toUpperCase(),
      tipo: nuevoTipo === 'PARCIAL' ? 'Parcial' : 'Entrega',
      fecha: isoDate,
      hora: horaFormateada,
      color: nuevoColor
    };

    try {
      await api.createRecordatorio(nuevo);
      setModalVisible(false);
      loadData(); // Reload from DB
      await programarNotificacion(nuevoTitulo, nuevaMateria, nuevoTipo);
      Alert.alert("Éxito", "Recordatorio creado correctamente");
    } catch (e) {
      console.error("Error creando recordatorio:", e);
      const errorMessage = e instanceof Error ? e.message : "Error desconocido al crear el recordatorio";
      Alert.alert("Error", errorMessage);
    }

    // Reset
    setNuevoTitulo(''); setNuevaMateria(''); setNuevaFecha(''); setNuevaHora(''); setNuevoColor(PALETA_COLORES[0]);
  };

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entregas y Parciales</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {getEventosOrdenados().map((evento) => (
            <View key={evento.id} style={styles.swipeWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToOffsets={[0, BUTTON_WIDTH]}
                snapToEnd={false}
                decelerationRate="fast"
                contentContainerStyle={{ width: CARD_WIDTH + BUTTON_WIDTH }}
              >

                {/* TARJETA */}
                <View style={[styles.card, { backgroundColor: evento.color }]}>
                  {/* Ícono según Tipo */}
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={evento.tipo === 'PARCIAL' ? "school" : "document-text"}
                      size={24}
                      color={evento.color}
                    />
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardMateria}>{evento.materia}</Text>
                    <Text style={styles.cardTitle}>{evento.titulo}</Text>
                    <Text style={styles.cardDate}>{evento.fecha} - {evento.hora}hs • {getTiempoRestante(evento.fecha)}</Text>
                  </View>

                  <TouchableOpacity style={styles.bellButton} onPress={() => toggleNotificacion(evento.id)}>
                    <Ionicons name={evento.avisar ? "notifications" : "notifications-off"} size={22} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmarEliminacion(evento.id)}>
                  <Ionicons name="trash-outline" size={28} color="#FF3B30" />
                </TouchableOpacity>

              </ScrollView>
            </View>
          ))}

          {eventos.length === 0 && <Text style={styles.emptyText}>¡Todo despejado! No hay fechas próximas.</Text>}
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
            <Text style={styles.modalTitle}>Nuevo Evento</Text>

            {/* SELECTOR TIPO */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, nuevoTipo === 'PARCIAL' && styles.typeBtnActive]}
                onPress={() => setNuevoTipo('PARCIAL')}
              >
                <Ionicons name="school-outline" size={20} color={nuevoTipo === 'PARCIAL' ? "#fff" : "#666"} />
                <Text style={[styles.typeText, nuevoTipo === 'PARCIAL' && styles.typeTextActive]}>Parcial</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, nuevoTipo === 'ENTREGA' && styles.typeBtnActive]}
                onPress={() => setNuevoTipo('ENTREGA')}
              >
                <Ionicons name="document-text-outline" size={20} color={nuevoTipo === 'ENTREGA' ? "#fff" : "#666"} />
                <Text style={[styles.typeText, nuevoTipo === 'ENTREGA' && styles.typeTextActive]}>Entrega</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Materia</Text>
            <TextInput style={styles.input} placeholder="Ej: FÍSICA II" value={nuevaMateria} onChangeText={setNuevaMateria} autoCapitalize="characters" />

            <Text style={styles.label}>Título del Evento</Text>
            <TextInput style={styles.input} placeholder={nuevoTipo === 'PARCIAL' ? "Ej: 1er Parcial" : "Ej: TP Laboratorio"} value={nuevoTitulo} onChangeText={setNuevoTitulo} autoCapitalize="characters" />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Fecha (DD/MM)</Text>
                <TextInput style={styles.input} placeholder="DD/MM" value={nuevaFecha} onChangeText={handleChangeFecha} keyboardType="numeric" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hora</Text>
                <TextInput style={styles.input} placeholder="HH:MM" value={nuevaHora} onChangeText={handleChangeHora} keyboardType="numeric" maxLength={5} />
              </View>
            </View>

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorPalette}>
              {PALETA_COLORES.map(color => (
                <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, nuevoColor === color && styles.colorSelected]} onPress={() => setNuevoColor(color)}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  iconBtn: { padding: 5 },
  content: { padding: CARD_MARGIN },
  swipeWrapper: { marginBottom: 15, borderRadius: 14, overflow: 'hidden' },

  card: {
    borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center',
    width: CARD_WIDTH, height: 100, elevation: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
  },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },

  cardInfo: { flex: 1 },
  cardMateria: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 4 },
  cardDate: { fontSize: 13, fontWeight: '600', color: '#fff' },

  bellButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20 },
  deleteButton: { backgroundColor: '#f2f2f2', width: BUTTON_WIDTH, height: 100, justifyContent: 'center', alignItems: 'center', borderTopRightRadius: 14, borderBottomRightRadius: 14 },

  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#F2F2F7', borderRadius: 30, width: 60, height: 60, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },

  // MODAL & FORM
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },

  typeSelector: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  typeBtnActive: { backgroundColor: '#007AFF', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  typeText: { marginLeft: 5, fontWeight: '600', color: '#666' },
  typeTextActive: { color: '#fff' },

  colorPalette: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 5 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#ddd' },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnConfirm: { flex: 1, backgroundColor: '#007AFF', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnTextCancel: { color: '#FF3B30', fontWeight: '600' },
  btnTextConfirm: { color: '#fff', fontWeight: 'bold' }
});