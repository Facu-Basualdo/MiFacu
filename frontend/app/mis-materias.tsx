import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  useColorScheme,
  TouchableWithoutFeedback,
  TextInput,
  LayoutAnimation,
  UIManager,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type EstadoMateriaKey = 'no_cursado' | 'cursado' | 'regular' | 'aprobado';
import { DataRepository as DataRepo } from '../src/services/dataRepository';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { BlurView } from 'expo-blur';
const BlurViewTyped = BlurView as any;

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Estados posibles para las materias
const getEstadosMateria = (theme: any) => ({
  no_cursado: { label: 'No cursado', color: theme.icon, bgColor: theme.icon + '20' },
  cursado: { label: 'Cursando', color: theme.blue, bgColor: theme.blue + '20' },
  regular: { label: 'Regular', color: theme.orange, bgColor: theme.orange + '20' },
  aprobado: { label: 'Aprobado', color: theme.green, bgColor: theme.green + '20' }
} as const);

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
  estado: EstadoMateriaKey;
  createdAt: string;
  updatedAt: string;
  materia: Materia;
  dia?: string;
  hora?: number;
  duracion?: number;
  aula?: string;
}

// --- COMPONENTE AUXILIAR PARA ANIMAR ENTRADA ---
const AnimatedItem = ({ children, index }: { children: React.ReactNode, index?: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: (index || 0) * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: (index || 0) * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

function MisMateriasScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const ESTADOS_MATERIA = getEstadosMateria(theme);

  const { user } = useAuth();
  const isGuest = !user;
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [misMaterias, setMisMaterias] = useState<UsuarioMateria[]>([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [estadoModalVisible, setEstadoModalVisible] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<Materia | null>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoMateriaKey>('no_cursado');
  const [materiaEditando, setMateriaEditando] = useState<UsuarioMateria | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para el Horario (solo si está cursando)
  const [dia, setDia] = useState<string>('LU');
  const [horaInicio, setHoraInicio] = useState<string>('18:00');
  const [horaFin, setHoraFin] = useState<string>('20:00');
  const [aula, setAula] = useState<string>('');

  // Estados para DateTimePicker
  const [horaInicioDate, setHoraInicioDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [horaFinDate, setHoraFinDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d;
  });
  const [showInicioTimePicker, setShowInicioTimePicker] = useState(false);
  const [showFinTimePicker, setShowFinTimePicker] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'todas' | EstadoMateriaKey>('todas');

  // Filtrar materias según búsqueda y filtro
  const materiasFiltradas = useMemo(() => {
    let filtered = misMaterias;

    if (filtroActivo !== 'todas') {
      filtered = filtered.filter(m => m.estado === filtroActivo);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m =>
        m.materia.nombre.toLowerCase().includes(query) ||
        m.materia.nivel?.toString().includes(query) ||
        m.materia.numero?.toString().includes(query)
      );
    }

    return filtered;
  }, [misMaterias, searchQuery, filtroActivo]);

  // --- ANIMACIONES ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const modalSheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalBackdropAnim = useRef(new Animated.Value(0)).current;
  const estadoSheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const estadoBackdropAnim = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerLargeOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const animarAbrirModal = (sheetAnim: Animated.Value, backdropAnim: Animated.Value) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(sheetAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animarCerrarModal = (sheetAnim: Animated.Value, backdropAnim: Animated.Value, callback: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const cerrarModalSeleccion = () => {
    animarCerrarModal(modalSheetAnim, modalBackdropAnim, () => {
      setModalVisible(false);
    });
  };

  const cerrarModalEstado = () => {
    animarCerrarModal(estadoSheetAnim, estadoBackdropAnim, () => {
      setEstadoModalVisible(false);
      setMateriaSeleccionada(null);
      setMateriaEditando(null);
      setModoEdicion(false);
    });
  };

  // Cargar datos iniciales
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const userId = user?.id;
      if (!userId && !isGuest) {
        Alert.alert('Error', 'No se encontró sesión activa');
        router.replace('/');
        return;
      }

      const finalId = userId || 'guest';
      setUsuarioId(finalId);

      // Usar LayoutAnimation para transición suave
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      await Promise.all([
        cargarMisMaterias(finalId),
        cargarMateriasDisponibles(finalId)
      ]);

    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const cargarMisMaterias = async (userId: string) => {
    try {
      const data = await DataRepo.getMisMaterias(userId);
      const sortedData = data.sort((a: any, b: any) => {
        if (a.estado === 'cursado' && b.estado !== 'cursado') return -1;
        if (a.estado !== 'cursado' && b.estado === 'cursado') return 1;
        return (a.materia.numero || 0) - (b.materia.numero || 0);
      });
      setMisMaterias(sortedData);
    } catch (error: any) {
      console.error('Error cargando mis materias:', error);
      throw error;
    }
  };

  const cargarMateriasDisponibles = async (userId: string) => {
    try {
      const data = await DataRepo.getMateriasDisponibles(userId);
      setMateriasDisponibles(data);
    } catch (error: any) {
      console.error('Error cargando materias disponibles:', error);
      throw error;
    }
  };

  const formatDateToTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const onHoraInicioChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // En Android siempre cerrar, en iOS cerrar si se confirmó o canceló
    if (Platform.OS === 'android' || event.type === 'set' || event.type === 'dismissed') {
      setShowInicioTimePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      setHoraInicioDate(selectedDate);
      setHoraInicio(formatDateToTime(selectedDate));
    }
  };

  const onHoraFinChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android' || event.type === 'set' || event.type === 'dismissed') {
      setShowFinTimePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      setHoraFinDate(selectedDate);
      setHoraFin(formatDateToTime(selectedDate));
    }
  };

  const seleccionarMateria = (materia: Materia) => {
    setMateriaSeleccionada(materia);
    setEstadoSeleccionado('no_cursado');
    setDia('LU');
    setHoraInicio('18:00');
    setHoraFin('20:00');
    setAula('');
    setModoEdicion(false);

    const initDate = new Date();
    initDate.setHours(18, 0, 0, 0);
    setHoraInicioDate(initDate);
    const endDate = new Date();
    endDate.setHours(20, 0, 0, 0);
    setHoraFinDate(endDate);

    animarCerrarModal(modalSheetAnim, modalBackdropAnim, () => {
      setModalVisible(false);
      setEstadoModalVisible(true);
      animarAbrirModal(estadoSheetAnim, estadoBackdropAnim);
    });
  };

  const guardarMateria = async () => {
    if (!materiaSeleccionada) return;

    try {
      setLoadingAction(true);

      const parseTime = (timeStr: string) => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        return match ? parseInt(match[1]) : 0;
      };

      const startH = parseTime(horaInicio);
      const endH = parseTime(horaFin);
      const dur = Math.max(1, endH - startH);

      const schedule = estadoSeleccionado === 'cursado' ? {
        dia,
        hora: startH,
        duracion: dur,
        aula: aula.trim() || null
      } : { dia: null, hora: null, duracion: null, aula: null };

      if (modoEdicion && materiaEditando) {
        await DataRepo.updateEstadoMateria(usuarioId, materiaEditando.materiaId, estadoSeleccionado, schedule);
        triggerHaptic('success');
      } else {
        await DataRepo.addMateriaToUsuario(usuarioId, materiaSeleccionada.id, estadoSeleccionado as any, schedule);
        triggerHaptic('success');
      }

      setModoEdicion(false);

      // Cerrar modal y recargar datos sin mostrar pantalla de loading
      cerrarModalEstado();
      await cargarDatos(false);

    } catch (error: any) {
      console.error('Error guardando materia:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const eliminarMateria = async (materiaId: number, nombreMateria: string) => {
    try {
      setLoadingAction(true);
      await DataRepo.removeMateriaFromUsuario(usuarioId, materiaId);
      triggerHaptic('success');
      await cargarDatos(false);
    } catch (error: any) {
      console.error('Error eliminando materia:', error);
      Alert.alert('Error', error.message || 'No se pudo eliminar la materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmarEliminar = (materiaId: number, nombre: string) => {
    Alert.alert(
      'Eliminar materia',
      `¿Estás seguro de eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarMateria(materiaId, nombre) }
      ]
    );
  };

  const abrirDetalleMateria = (usuarioMateria: UsuarioMateria) => {
    setMateriaSeleccionada(usuarioMateria.materia);
    setEstadoSeleccionado(usuarioMateria.estado);
    setMateriaEditando(usuarioMateria);
    setDia(usuarioMateria.dia || 'LU');

    const hIni = usuarioMateria.hora || 18;
    const hFin = hIni + (usuarioMateria.duracion || 2);

    setHoraInicio(`${hIni}:00`);
    setHoraFin(`${hFin}:00`);
    setAula(usuarioMateria.aula || '');

    const initDate = new Date();
    initDate.setHours(hIni, 0, 0, 0);
    setHoraInicioDate(initDate);
    const endDate = new Date();
    endDate.setHours(hFin, 0, 0, 0);
    setHoraFinDate(endDate);

    setModoEdicion(true);
    setEstadoModalVisible(true);
    animarAbrirModal(estadoSheetAnim, estadoBackdropAnim);
  };

  const renderMateriaItem = ({ item }: { item: UsuarioMateria }) => {
    const estadoInfo = ESTADOS_MATERIA[item.estado];

    return (
      <TouchableOpacity
        style={[styles.materiaCard, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => abrirDetalleMateria(item)}
        activeOpacity={0.7}
        accessibilityLabel={`Materia ${item.materia.nombre}, estado ${estadoInfo.label}`}
        accessibilityHint="Toca para editar esta materia"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[estadoInfo.color, estadoInfo.color + '80']}
          style={styles.cardLeftStrip}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.cardMainContent}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.tagContainer, { backgroundColor: estadoInfo.bgColor }]}>
              <Text style={[styles.tagText, { color: estadoInfo.color }]}>
                {estadoInfo.label.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => confirmarEliminar(item.materiaId, item.materia.nombre)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Eliminar ${item.materia.nombre}`}
              accessibilityHint="Toca dos veces para eliminar esta materia"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={18} color={theme.icon} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.materiaNombre, { color: theme.text }]} numberOfLines={1}>
            {item.materia.nombre}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={12} color={theme.icon} />
              <Text style={[styles.materiaNivel, { color: theme.icon }]}>
                Nivel {item.materia.nivel || 'N/A'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="barcode-outline" size={12} color={theme.icon} />
              <Text style={[styles.materiaNivel, { color: theme.icon }]}>
                #{item.materia.numero || 'N/A'}
              </Text>
            </View>
          </View>

          {item.estado === 'cursado' && item.dia && item.hora && (
            <View style={[styles.scheduleBadge, { backgroundColor: theme.background }]}>
              <Ionicons name="time-outline" size={12} color={theme.blue} />
              <Text style={[styles.scheduleText, { color: theme.blue }]}>
                {item.dia} {item.hora}:00 ({item.duracion}hs)
                {item.aula ? ` • ${item.aula}` : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderMateriaDisponible = ({ item }: { item: Materia }) => (
    <TouchableOpacity
      style={[styles.disponibleCard, { backgroundColor: theme.backgroundSecondary }]}
      onPress={() => { triggerHaptic(); seleccionarMateria(item); }}
      disabled={loadingAction}
      activeOpacity={0.7}
      accessibilityLabel={`Agregar ${item.nombre}`}
      accessibilityHint="Toca para agregar esta materia a tu lista"
      accessibilityRole="button"
    >
      <View style={styles.disponibleInfo}>
        <Text style={[styles.disponibleNombre, { color: theme.text }]}>{item.nombre}</Text>
        <Text style={[styles.disponibleNivel, { color: theme.icon }]}>
          Nivel {item.nivel || 'N/A'} • #{item.numero || 'N/A'}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={theme.blue} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.loadingText, { color: theme.icon }]}>Cargando tus materias...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* STICKY HEADER */}
      <Animated.View style={[
        styles.headerInline,
        {
          borderBottomColor: theme.separator,
          opacity: headerOpacity,
        }
      ]}>
        <BlurViewTyped intensity={100} tint={colorScheme} style={StyleSheet.absoluteFill} />
        <View style={styles.headerInlineContent}>
          <TouchableOpacity
            onPress={() => { triggerHaptic(); router.back(); }}
            style={styles.headerBtn}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={theme.blue} />
          </TouchableOpacity>
          <Text style={[styles.headerInlineTitle, { color: theme.text }]}>Mis Materias</Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              setModalVisible(true);
              animarAbrirModal(modalSheetAnim, modalBackdropAnim);
            }}
            style={styles.headerBtn}
            accessibilityLabel="Agregar materia"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={30} color={theme.blue} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* LARGE TITLE HEADER */}
          <View style={styles.headerLarge}>
            <Animated.View style={[styles.headerTopRow, { opacity: headerLargeOpacity }]}>
              <TouchableOpacity
                onPress={() => { triggerHaptic(); router.back(); }}
                style={styles.circularBtn}
                accessibilityLabel="Volver"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={24} color={theme.blue} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setModalVisible(true);
                  animarAbrirModal(modalSheetAnim, modalBackdropAnim);
                }}
                style={[styles.circularBtn, { backgroundColor: theme.blue + '15' }]}
                accessibilityLabel="Agregar materia"
                accessibilityRole="button"
              >
                <Ionicons name="add" size={32} color={theme.blue} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.Text style={[styles.headerLargeTitle, { color: theme.text, opacity: headerLargeOpacity }]}>
              Mis Materias
            </Animated.Text>
          </View>

          {/* BÚSQUEDA Y FILTROS */}
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Ionicons name="search" size={18} color={theme.icon} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar materia..."
                placeholderTextColor={theme.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                accessibilityLabel="Buscar materia"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Limpiar búsqueda"
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={18} color={theme.icon} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContent}
            >
              <TouchableOpacity
                onPress={() => { triggerHaptic(); setFiltroActivo('todas'); }}
                style={[
                  styles.filterChip,
                  { backgroundColor: filtroActivo === 'todas' ? theme.blue : theme.backgroundSecondary }
                ]}
                accessibilityLabel="Filtrar todas"
                accessibilityState={{ selected: filtroActivo === 'todas' }}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.filterChipText,
                  { color: filtroActivo === 'todas' ? '#fff' : theme.text }
                ]}>
                  Todas
                </Text>
              </TouchableOpacity>
              {Object.entries(ESTADOS_MATERIA).map(([key, info]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => { triggerHaptic(); setFiltroActivo(key as EstadoMateriaKey); }}
                  style={[
                    styles.filterChip,
                    { backgroundColor: filtroActivo === key ? info.color : theme.backgroundSecondary }
                  ]}
                  accessibilityLabel={`Filtrar por ${info.label}`}
                  accessibilityState={{ selected: filtroActivo === key }}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: filtroActivo === key ? '#fff' : theme.text }
                  ]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* MIS MATERIAS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.icon }]}>
                {filtroActivo === 'todas' ? 'MIS MATERIAS' : ESTADOS_MATERIA[filtroActivo].label.toUpperCase()} ({materiasFiltradas.length})
              </Text>
            </View>

            {materiasFiltradas.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
                {misMaterias.length === 0 ? (
                  <>
                    <Ionicons name="book-outline" size={48} color={theme.icon} style={{ opacity: 0.3 }} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>No tienes materias</Text>
                    <Text style={[styles.emptySubtext, { color: theme.icon }]}>Agrega tus primeras materias para comenzar</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="search-outline" size={48} color={theme.icon} style={{ opacity: 0.3 }} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>Sin resultados</Text>
                    <Text style={[styles.emptySubtext, { color: theme.icon }]}>
                      No hay materias que coincidan con tu búsqueda
                    </Text>
                  </>
                )}
              </View>
            ) : (
              materiasFiltradas.map((item, index) => (
                <AnimatedItem key={item.id} index={index}>
                  {renderMateriaItem({ item })}
                </AnimatedItem>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      {/* MODAL PARA AGREGAR MATERIAS */}
      {modalVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={cerrarModalSeleccion}>
            <Animated.View style={[styles.modalOverlay, { opacity: modalBackdropAnim }]}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      backgroundColor: theme.backgroundSecondary + 'CC',
                      transform: [{ translateY: modalSheetAnim }]
                    }
                  ]}
                >
                  <BlurViewTyped intensity={80} tint={colorScheme} style={StyleSheet.absoluteFill} />
                  <View style={[styles.modalHandle, { backgroundColor: theme.separator }]} />
                  <View style={styles.estadoModalHeader}>
                    <TouchableOpacity onPress={cerrarModalSeleccion}>
                      <Text style={[styles.cancelButton, { color: theme.red }]}>Cerrar</Text>
                    </TouchableOpacity>
                    <Text style={[styles.estadoModalTitle, { color: theme.text }]}>Seleccionar Materia</Text>
                    <View style={{ width: 60 }} />
                  </View>

                  <Text style={[styles.modalSubtitle, { color: theme.icon }]}>
                    Elige una materia para continuar ({materiasDisponibles.length} disponibles)
                  </Text>

                  {materiasDisponibles.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkmark-circle" size={48} color={theme.green} />
                      <Text style={[styles.emptyText, { color: theme.text }]}>¡Todo al día!</Text>
                      <Text style={[styles.emptySubtext, { color: theme.icon }]}>Ya tienes todas las materias disponibles</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={materiasDisponibles}
                      renderItem={renderMateriaDisponible}
                      keyExtractor={(item) => item.id.toString()}
                      style={styles.modalList}
                      showsVerticalScrollIndicator={false}
                    />
                  )}
                  <View style={{ height: 30 }} />
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {/* MODAL PARA SELECCIONAR ESTADO */}
      {estadoModalVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={cerrarModalEstado}>
              <Animated.View style={[styles.modalOverlay, { opacity: estadoBackdropAnim }]}>
                <TouchableWithoutFeedback>
                  <Animated.View
                    style={[
                      styles.estadoModalContent,
                      {
                        backgroundColor: theme.backgroundSecondary + 'CC',
                        transform: [{ translateY: estadoSheetAnim }]
                      }
                    ]}
                  >
                    <BlurViewTyped intensity={80} tint={colorScheme} style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalHandle, { backgroundColor: theme.icon + '40' }]} />
                    <View style={styles.estadoModalHeader}>
                      <TouchableOpacity onPress={cerrarModalEstado}>
                        <Text style={[styles.cancelButton, { color: theme.red }]}>Cancelar</Text>
                      </TouchableOpacity>
                      <Text style={[styles.estadoModalTitle, { color: theme.text }]}>
                        {modoEdicion ? 'Editar' : 'Estado'}
                      </Text>
                      <TouchableOpacity onPress={guardarMateria} disabled={loadingAction}>
                        <Text style={[styles.doneButton, { color: theme.blue }, loadingAction && { opacity: 0.5 }]}>
                          {loadingAction ? '...' : (modoEdicion ? 'Guardar' : 'Agregar')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {materiaSeleccionada && (
                      <View style={[styles.materiaSeleccionadaContainer, { backgroundColor: theme.background }]}>
                        <View style={styles.materiaSeleccionadaInfo}>
                          <Text style={[styles.materiaSeleccionadaNombre, { color: theme.text }]}>{materiaSeleccionada.nombre}</Text>
                          <Text style={[styles.materiaSeleccionadaNivel, { color: theme.icon }]}>
                            Nivel {materiaSeleccionada.nivel || 'N/A'} • #{materiaSeleccionada.numero || 'N/A'}
                          </Text>
                        </View>
                      </View>
                    )}

                    <ScrollView
                      style={styles.estadoOptionsScrollView}
                      contentContainerStyle={styles.estadoOptionsContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={[styles.modalSectionHeader, { color: theme.icon }]}>SELECCIONAR ESTADO</Text>
                      <View style={[styles.formGroup, { backgroundColor: theme.background }]}>
                        {Object.entries(ESTADOS_MATERIA).map(([key, info], index, arr) => (
                          <TouchableOpacity
                            key={key}
                            style={[
                              styles.inputRow,
                              { borderBottomColor: theme.separator, borderBottomWidth: index === arr.length - 1 ? 0 : StyleSheet.hairlineWidth }
                            ]}
                            onPress={() => { triggerHaptic(); setEstadoSeleccionado(key as EstadoMateriaKey); }}
                            disabled={loadingAction}
                          >
                            <View style={styles.estadoOptionLeft}>
                              <View style={[styles.estadoDot, { backgroundColor: info.color }]} />
                              <Text style={[
                                styles.estadoOptionText,
                                { color: theme.text },
                                estadoSeleccionado === key && { fontWeight: '600' }
                              ]}>
                                {info.label}
                              </Text>
                            </View>
                            {estadoSeleccionado === key && (
                              <Ionicons name="checkmark" size={20} color={theme.blue} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>

                      {estadoSeleccionado === 'cursado' && (
                        <>
                          <Text style={[styles.modalSectionHeader, { color: theme.icon, marginTop: 10 }]}>HORARIO DE CURSADA</Text>
                          <View style={[styles.formGroup, { backgroundColor: theme.background }]}>
                            {/* DÍA */}
                            <View style={[styles.inputRow, { borderBottomColor: theme.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                              <Text style={[styles.inputLabel, { color: theme.text }]}>Día</Text>
                              <View style={styles.daysContainer}>
                                {['LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map((d) => (
                                  <TouchableOpacity
                                    key={d}
                                    onPress={() => { triggerHaptic(); setDia(d); }}
                                    style={[
                                      styles.dayOption,
                                      { backgroundColor: dia === d ? theme.blue : theme.backgroundSecondary }
                                    ]}
                                  >
                                    <Text style={[styles.dayOptionText, { color: dia === d ? '#fff' : theme.text }]}>{d}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>

                            {/* HORA INICIO */}
                            <View style={[styles.inputRow, { borderBottomColor: theme.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                              <Text style={[styles.inputLabel, { color: theme.text }]}>Hora Inicio</Text>
                              <TouchableOpacity
                                onPress={() => setShowInicioTimePicker(true)}
                                style={styles.timeButton}
                              >
                                <Text style={[styles.timeButtonText, { color: theme.blue }]}>{horaInicio}</Text>
                              </TouchableOpacity>
                            </View>
                            {showInicioTimePicker && (
                              <DateTimePicker
                                value={horaInicioDate}
                                mode="time"
                                is24Hour={true}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onHoraInicioChange}
                                minuteInterval={30}
                              />
                            )}

                            {/* HORA FIN */}
                            <View style={[styles.inputRow, { borderBottomColor: theme.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                              <Text style={[styles.inputLabel, { color: theme.text }]}>Hora Fin</Text>
                              <TouchableOpacity
                                onPress={() => setShowFinTimePicker(true)}
                                style={styles.timeButton}
                              >
                                <Text style={[styles.timeButtonText, { color: theme.blue }]}>{horaFin}</Text>
                              </TouchableOpacity>
                            </View>
                            {showFinTimePicker && (
                              <DateTimePicker
                                value={horaFinDate}
                                mode="time"
                                is24Hour={true}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onHoraFinChange}
                                minuteInterval={30}
                              />
                            )}

                            {/* AULA */}
                            <View style={styles.inputRow}>
                              <Text style={[styles.inputLabel, { color: theme.text }]}>Aula</Text>
                              <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                value={aula}
                                onChangeText={setAula}
                                placeholder="Ej: 304 o Zoom"
                                placeholderTextColor={theme.icon}
                              />
                            </View>
                          </View>
                        </>
                      )}
                    </ScrollView>
                    <View style={{ height: 30 }} />
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      )}

      {loadingAction && (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  scrollView: { flex: 1 },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15, paddingHorizontal: 5
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  materiaCard: {
    borderRadius: 20, flexDirection: 'row', marginBottom: 16,
    overflow: 'hidden', elevation: 4, shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  cardLeftStrip: { width: 6, height: '100%' },
  cardMainContent: { flex: 1, padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tagContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  materiaNombre: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  cardFooter: { flexDirection: 'row' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  materiaNivel: { fontSize: 12, marginLeft: 4, fontWeight: '500' },
  chevronContainer: { paddingRight: 12, justifyContent: 'center' },

  disponibleCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 16, marginBottom: 10, elevation: 1, shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3
  },
  disponibleInfo: { flex: 1 },
  disponibleNombre: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  disponibleNivel: { fontSize: 13 },

  emptyState: { alignItems: 'center', padding: 40, borderRadius: 20, marginTop: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 15 },
  emptySubtext: { fontSize: 14, marginTop: 5, textAlign: 'center', width: '80%', opacity: 0.7 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30,
    maxHeight: '85%', minHeight: '50%'
  },
  estadoModalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30,
    height: '95%',
  },
  modalHandle: {
    width: 40, height: 5, borderRadius: 3,
    alignSelf: 'center', marginBottom: 15, marginTop: 5
  },
  modalSubtitle: { fontSize: 14, marginBottom: 20, paddingHorizontal: 5 },
  modalList: { flex: 1 },

  estadoModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingTop: 5
  },
  estadoModalTitle: { fontSize: 17, fontWeight: '700' },
  cancelButton: { fontSize: 17 },
  doneButton: { fontSize: 17, fontWeight: '600' },

  materiaSeleccionadaContainer: {
    padding: 16, borderRadius: 14, marginBottom: 25,
    flexDirection: 'row', alignItems: 'center'
  },
  materiaSeleccionadaInfo: { flex: 1 },
  materiaSeleccionadaNombre: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  materiaSeleccionadaNivel: { fontSize: 13 },

  estadoOptionsScrollView: { flex: 1 },
  estadoOptionsContent: { paddingBottom: 10 },
  modalSectionHeader: { fontSize: 12, fontWeight: '600', marginBottom: 10, marginLeft: 5, textTransform: 'uppercase' },

  formGroup: { borderRadius: 12, overflow: 'hidden', marginBottom: 25 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 50,
  },
  estadoOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  estadoDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  estadoOptionText: { fontSize: 17 },

  inputLabel: { fontSize: 17, minWidth: 100 },
  textInput: { flex: 1, fontSize: 17, textAlign: 'right' },
  daysContainer: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end' },
  timeButton: { paddingVertical: 8, paddingHorizontal: 12 },
  timeButtonText: { fontSize: 17, fontWeight: '500' },
  dayOption: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 4 },
  dayOptionText: { fontSize: 13, fontWeight: '600' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', zIndex: 999
  },
  scheduleBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,122,255,0.2)'
  },
  scheduleText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },

  headerInline: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
    zIndex: 10, borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end', paddingBottom: 10,
  },
  headerInlineContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerInlineTitle: { fontSize: 17, fontWeight: '600' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  filtersScroll: { marginHorizontal: -20 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: { fontSize: 14, fontWeight: '600' },

  headerLarge: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  circularBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(120, 120, 128, 0.1)',
    alignItems: 'center', justifyContent: 'center'
  },
  headerLargeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: 0.37 }
});

export default MisMateriasScreen;
