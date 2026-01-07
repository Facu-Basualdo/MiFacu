import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMaterias } from '../src/data/db'; // <--- IMPORTANTE: Conexión a la DB

// CONFIGURACIÓN DE DIMENSIONES
const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 50;
const TIME_COL_WIDTH = 50;
const DAY_COL_WIDTH = 160;
const START_HOUR = 8;
const END_HOUR = 23;
const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI'];

// Día actual simulado (Miércoles)
const DIA_HOY_INDEX = 2; 

// Mapa de colores por materia para mantener consistencia
const COLORS = {
  'Análisis Mat. II': '#5856D6', // Violeta
  'Física II': '#FF9500',       // Naranja
  'Análisis Sist.': '#007AFF',  // Azul
  'Algoritmos y ED': '#34C759', // Verde
  'default': '#FF2D55'          // Rojo default
};

export default function HorariosScreen() {
  const router = useRouter();
  const [materias, setMaterias] = useState([]);

  // --- RECARGA DE DATOS AL ENTRAR ---
  useFocusEffect(
    useCallback(() => {
      // 1. Traemos todas las materias de la "Base de Datos"
      const todas = getMaterias();
      
      // 2. Filtramos solo las que tienen día y hora asignados Y están activas
      const activas = todas.filter(m => 
        (m.estado === 'cursando' || m.estado === 'regularizada') && 
        m.dia && 
        m.hora
      );

      // 3. Asignamos colores (para que se vea bonito)
      const conColores = activas.map(m => ({
        ...m,
        color: COLORS[m.nombre] || COLORS.default
      }));

      setMaterias(conColores);
    }, [])
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const renderEventos = () => {
    return materias.map((m) => {
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
            { top, left, height, width, borderLeftColor: m.color, backgroundColor: m.color + '15' }
          ]}
          // Pasamos el ID para que el detalle sepa cuál editar
          onPress={() => router.push({ pathname: '/detalle-materia', params: { id: m.id } })}
          activeOpacity={0.7}
        >
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTime, { color: m.color }]}>
              {m.hora}:00 - {m.hora + (m.duracion || 2)}:00
            </Text>
          </View>
          
          <Text style={styles.eventTitle} numberOfLines={2}>
            {m.nombre}
          </Text>
          
          <View style={styles.eventFooter}>
            <Ionicons name="location" size={10} color={m.color} />
            <Text style={[styles.eventLoc, { color: m.color }]}>{" " + (m.aula || 'Sin aula')}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Cursada</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.verticalScroll} contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.bodyContainer}>
          
          {/* COLUMNA IZQUIERDA (HORAS) */}
          <View style={styles.timeColumn}>
            <View style={{height: 35}} />
            {hours.map((h) => (
              <View key={h} style={styles.timeLabelContainer}>
                <Text style={styles.timeText}>{h}:00</Text>
              </View>
            ))}
          </View>

          {/* ZONA DERECHA (SCROLL HORIZONTAL) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.gridCanvas}>
              
              {/* CABECERA DÍAS */}
              <View style={styles.daysHeaderRow}>
                {DIAS.map((d, index) => {
                  const esHoy = index === DIA_HOY_INDEX;
                  return (
                    <View key={d} style={styles.dayHeaderCell}>
                      <Text style={[styles.dayText, esHoy && styles.dayTextActive]}>{d}</Text>
                      {esHoy && <View style={styles.activeDot} />}
                    </View>
                  );
                })}
              </View>

              {/* GRILLA */}
              <View style={styles.gridLinesContainer}>
                <View style={[styles.todayBg, { left: DIA_HOY_INDEX * DAY_COL_WIDTH }]} />

                {hours.map((h) => (
                  <View key={h} style={styles.gridLineRow} />
                ))}

                <View style={[styles.currentTimeLine, { top: (19.25 - START_HOUR) * HOUR_HEIGHT }]} />

                {/* BLOQUES DE MATERIAS (Ahora leen de la DB) */}
                {renderEventos()}
              </View>

            </View>
          </ScrollView>

        </View>
        <View style={{height: 60}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerSafeArea: { backgroundColor: '#fff', zIndex: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  iconBtn: { padding: 5 },

  verticalScroll: { flex: 1 },
  bodyContainer: { flexDirection: 'row', flex: 1 },

  timeColumn: { 
    width: TIME_COL_WIDTH, 
    backgroundColor: '#fff', 
    borderRightWidth: 1, 
    borderRightColor: '#f0f0f0',
    zIndex: 10 
  },
  timeLabelContainer: { height: HOUR_HEIGHT, justifyContent: 'flex-start', alignItems: 'center' },
  timeText: { fontSize: 11, fontWeight: '500', color: '#aaa', transform: [{translateY: -6}] },

  horizontalScroll: { flex: 1 },
  gridCanvas: { width: DIAS.length * DAY_COL_WIDTH },

  daysHeaderRow: { flexDirection: 'row', height: 35, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dayHeaderCell: { 
    width: DAY_COL_WIDTH, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#fcfcfc',
    backgroundColor: '#fff'
  },
  dayText: { fontSize: 13, fontWeight: '600', color: '#999' },
  dayTextActive: { color: '#007AFF', fontWeight: 'bold' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#007AFF', position: 'absolute', bottom: 4 },

  gridLinesContainer: { position: 'relative' },
  gridLineRow: { height: HOUR_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#f8f8f8', width: '100%' },
  todayBg: { position: 'absolute', top: 0, bottom: 0, width: DAY_COL_WIDTH, backgroundColor: 'rgba(0, 122, 255, 0.03)', zIndex: 0 },
  
  eventBlock: {
    position: 'absolute',
    borderRadius: 6,
    borderLeftWidth: 4,
    padding: 6,
    justifyContent: 'flex-start',
    zIndex: 5,
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1
  },
  eventHeader: { marginBottom: 2 },
  eventTime: { fontSize: 9, fontWeight: 'bold', opacity: 0.9 },
  eventTitle: { fontSize: 11, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  eventLoc: { fontSize: 9, fontWeight: '600' },

  currentTimeLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#FF3B30', zIndex: 10 }
});