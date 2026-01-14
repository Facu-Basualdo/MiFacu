import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { materiasApi as api } from '../src/services/api';

const { width } = Dimensions.get('window');

// Estados posibles para las materias
const ESTADOS_MATERIA = {
  no_cursado: { label: 'No cursado', color: '#757575', bgColor: '#75757520' },
  cursado: { label: 'Cursando', color: '#2196F3', bgColor: '#2196F320' },
  regular: { label: 'Regular', color: '#FF9800', bgColor: '#FF980020' },
  aprobado: { label: 'Aprobado', color: '#4CAF50', bgColor: '#4CAF5020' }
};

interface Materia {
  id: number;
  nombre: string;
  nivel?: string;
  numero?: number;
}

interface UsuarioMateria {
  id: number;
  usuarioId: string;
  materiaId: number;
  estado: keyof typeof ESTADOS_MATERIA;
  createdAt: string;
  updatedAt: string;
  materia: Materia;
}

function MisMateriasScreen() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [misMaterias, setMisMaterias] = useState<UsuarioMateria[]>([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [estadoModalVisible, setEstadoModalVisible] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<Materia | null>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<keyof typeof ESTADOS_MATERIA>('no_cursado');
  const [materiaEditando, setMateriaEditando] = useState<UsuarioMateria | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Cargar datos iniciales
  useFocusEffect(
    React.useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Obtener usuario actual
      const userId = await AsyncStorage.getItem('usuario_nombre');
      if (!userId) {
        Alert.alert('Error', 'No se encontró información del usuario');
        router.replace('/');
        return;
      }

      setUsuarioId(userId);

      // Cargar materias del usuario y disponibles
      await Promise.all([
        cargarMisMaterias(userId),
        cargarMateriasDisponibles(userId)
      ]);

    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarMisMaterias = async (userId: string) => {
    try {
      const data = await api.getMateriasByUsuario(userId);
      // Ordenar por número de materia como respaldo
      const sortedData = data.sort((a: any, b: any) => (a.materia.numero || 0) - (b.materia.numero || 0));
      setMisMaterias(sortedData);
    } catch (error: any) {
      console.error('Error cargando mis materias:', error);
      throw error;
    }
  };

  const cargarMateriasDisponibles = async (userId: string) => {
    try {
      const data = await api.getMateriasDisponibles(userId);
      setMateriasDisponibles(data);
    } catch (error: any) {
      console.error('Error cargando materias disponibles:', error);
      throw error;
    }
  };

  const seleccionarMateria = (materia: Materia) => {
    setMateriaSeleccionada(materia);
    setEstadoSeleccionado('no_cursado'); // Estado por defecto
    setModoEdicion(false);
    setModalVisible(false); // Cerrar primera modal
    setEstadoModalVisible(true); // Abrir segunda modal
  };

  const guardarMateria = async () => {
    if (!materiaSeleccionada) return;

    try {
      setLoadingAction(true);

      if (modoEdicion && materiaEditando) {
        // Modo edición: actualizar estado
        await api.updateEstadoMateria(usuarioId, materiaEditando.materiaId, estadoSeleccionado);
        Alert.alert('¡Éxito!', 'Estado de materia actualizado correctamente');
      } else {
        // Modo agregar: crear nueva materia
        await api.addMateriaToUsuario(usuarioId, materiaSeleccionada.id, estadoSeleccionado as any);
        Alert.alert('¡Éxito!', 'Materia agregada correctamente');
      }

      setEstadoModalVisible(false);
      setMateriaSeleccionada(null);
      setMateriaEditando(null);
      setEstadoSeleccionado('no_cursado');
      setModoEdicion(false);

      await cargarDatos(); // Recargar datos
    } catch (error: any) {
      console.error('Error guardando materia:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const cambiarEstado = async (materiaId: number, nuevoEstado: keyof typeof ESTADOS_MATERIA) => {
    try {
      setLoadingAction(true);
      await api.updateEstadoMateria(usuarioId, materiaId, nuevoEstado);
      await cargarDatos(); // Recargar datos
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      Alert.alert('Error', error.message || 'No se pudo cambiar el estado de la materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const eliminarMateria = async (materiaId: number, nombreMateria: string) => {
    Alert.alert(
      'Eliminar materia',
      `¿Estás seguro de que quieres eliminar "${nombreMateria}" de tus materias?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingAction(true);
              await api.removeMateriaFromUsuario(usuarioId, materiaId);
              Alert.alert('¡Éxito!', 'Materia eliminada correctamente');
              await cargarDatos(); // Recargar datos
            } catch (error: any) {
              console.error('Error eliminando materia:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la materia');
            } finally {
              setLoadingAction(false);
            }
          }
        }
      ]
    );
  };

  const abrirDetalleMateria = (usuarioMateria: UsuarioMateria) => {
    setMateriaSeleccionada(usuarioMateria.materia);
    setEstadoSeleccionado(usuarioMateria.estado);
    setMateriaEditando(usuarioMateria);
    setModoEdicion(true);
    setEstadoModalVisible(true);
  };

  const renderMateriaItem = ({ item }: { item: UsuarioMateria }) => {
    const estadoInfo = ESTADOS_MATERIA[item.estado];

    return (
      <View style={styles.materiaCardContainer}>
        <TouchableOpacity
          style={styles.materiaCard}
          onPress={() => abrirDetalleMateria(item)}
          activeOpacity={0.7}
        >
          <View style={styles.materiaInfo}>
            <Text style={styles.materiaNombre}>{item.materia.nombre}</Text>
            <Text style={styles.materiaNivel}>
              Nivel {item.materia.nivel || 'N/A'} • #{item.materia.numero || 'N/A'}
            </Text>
          </View>

          <View style={styles.materiaActions}>
            <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bgColor }]}>
              <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
                {estadoInfo.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        {/* Botón de eliminar en esquina superior derecha */}
        <TouchableOpacity
          style={styles.deleteButtonOverlay}
          onPress={() => eliminarMateria(item.materiaId, item.materia.nombre)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color="#FF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMateriaDisponible = ({ item }: { item: Materia }) => (
    <TouchableOpacity
      style={styles.disponibleCard}
      onPress={() => seleccionarMateria(item)}
      disabled={loadingAction}
    >
      <View style={styles.disponibleInfo}>
        <Text style={styles.disponibleNombre}>{item.nombre}</Text>
        <Text style={styles.disponibleNivel}>
          Nivel {item.nivel || 'N/A'} • #{item.numero || 'N/A'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando tus materias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E5EC9" />

      {/* HEADER */}
      <LinearGradient colors={['#2E5EC9', '#4675D9']} style={styles.header}>
        <SafeAreaView style={{ width: '100%' }}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mis Materias</Text>
            <View />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* MIS MATERIAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MIS MATERIAS ({misMaterias.length})</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <LinearGradient
                colors={['#007AFF', '#0056CC']}
                style={styles.addButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Agregar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {misMaterias.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tienes materias agregadas</Text>
              <Text style={styles.emptySubtext}>Agrega tus primeras materias para comenzar</Text>
            </View>
          ) : (
            <FlatList
              data={misMaterias}
              renderItem={renderMateriaItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* MODAL PARA AGREGAR MATERIAS */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Materia</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Elige una materia para continuar ({materiasDisponibles.length} disponibles)
            </Text>

            {materiasDisponibles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.emptyText}>¡Todas las materias agregadas!</Text>
                <Text style={styles.emptySubtext}>Ya tienes todas las materias disponibles</Text>
              </View>
            ) : (
              <FlatList
                data={materiasDisponibles}
                renderItem={renderMateriaDisponible}
                keyExtractor={(item) => item.id.toString()}
                style={styles.modalList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL PARA SELECCIONAR ESTADO */}
      <Modal
        visible={estadoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEstadoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.estadoModalContent}>
            <View style={styles.estadoModalHeader}>
              <TouchableOpacity onPress={() => setEstadoModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.estadoModalTitle}>
                {modoEdicion ? 'Editar Materia' : 'Seleccionar Estado'}
              </Text>
              <TouchableOpacity onPress={guardarMateria} disabled={loadingAction}>
                <Text style={[styles.doneButton, loadingAction && { opacity: 0.5 }]}>
                  {loadingAction ? (modoEdicion ? 'Guardando...' : 'Agregando...') : (modoEdicion ? 'Guardar' : 'Agregar')}
                </Text>
              </TouchableOpacity>
            </View>

            {materiaSeleccionada && (
              <View style={styles.materiaSeleccionadaContainer}>
                <View style={styles.materiaSeleccionadaInfo}>
                  <Text style={styles.materiaSeleccionadaNombre}>{materiaSeleccionada.nombre}</Text>
                  <Text style={styles.materiaSeleccionadaNivel}>
                    Nivel {materiaSeleccionada.nivel || 'N/A'} • #{materiaSeleccionada.numero || 'N/A'}
                  </Text>
                </View>
                {modoEdicion && materiaEditando && (
                  <View style={styles.estadoActualBadgeSmall}>
                    <Text style={[styles.estadoActualTextSmall, {
                      color: ESTADOS_MATERIA[materiaEditando.estado].color
                    }]}>
                      {ESTADOS_MATERIA[materiaEditando.estado].label}
                    </Text>
                  </View>
                )}
              </View>
            )}


            <ScrollView
              style={styles.estadoOptionsScrollView}
              contentContainerStyle={styles.estadoOptionsContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.estadoOptionsTitle}>Estado de la materia:</Text>
              {Object.entries(ESTADOS_MATERIA).map(([key, info]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.estadoOption,
                    estadoSeleccionado === key && styles.estadoOptionSelected
                  ]}
                  onPress={() => setEstadoSeleccionado(key as keyof typeof ESTADOS_MATERIA)}
                  disabled={loadingAction}
                >
                  <View style={styles.estadoOptionLeft}>
                    <View style={[styles.estadoDot, { backgroundColor: info.color }]} />
                    <Text style={[
                      styles.estadoOptionText,
                      estadoSeleccionado === key && styles.estadoOptionTextSelected
                    ]}>
                      {info.label}
                    </Text>
                  </View>
                  {estadoSeleccionado === key && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loadingAction && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9'
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },

  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 50 },

  section: { marginBottom: 30 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8898AA',
    letterSpacing: 1
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },

  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },

  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 10
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10
  },

  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  },

  materiaCardContainer: {
    position: 'relative',
    marginBottom: 10
  },

  materiaCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },

  deleteButtonOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF444420',
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },

  materiaInfo: { marginBottom: 8 },

  materiaNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },

  materiaNivel: {
    fontSize: 11,
    color: '#666'
  },

  materiaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },

  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },

  estadoText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  estadoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6
  },

  estadoButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },

  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FF444420'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%'
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    padding: 20,
    paddingTop: 0
  },

  modalList: {
    paddingHorizontal: 20
  },

  disponibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1
  },

  disponibleInfo: { flex: 1 },

  disponibleNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },

  disponibleNivel: {
    fontSize: 12,
    color: '#666'
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Estilos para la segunda modal (seleccionar estado)
  estadoModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    minHeight: '40%'
  },

  estadoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5'
  },

  estadoModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333'
  },

  cancelButton: {
    fontSize: 17,
    color: '#007AFF',
    padding: 8
  },

  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    padding: 8
  },

  materiaSeleccionadaContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  materiaSeleccionadaInfo: {
    flex: 1
  },

  materiaSeleccionadaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },

  materiaSeleccionadaNivel: {
    fontSize: 12,
    color: '#666'
  },

  estadoActualBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },

  estadoActualTextSmall: {
    fontSize: 11,
    fontWeight: '600'
  },



  estadoOptionsScrollView: {
    maxHeight: 280, // Altura aumentada para mostrar más opciones sin scroll
  },

  estadoOptionsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20
  },

  estadoOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16
  },

  estadoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4
  },

  estadoOptionSelected: {
    backgroundColor: '#007AFF15'
  },

  estadoOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  estadoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },

  estadoOptionText: {
    fontSize: 17,
    color: '#333'
  },

  estadoOptionTextSelected: {
    fontWeight: '600',
    color: '#007AFF'
  },

});

export default MisMateriasScreen;
