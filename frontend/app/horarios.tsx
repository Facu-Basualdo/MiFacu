import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { materiasApi as api } from '../src/services/api';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

interface UsuarioMateria {
  id: number;
  usuarioId: string;
  materiaId: number;
  estado: string;
  dia?: string;
  hora?: number;
  duracion?: number;
  aula?: string;
  materia: {
    nombre: string;
  };
}

interface Materia {
  id: number;
  nombre: string;
  estado?: string;
  dia: string;
  hora: number;
  duracion?: number;
  aula?: string;
  color?: string;
}

// CONFIGURACIÓN DE DIMENSIONES
const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 50;
const TIME_COL_WIDTH = 50;
const DAY_COL_WIDTH = 160;
const START_HOUR = 8;
const END_HOUR = 24;
const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

// Día actual real
const getDiaHoyIndex = () => {
  const days = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
  const today = days[new Date().getDay()];
  const index = DIAS.indexOf(today);
  return index !== -1 ? index : 0;
};
const DIA_HOY_INDEX = getDiaHoyIndex();

const getColors = (theme: any): Record<string, string> => ({
  'Análisis Mat. II': theme.blue,
  'Física II': theme.orange,
  'Análisis Sist.': theme.blue,
  'Algoritmos y ED': theme.green,
  'default': theme.red
});

