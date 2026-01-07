import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMaterias } from '../src/data/db';

// Interfaces
interface Materia {
  id: number;
  nombre: string;
  nivel: number;
  estado: string;
  dia?: string;
  hora?: number;
  duracion?: number;
  aula?: string;
}

export default function PlanEstudiosScreen() {
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  // Recargar datos al volver a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      const todas = getMaterias();
      setMaterias(todas);
      setLoading(false);
    }, [])
  );

  const toggleMateria = (materia: Materia) => {
    // Aquí puedes agregar lógica para cambiar el estado (pendiente -> cursando -> aprobada)
    // Por ahora solo navega al detalle
    router.push({ pathname: '/detalle-materia', params: { id: materia.id } });
  };

  const getColor = (estado: string) => {
    switch(estado) {
      case 'aprobada': return '#4CAF50';
      case 'cursando': return '#2196F3';
      case 'regularizada': return '#FF9800';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E5EC9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E5EC9" />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Mis Materias</Text>
            <View style={{width: 28}} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content}>
        {materias.map((materia) => (
          <TouchableOpacity
            key={materia.id}
            style={[styles.card, { borderColor: getColor(materia.estado), borderWidth: 2 }]}
            onPress={() => toggleMateria(materia)}
          >
            <View style={[styles.statusIndicator, { backgroundColor: getColor(materia.estado) }]} />
            <View style={styles.cardContent}>
              <Text style={styles.materiaName}>{materia.nombre}</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.materiaInfo, { color: getColor(materia.estado) }]}>
                  {materia.estado.toUpperCase()}
                </Text>
                {materia.dia && materia.hora && (
                  <Text style={styles.horario}>
                    {materia.dia} {materia.hora}:00 - {materia.aula}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        ))}
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2E5EC9', paddingBottom: 20 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50
  },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 15, marginTop: -20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  statusIndicator: { width: 8, height: '80%', borderRadius: 4, marginRight: 12 },
  cardContent: { flex: 1 },
  materiaName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  materiaInfo: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  horario: { fontSize: 11, color: '#666' }
});