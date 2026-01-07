import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Intenta importar la DB. Si falla, usaremos un array vacío para que no explote.
let getMaterias = () => [];
try {
  const db = require('../src/data/db'); // Importación segura
  getMaterias = db.getMaterias;
  console.log("✅ DB cargada correctamente");
} catch (e) {
  console.log("❌ Error cargando DB:", e);
}

// Interfaces
interface Materia {
  id: number;
  nombre: string;
  nivel: number;
  estado: string;
  dia: string;
  hora: number;
  duracion: number;
  aula: string;
}

const DIAS_SEMANA: { [key: string]: string } = {
  'LU': 'Lunes',
  'MA': 'Martes',
  'MI': 'Miércoles',
  'JU': 'Jueves',
  'VI': 'Viernes',
  'SA': 'Sábado',
  'DO': 'Domingo'
};

export default function AgendaScreen() {
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [errorDb, setErrorDb] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      try {
        const todas = getMaterias();
        console.log("Materias encontradas:", todas?.length || 0);

        if (!todas || todas.length === 0) {
          console.log("⚠️ No se encontraron materias en la DB");
          setMaterias([]);
        } else {
          const cursando = todas.filter((m: any) => m.estado === 'cursando');
          console.log("Materias cursando:", cursando.length);
          setMaterias(cursando);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setErrorDb(true);
        setLoading(false);
      }
    }, [])
  );

  // Si hay error de DB, mostrar mensaje claro
  if (errorDb) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="warning" size={50} color="#ff6b6b" />
        <Text style={{fontSize: 18, color: '#666', textAlign: 'center', marginTop: 20}}>
          Error: No se encuentra el archivo{'\n'}src/data/db.js
        </Text>
        <TouchableOpacity
          style={{marginTop: 20, padding: 10, backgroundColor: '#2E5EC9', borderRadius: 8}}
          onPress={() => router.back()}
        >
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{fontSize: 16, color: '#666'}}>Cargando horarios...</Text>
      </View>
    );
  }

  // Agrupar materias por día
  const materiasPorDia = (): { [key: string]: Materia[] } => {
    const agrupadas: { [key: string]: Materia[] } = {};
    ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].forEach(dia => {
      agrupadas[dia] = materias.filter(m => m.dia === dia).sort((a, b) => a.hora - b.hora);
    });
    return agrupadas;
  };

  const renderDia = (diaKey: string) => {
    const diaMaterias = materiasPorDia()[diaKey];
    const diaNombre = DIAS_SEMANA[diaKey];

    return (
      <View key={diaKey} style={styles.diaContainer}>
        <View style={styles.diaHeader}>
          <Text style={styles.diaNombre}>{diaNombre}</Text>
          <Text style={styles.materiasCount}>
            {diaMaterias.length} {diaMaterias.length === 1 ? 'clase' : 'clases'}
          </Text>
        </View>

        {diaMaterias.length > 0 ? (
          diaMaterias.map((materia) => renderMateria(materia))
        ) : (
          <View style={styles.diaVacio}>
            <Ionicons name="calendar-outline" size={48} color="#ddd" />
            <Text style={styles.diaVacioTexto}>Sin clases</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMateria = (materia: Materia) => (
    <TouchableOpacity
      key={materia.id}
      style={styles.materiaCard}
      onPress={() => router.push({
        pathname: '/detalle-materia',
        params: { id: materia.id }
      })}
    >
      <View style={styles.materiaIcon}>
        <Ionicons name="book-outline" size={24} color="#2E5EC9" />
      </View>

      <View style={styles.materiaInfo}>
        <Text style={styles.materiaNombre} numberOfLines={1}>
          {materia.nombre}
        </Text>
        <View style={styles.materiaDetalles}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.materiaHora}>
            {materia.hora}:00 - {materia.hora + (materia.duracion || 2)}:00
          </Text>
          <Ionicons name="location-outline" size={14} color="#666" style={{marginLeft: 10}} />
          <Text style={styles.materiaAula} numberOfLines={1}>
            {materia.aula}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  content: { flex: 1, paddingHorizontal: 15 },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center'
  },

  diaContainer: { marginBottom: 25 },
  diaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  diaNombre: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  materiasCount: { fontSize: 12, color: '#666', fontWeight: '500' },

  materiaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },

  materiaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },

  materiaInfo: { flex: 1 },
  materiaNombre: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },

  materiaDetalles: { flexDirection: 'row', alignItems: 'center' },
  materiaHora: { fontSize: 13, color: '#666', marginLeft: 4 },
  materiaAula: { fontSize: 13, color: '#666', marginLeft: 4, flex: 1 },

  diaVacio: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed'
  },
  diaVacioTexto: { fontSize: 14, color: '#ccc', marginTop: 10 }
});