export default function HorariosScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const COLORS = getColors(theme);
  const { user, isGuest } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);

  // --- RECARGA DE DATOS AL ENTRAR ---
  useFocusEffect(
    useCallback(() => {
      const cargarMaterias = async () => {
        try {
          const userId = user?.id || (isGuest ? 'guest' : null);
          if (!userId) return;

          const todas = await api.getMateriasByUsuario(userId);

          // Contadores para debug detallado
          let countStatus = 0;
          let countDay = 0;
          let countHour = 0;

          // Filtramos solo las que están "cursando" y tienen horario
          const cursandoData = todas.filter((m: any) => {
            const isCursando = String(m.estado).toLowerCase().includes('cursad');
            if (isCursando) countStatus++;

            const hasDia = !!m.dia;
            if (isCursando && hasDia) countDay++;

            const hasHora = m.hora !== null && m.hora !== undefined;
            if (isCursando && hasDia && hasHora) countHour++;

            return isCursando && hasDia && hasHora;
          });

          // Mapeamos al formato de la grilla
          const conColores = cursandoData.map((m: any) => {
            const nombreMateria = m.materia?.nombre || 'Materia';
            return {
              id: m.materiaId || Math.random(),
              nombre: nombreMateria,
              dia: (m.dia || '').trim().toUpperCase(),
              hora: Number(m.hora),
              duracion: Number(m.duracion || 2),
              aula: m.aula || null,
              color: COLORS[nombreMateria] || COLORS.default
            };
          });

          setMaterias(conColores);
        } catch (error) {
          console.error('Error cargando materias para horarios:', error);
        }
      };

      cargarMaterias();
    }, [])
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const renderEventos = () => {
    return materias.map((m: Materia) => {
      const diaIndex = DIAS.indexOf(m.dia);
      if (diaIndex === -1) return null;

      const top = (m.hora - START_HOUR) * HOUR_HEIGHT + 2;
      const left = (diaIndex * DAY_COL_WIDTH) + 4;
      const height = (m.duracion || 2) * HOUR_HEIGHT - 4; // Default 2hs si no tiene duración
      const width = DAY_COL_WIDTH - 8;

      return (
        <TouchableOpacity
          key={m.id}
          style={[
            styles.eventBlock,
            {
              top, left, height, width,
              borderLeftColor: m.color,
              backgroundColor: m.color + '20', // iOS translucency style
            }
          ]}
          onPress={() => router.push({ pathname: '/detalle-materia', params: { id: m.id } })}
          activeOpacity={0.7}
        >
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTime, { color: m.color }]}>
              {m.hora}:00 - {m.hora + (m.duracion || 2)}:00
            </Text>
          </View>

          <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>
            {m.nombre}
          </Text>

          {m.aula ? (
            <View style={styles.eventFooter}>
              <Ionicons name="location" size={10} color={m.color} />
              <Text style={[styles.eventLoc, { color: m.color }]}>{" " + m.aula}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.headerContainer}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Horarios</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="options-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.verticalScroll} contentContainerStyle={styles.verticalScrollContent}>
        {materias.length === 0 && (
          <View style={styles.noMateriasContainer}>
            <Ionicons name="calendar-outline" size={40} color={theme.icon} style={{ opacity: 0.2 }} />
            <Text style={{ color: theme.icon, marginTop: 10, fontSize: 13 }}>No hay materias cursándose con horario</Text>
          </View>
        )}
        <View style={styles.bodyContainer}>

          {/* COLUMNA IZQUIERDA (HORAS) */}
          <View style={[styles.timeColumn, { borderRightColor: theme.separator, backgroundColor: theme.background }]}>
            <View style={{ height: 35 }} />
            {hours.map((h) => (
              <View key={h} style={styles.timeLabelContainer}>
                <Text style={[styles.timeText, { color: theme.icon }]}>{h}:00</Text>
              </View>
            ))}
          </View>

          {/* ZONA DERECHA (SCROLL HORIZONTAL) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.gridCanvas}>

              {/* CABECERA DÍAS */}
              <View style={[styles.daysHeaderRow, { borderBottomColor: theme.separator }]}>
                {DIAS.map((d, index) => {
                  const esHoy = index === DIA_HOY_INDEX;
                  return (
                    <View key={d} style={[styles.dayHeaderCell, { borderRightColor: theme.background + '20', backgroundColor: theme.background }]}>
                      <Text style={[styles.dayText, { color: theme.icon }, esHoy && [styles.dayTextActive, { color: theme.blue }]]}>{d}</Text>
                      {esHoy && <View style={[styles.activeDot, { backgroundColor: theme.blue }]} />}
                    </View>
                  );
                })}
              </View>

              {/* GRILLA */}
              <View style={styles.gridLinesContainer}>
                <View style={[styles.todayBg, { left: DIA_HOY_INDEX * DAY_COL_WIDTH, backgroundColor: theme.blue + '05' }]} />

                {hours.map((h) => (
                  <View key={h} style={[styles.gridLineRow, { borderBottomColor: theme.separator + '40' }]} />
                ))}

                <View style={[styles.currentTimeLine, { top: (new Date().getHours() + new Date().getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT, backgroundColor: theme.red }]} />

                {/* BLOQUES DE MATERIAS (Ahora leen de la DB) */}
                {renderEventos()}
              </View>

            </View>
          </ScrollView>

        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { zIndex: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  verticalScroll: { flex: 1 },
  verticalScrollContent: { flexGrow: 1 },
  bodyContainer: { flexDirection: 'row', flex: 1, minHeight: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT + 100 },

  noMateriasContainer: {
    position: 'absolute', top: 100, left: 60, right: 20,
    alignItems: 'center', justifyContent: 'center', zIndex: 1
  },

  timeColumn: {
    width: TIME_COL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    zIndex: 10
  },
  timeLabelContainer: { height: HOUR_HEIGHT, justifyContent: 'flex-start', alignItems: 'center' },
  timeText: { fontSize: 11, fontWeight: '600', transform: [{ translateY: -6 }] },

  horizontalScroll: { flex: 1 },
  gridCanvas: { width: DIAS.length * DAY_COL_WIDTH },

  daysHeaderRow: { flexDirection: 'row', height: 35, borderBottomWidth: StyleSheet.hairlineWidth },
  dayHeaderCell: {
    width: DAY_COL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dayText: { fontSize: 13, fontWeight: '600' },
  dayTextActive: { fontWeight: '800' },
  activeDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },

  gridLinesContainer: { position: 'relative' },
  gridLineRow: { height: HOUR_HEIGHT, borderBottomWidth: StyleSheet.hairlineWidth, width: '100%' },
  todayBg: { position: 'absolute', top: 0, bottom: 0, width: DAY_COL_WIDTH, zIndex: 0 },

  eventBlock: {
    position: 'absolute',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 8,
    justifyContent: 'flex-start',
    zIndex: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3
  },
  eventHeader: { marginBottom: 4 },
  eventTime: { fontSize: 10, fontWeight: '800', opacity: 0.9 },
  eventTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  eventLoc: { fontSize: 10, fontWeight: '600' },

  currentTimeLine: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10 }
});
