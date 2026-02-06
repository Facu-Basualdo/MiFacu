import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { materiasApi } from '../src/services/api';
import { DataRepository } from '../src/services/dataRepository';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/theme';

const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const getTiempoRestante = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Finalizado';
  if (diffDays === 0) return '¡Hoy!';
  if (diffDays === 1) return 'Mañana';
  return `En ${diffDays} días`;
};

interface Examen {
  id: number;
  titulo: string;
  tipo: string;
  fecha: string;
  hora: string;
  color: string;
  dia: number;
  mes: number;
  mesLabel: string;
}

interface Materia {
  id: number;
  nombre: string;
  nivel: number;
  estado: string;
  dia?: string;
  hora?: number;
  aula?: string;
}

export default function DetalleMateriaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params as { id: string };

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { isGuest, user } = useAuth();
  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Estados para edición
  const [nuevoDia, setNuevoDia] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevaAula, setNuevaAula] = useState('');

  // Exámenes reales asociados a la materia
  const [examenes, setExamenes] = useState<Examen[]>([]);

  const loadMateria = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await materiasApi.getMateriasByUsuario(user?.id);
      const item = data.find((um: any) => um.materiaId.toString() === id.toString());

      if (item) {
        setMateria({
          id: item.materiaId,
          nombre: item.materia.nombre,
          nivel: parseInt(item.materia.nivel) || 1,
          estado: item.estado,
          dia: item.dia,
          hora: item.hora,
          aula: item.aula
        });
        // Inicializar formulario
        setNuevoDia(item.dia || 'LU');
        setNuevaHora(item.hora?.toString() || '18');
        setNuevaAula(item.aula || 'Sin aula');
      }
      // Cargar parciales/entregas asociados a esta materia
      try {
        const allRecordatorios = await DataRepository.getRecordatorios();
        const filtered = (allRecordatorios || [])
          .filter((r: any) => {
            const tipoLower = (r.tipo || '').toLowerCase();
            const matchesTipo = tipoLower === 'parcial' || tipoLower === 'entrega';
            const matchesMateria = r.materiaId?.toString() === id.toString();
            return matchesTipo && matchesMateria;
          })
          .map((r: any) => {
            const fecha = new Date(r.fecha);
            return {
              id: r.id,
              titulo: r.nombre || r.titulo,
              tipo: (r.tipo || '').charAt(0).toUpperCase() + (r.tipo || '').slice(1).toLowerCase(),
              fecha: r.fecha,
              hora: r.hora ? r.hora.toString().slice(0, 5) : '09:00',
              color: r.color || '#0A84FF',
              dia: fecha.getDate(),
              mes: fecha.getMonth(),
              mesLabel: MESES_CORTOS[fecha.getMonth()] || '',
            };
          })
          .sort((a: Examen, b: Examen) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        setExamenes(filtered);
      } catch (err) {
        console.error('Error cargando exámenes:', err);
      }
    } catch (e) {
      console.error("Error cargando materia:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMateria();
  }, [id, isGuest]);

  const handleGuardar = async () => {
    // Validar hora
    const horaNum = parseInt(nuevaHora);
    if (isNaN(horaNum) || horaNum < 8 || horaNum > 23) return Alert.alert("Hora inválida", "La facultad abre de 8 a 23.");

    try {
      if (materia) {
        await materiasApi.updateEstadoMateria(user?.id, id, materia.estado, {
          dia: nuevoDia.toUpperCase(),
          hora: horaNum,
          aula: nuevaAula
        });

        Alert.alert("¡Horario Actualizado!", "Se reflejará en tu agenda.");
        loadMateria(); // Recargar datos
        setEditMode(false);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el horario.");
    }
  };

  // Color del tema según estado
  const getColorTema = () => {
    if (materia?.estado === 'aprobado') return theme.green;
    if (materia?.estado === 'regular') return theme.orange;
    if (materia?.estado === 'cursado') return theme.blue;
    return theme.icon;
  };

  if (loading) return (
    <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={theme.tint} />
    </View>
  );

  if (!materia) return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.notFoundText, { color: theme.text }]}>Materia no encontrada</Text>
    </View>
  );

  const colorTema = getColorTema();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'light-content'} backgroundColor={colorTema} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colorTema }]}>
        <SafeAreaView>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Ficha Académica</Text>

            {/* Botón Editar / Guardar */}
            <TouchableOpacity onPress={() => editMode ? handleGuardar() : setEditMode(true)}>
              <Ionicons name={editMode ? "checkmark-circle" : "create-outline"} size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.materiaTitle}>{materia.nombre}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{materia.estado.toUpperCase()}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content}>

        {/* Tarjeta de Cursada (EDITABLE) */}
        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {editMode ? "Editar Horarios" : "Información de Cursada"}
          </Text>

          {/* DÍA */}
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={theme.icon} />
            {editMode ? (
              <View style={styles.editRow}>
                <Text style={[styles.label, { color: theme.icon }]}>Día (LU, MA, MI...):</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.separator }]}
                  value={nuevoDia}
                  onChangeText={setNuevoDia}
                  maxLength={2}
                  placeholderTextColor={theme.icon}
                />
              </View>
            ) : (
              <Text style={[styles.rowText, { color: theme.text }]}>Día: {materia.dia || "A confirmar"}</Text>
            )}
          </View>

          {/* HORA */}
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color={theme.icon} />
            {editMode ? (
              <View style={styles.editRow}>
                <Text style={[styles.label, { color: theme.icon }]}>Hora Inicio (0-23):</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.separator }]}
                  value={nuevaHora}
                  onChangeText={setNuevaHora}
                  keyboardType="numeric"
                  placeholderTextColor={theme.icon}
                />
              </View>
            ) : (
              <Text style={[styles.rowText, { color: theme.text }]}>Horario: {materia.hora}:00 hs</Text>
            )}
          </View>

          {/* AULA */}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color={theme.icon} />
            {editMode ? (
              <View style={styles.editRow}>
                <Text style={[styles.label, { color: theme.icon }]}>Aula:</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.separator }]}
                  value={nuevaAula}
                  onChangeText={setNuevaAula}
                  placeholderTextColor={theme.icon}
                />
              </View>
            ) : (
              <Text style={[styles.rowText, { color: theme.text }]}>{materia.aula}</Text>
            )}
          </View>

          {editMode && <Text style={[styles.hint, { color: theme.icon }]}>Toca el ✔️ arriba para guardar.</Text>}
        </View>

        {/* Parciales y entregas reales */}
        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Parciales y Entregas</Text>
          {examenes.length === 0 ? (
            <View style={styles.emptyExams}>
              <Ionicons name="document-text-outline" size={28} color={theme.separator} />
              <Text style={[styles.emptyExamsText, { color: theme.icon }]}>
                No hay parciales o entregas cargados para esta materia
              </Text>
            </View>
          ) : (
            examenes.map((exam, index) => {
              const tiempoRestante = getTiempoRestante(exam.fecha);
              const esPasado = tiempoRestante === 'Finalizado';
              return (
                <View
                  key={exam.id}
                  style={[
                    styles.examRow,
                    index < examenes.length - 1 && { marginBottom: 14 },
                    esPasado && { opacity: 0.5 },
                  ]}
                >
                  <View style={[styles.dateBox, { borderColor: exam.color }]}>
                    <Text style={[styles.dateBoxDay, { color: exam.color }]}>{exam.dia}</Text>
                    <Text style={[styles.dateBoxMonth, { color: exam.color }]}>{exam.mesLabel}</Text>
                  </View>
                  <View style={styles.examInfo}>
                    <View style={styles.examTitleRow}>
                      <Text style={[styles.examTitle, { color: theme.text }]} numberOfLines={1}>
                        {exam.titulo}
                      </Text>
                      <View style={[styles.tipoBadge, { backgroundColor: exam.color + '18' }]}>
                        <Text style={[styles.tipoBadgeText, { color: exam.color }]}>{exam.tipo}</Text>
                      </View>
                    </View>
                    <View style={styles.examDetails}>
                      <Text style={[styles.examTime, { color: theme.icon }]}>
                        {exam.hora} hs
                      </Text>
                      <Text style={[styles.examCountdown, { color: esPasado ? theme.icon : colorTema }]}>
                        {tiempoRestante}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  titleBox: { marginTop: 10 },
  materiaTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  content: { padding: 20, marginTop: -25 },
  card: { borderRadius: 15, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rowText: { marginLeft: 10, fontSize: 14 },
  notFoundText: { textAlign: 'center', marginTop: 50, fontSize: 16 },

  // Estilos de Edición
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  label: { fontSize: 12, marginRight: 10 },
  input: { borderBottomWidth: 1, flex: 1, paddingVertical: 2, fontSize: 14 },
  hint: { fontSize: 10, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },

  // Estilos Examen
  emptyExams: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  emptyExamsText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 10 },
  examRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    width: 50, height: 50, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  dateBoxDay: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
  dateBoxMonth: { fontSize: 10, fontWeight: '700' },
  examInfo: { flex: 1 },
  examTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  examTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  tipoBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  tipoBadgeText: { fontSize: 10, fontWeight: '700' },
  examDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  examTime: { fontSize: 13 },
  examCountdown: { fontSize: 12, fontWeight: '600' },
});
