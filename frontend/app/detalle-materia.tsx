import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getMateriaById, updateMateria } from '../src/data/db'; // Importamos DB

export default function DetalleMateriaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params; // Ahora buscamos por ID

  const [materia, setMateria] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Estados para edición
  const [nuevoDia, setNuevoDia] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevaAula, setNuevaAula] = useState('');

  useEffect(() => {
    // Buscar datos reales en la DB
    if (id) {
      const data = getMateriaById(id);
      if (data) {
        setMateria(data);
        // Inicializar formulario
        setNuevoDia(data.dia || 'LU');
        setNuevaHora(data.hora?.toString() || '18');
        setNuevaAula(data.aula || 'Sin aula');
      }
    }
  }, [id]);

  const handleGuardar = () => {
    // Validar hora
    const horaNum = parseInt(nuevaHora);
    if (horaNum < 8 || horaNum > 23) return Alert.alert("Hora inválida", "La facultad abre de 8 a 23.");

    // Guardar en DB
    updateMateria(id, {
      dia: nuevoDia.toUpperCase(),
      hora: horaNum,
      aula: nuevaAula
    });

    // Actualizar vista local
    setMateria({ ...materia, dia: nuevoDia.toUpperCase(), hora: horaNum, aula: nuevaAula });
    setEditMode(false);
    Alert.alert("¡Horario Actualizado!", "Se reflejará en tu agenda.");
  };

  if (!materia) return <View style={styles.container}><Text>Cargando...</Text></View>;

  const colorTema = materia.estado === 'aprobada' ? '#4CAF50' : '#2E5EC9';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colorTema} />
      
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editMode ? "Editar Horarios" : "Información de Cursada"}
          </Text>

          {/* DÍA */}
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color="#555" />
            {editMode ? (
              <View style={styles.editRow}>
                <Text style={styles.label}>Día (LU, MA, MI...):</Text>
                <TextInput style={styles.input} value={nuevoDia} onChangeText={setNuevoDia} maxLength={2} />
              </View>
            ) : (
              <Text style={styles.rowText}>Día: {materia.dia || "A confirmar"}</Text>
            )}
          </View>

          {/* HORA */}
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color="#555" />
            {editMode ? (
              <View style={styles.editRow}>
                <Text style={styles.label}>Hora Inicio (0-23):</Text>
                <TextInput style={styles.input} value={nuevaHora} onChangeText={setNuevaHora} keyboardType="numeric" />
              </View>
            ) : (
              <Text style={styles.rowText}>Horario: {materia.hora}:00 hs</Text>
            )}
          </View>

          {/* AULA */}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color="#555" />
            {editMode ? (
              <View style={styles.editRow}>
                <Text style={styles.label}>Aula:</Text>
                <TextInput style={styles.input} value={nuevaAula} onChangeText={setNuevaAula} />
              </View>
            ) : (
              <Text style={styles.rowText}>{materia.aula}</Text>
            )}
          </View>

          {editMode && <Text style={styles.hint}>Toca el ✔️ arriba para guardar.</Text>}
        </View>

        {/* Info extra estática */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximos Exámenes</Text>
          <View style={styles.examRow}>
            <View style={[styles.dateBox, { borderColor: colorTema }]}>
              <Text style={[styles.dayText, { color: colorTema }]}>15</Text>
              <Text style={[styles.monthText, { color: colorTema }]}>MAY</Text>
            </View>
            <View>
              <Text style={styles.examTitle}>Primer Parcial</Text>
              <Text style={styles.examSubtitle}>Unidades 1 a 4</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  titleBox: { marginTop: 10 },
  materiaTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  content: { padding: 20, marginTop: -25 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rowText: { marginLeft: 10, fontSize: 14, color: '#444' },
  
  // Estilos de Edición
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  label: { fontSize: 12, color: '#666', marginRight: 10 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ccc', flex: 1, paddingVertical: 2, fontSize: 14, color: '#333' },
  hint: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },

  // Estilos Examen
  examRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: { width: 50, height: 50, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  dayText: { fontSize: 18, fontWeight: 'bold' },
  monthText: { fontSize: 10, fontWeight: 'bold' },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  examSubtitle: { fontSize: 12, color: '#666' },
});