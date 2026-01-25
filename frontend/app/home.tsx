import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  useColorScheme,
  TextInput,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  Animated,
  Platform,
  Switch,
  Appearance
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/constants/theme';
import { useThemeColor } from '../src/hooks/use-theme-color';
import { useAuth } from '../src/context/AuthContext';
import { materiasApi } from '../src/services/api';
import { DataRepository } from '../src/services/dataRepository';
import { HomeSkeleton } from '../src/components/Skeleton';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, isGuest, loading: authLoading, signOut } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [carreraProgreso, setCarreraProgreso] = useState(0);

  // Estados para Quick Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Estados para el Modal de Estadísticas
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false); // Estado Modo Privado

  // Estados para el Modal de Perfil
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');
  const [stats, setStats] = useState({
    aprobadas: 0,
    cursando: 0,
    regulares: 0,
    totalPlan: 0,
    noCursadas: 0
  });

  const [proximaClase, setProximaClase] = useState<any>(null);

  // Colores dinámicos
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'backgroundSecondary');
  const separatorColor = useThemeColor({}, 'separator');

  // ANIMACIONES ANIMATED (Estable en esta versión)
  const notificationAnim = useRef(new Animated.Value(-100)).current;
  const notificationOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones Sheet Estadísticas
  const statsSheetAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const statsOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones Sheet Perfil
  const profileSheetAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const profileOverlayOpacity = useRef(new Animated.Value(0)).current;

  // FASE 1: Header iOS Colapsable - scrollY ref e interpolaciones
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const openStats = () => {
    setStatsModalVisible(true);
    Animated.parallel([
      Animated.timing(statsOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(statsSheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
        mass: 0.8,
      }),
    ]).start();
  };

  const closeStats = () => {
    Animated.parallel([
      Animated.timing(statsOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsSheetAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setStatsModalVisible(false));
  };

  // Funciones Modal Perfil
  const openProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileModalVisible(true);
    Animated.parallel([
      Animated.timing(profileOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(profileSheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
        mass: 0.8,
      }),
    ]).start();
  };

  const closeProfile = () => {
    Animated.parallel([
      Animated.timing(profileOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(profileSheetAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setProfileModalVisible(false));
  };

  const toggleDarkMode = async (value: boolean) => {
    setDarkModeEnabled(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('theme_preference', value ? 'dark' : 'light');
    // Nota: Para cambio real del tema necesitarías un contexto de tema global
    // Por ahora guardamos la preferencia
  };

  // Cargar datos reales
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        loadData();
        checkPrivacyMode();
      }
    }, [user, isGuest, authLoading])
  );

  const checkPrivacyMode = async () => {
    try {
      const mode = await AsyncStorage.getItem('privacy_mode');
      if (mode === 'true') setPrivacyMode(true);
    } catch (e) { }
  };

  const togglePrivacyMode = async () => {
    const newVal = !privacyMode;
    setPrivacyMode(newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('privacy_mode', String(newVal));
  };

  const loadData = async () => {
    // No hacer nada si aún estamos cargando el estado de autenticación
    if (authLoading) return;

    try {
      setLoading(true);

      // Si no hay usuario y no es invitado, no podemos cargar nada del backend
      if (!user && !isGuest) {
        setLoading(false);
        return;
      }

      let userId = user?.id || null;

      // Cargar Recordatorios (Quick Tasks)
      const recordatorios = await DataRepository.getRecordatorios(isGuest);
      console.log("Recordatorios loaded:", recordatorios); // DEBUG
      setTasks(Array.isArray(recordatorios) ? recordatorios : []);

      if (userId) {
        // 1. Obtener materias del usuario
        const userMaterias = await materiasApi.getMateriasByUsuario(userId);

        // 2. Obtener TODAS las materias del plan
        const allMaterias = await materiasApi.getMaterias();
        const totalPlan = allMaterias ? allMaterias.length : 0;

        // 3. Calcular Estadísticas
        const aprobadas = userMaterias ? userMaterias.filter((m: any) => m.estado === 'aprobado').length : 0;
        const cursando = userMaterias ? userMaterias.filter((m: any) => m.estado === 'cursado').length : 0;
        const regulares = userMaterias ? userMaterias.filter((m: any) => m.estado === 'regular').length : 0;
        const noCursadas = totalPlan - (userMaterias ? userMaterias.length : 0);

        setStats({
          aprobadas,
          cursando,
          regulares,
          totalPlan,
          noCursadas
        });

        if (totalPlan > 0) {
          const porcentaje = Math.round((aprobadas / totalPlan) * 100);
          setCarreraProgreso(porcentaje);
        }

        // 4. Calcular Próxima Clase
        const cursandoMaterias = userMaterias.filter((m: any) =>
          String(m.estado).toLowerCase().includes('cursad') && m.dia && m.hora !== null
        );

        if (cursandoMaterias.length > 0) {
          const diasSemana = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
          const hoy = new Date();
          const diaActual = diasSemana[hoy.getDay()];
          const horaActual = hoy.getHours();

          let proxima = null;
          let actual = null;
          let minDiff = Infinity;

          cursandoMaterias.forEach((m: any) => {
            if (m.dia === diaActual) {
              const horaMateria = parseInt(m.hora);
              const duracion = parseInt(m.duracion) || 2; // Default 2hs
              const horaMateriaFin = horaMateria + duracion;
              const diff = horaMateria - horaActual;

              // 1. Prioridad: ¿Estamos en clase ahora?
              if (horaActual >= horaMateria && horaActual < horaMateriaFin) {
                actual = {
                  materia: m.materia?.nombre || m.nombre,
                  hora: `${m.hora}:00 a ${horaMateriaFin}:00 hs`,
                  aula: m.aula || 'Aula',
                  tipo: 'Clase Actual'
                };
              }
              // 2. Si no, ¿cuál es la siguiente?
              else if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                proxima = {
                  materia: m.materia?.nombre || m.nombre,
                  hora: `${m.hora}:00 hs`,
                  aula: m.aula || 'Aula',
                  tipo: 'Próxima Clase'
                };
              }
            }
          });

          if (actual) {
            setProximaClase(actual);
          } else if (proxima) {
            setProximaClase(proxima);
          } else {
            // Si no hay más hoy, buscar la primera del día de mañana o simplemente mostrar "Ver agenda"
            setProximaClase({
              materia: "No hay más clases hoy",
              hora: "Ver Horarios",
              aula: "-",
              tipo: "Horarios"
            });
          }
        } else {
          setProximaClase(null);
        }
      } else if (isGuest) {
        setCarreraProgreso(0);
        setStats({ aprobadas: 0, cursando: 0, regulares: 0, totalPlan: 0, noCursadas: 0 });
        setProximaClase(null);
      }
    } catch (error) {
      console.error("Error cargando progreso:", error);
    } finally {
      setLoading(false);
      // Disparar animación de notificación después de cargar
      Animated.parallel([
        Animated.timing(notificationAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(notificationOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    try {
      setAddingTask(true);
      const taskData = {
        nombre: newTask.trim(),
        descripcion: 'Tarea Rápida',
        fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        hora: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
        tipo: 'quick_task'
      };

      console.log('🚀 [Home] Intentando crear tarea:', { isGuest, taskData }); // DEBUG LOG

      const created = await DataRepository.createRecordatorio(isGuest, taskData);
      console.log('✅ [Home] Tarea creada respuesta:', created); // DEBUG LOG

      setTasks(prev => [...prev, created]);
      setNewTask('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('❌ [Home] Error creando tarea:', error); // DEBUG LOG
      Alert.alert('Error', 'No se pudo agregar la tarea');
    } finally {
      setAddingTask(false);
    }
  };

  const handleCompleteTask = async (id: number) => {
    try {
      // Optimistic update: remove immediately from UI
      setTasks(prev => prev.filter(t => t.id !== id));
      await DataRepository.deleteRecordatorio(isGuest, id);
    } catch (error) {
      console.error("Error deleting task:", error);
      // Re-fetch if fails
      loadData();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* STICKY HEADER INLINE (Aparece al colapsar) */}
      <Animated.View style={[
        styles.headerInline,
        {
          borderBottomColor: theme.separator,
          opacity: headerOpacity,
          backgroundColor: backgroundColor + 'EE'
        }
      ]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.headerInlineContent}>
            <Text style={[styles.headerInlineTitle, { color: textColor }]}>Mi Panel</Text>
            <TouchableOpacity
              onPress={openProfile}
              style={styles.headerInlineAvatar}
              accessibilityLabel="Abrir perfil"
              accessibilityRole="button"
            >
              <Image
                source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                style={styles.avatarSmall}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* LARGE TITLE HEADER (Dentro del scroll, colapsa) */}
        <Animated.View style={[styles.header, { borderBottomColor: 'transparent', paddingBottom: 10, opacity: headerLargeOpacity }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.headerLabel, { color: theme.icon }]}>MI PANEL</Text>
                <Text style={[styles.headerTitle, { color: textColor }]}>
                  Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'} 👋
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openProfile}
                style={[styles.avatarContainer, { borderColor: theme.tint + '40' }]}
                accessibilityLabel="Abrir perfil"
                accessibilityRole="button"
              >
                <Image
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                  style={styles.avatar}
                  accessibilityLabel="Foto de perfil"
                />
              </TouchableOpacity>
            </View>

            {/* BARRA DE PROGRESO DE CARRERA */}
            <View style={styles.progressSection}>
              <Pressable
                onPress={openStats}
                accessibilityLabel={`Ver estadísticas. Progreso: ${privacyMode ? 'oculto' : carreraProgreso + ' por ciento'}`}
                accessibilityRole="button"
              >
                <View style={styles.progressInfo}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={togglePrivacyMode}
                    activeOpacity={0.6}
                    accessibilityLabel={privacyMode ? "Mostrar progreso" : "Ocultar progreso"}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.progressText, { color: theme.icon }]}>Progreso de Carrera</Text>
                    <Ionicons
                      name={privacyMode ? "eye-off-outline" : "eye-outline"}
                      size={16}
                      color={theme.icon}
                      style={{ marginLeft: 6, opacity: 0.8 }}
                    />
                  </TouchableOpacity>

                  <Text style={[styles.progressPercentage, { color: privacyMode ? theme.icon : theme.tint }]}>
                    {privacyMode ? "•••" : `${carreraProgreso}%`}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.separator + '40' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: privacyMode ? '0%' : `${carreraProgreso}%`,
                        backgroundColor: theme.tint,
                        opacity: privacyMode ? 0 : 1
                      }
                    ]}
                  />
                  {privacyMode && (
                    <View style={[StyleSheet.absoluteFill, {
                      backgroundColor: theme.separator,
                      borderRadius: 3,
                      opacity: 0.2
                    }]} />
                  )}
                </View>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* NOTIFICACIÓN "PRÓXIMO PASO" (Card sutil y legible) */}
        {!loading && proximaClase && (
          <Animated.View
            style={[
              styles.inlinePillContainer,
              {
                opacity: notificationOpacity,
                transform: [{ translateY: notificationAnim }]
              }
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.nextStepPill,
                { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 }
              ]}
              onPress={() => router.push('/horarios' as any)}
            >
              <View style={styles.pillHeader}>
                <View style={styles.pillBadge}>
                  <Ionicons name="notifications" size={14} color="white" />
                  <Text style={styles.pillBadgeText}>{proximaClase.tipo}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </View>

              <Text style={styles.pillMateria}>{proximaClase.materia}</Text>

              <View style={styles.pillFooter}>
                <View style={styles.pillInfoItem}>
                  <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.pillInfoText}>{proximaClase.hora}</Text>
                </View>
                {proximaClase.aula && proximaClase.aula !== '-' && (
                  <View style={[styles.pillInfoItem, { marginLeft: 16 }]}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.pillInfoText}>{proximaClase.aula}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        )}
        {/* SKELETON LOADING o CONTENIDO */}
        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* SECCIÓN: TAREAS RÁPIDAS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.icon }]}>TAREAS RÁPIDAS</Text>
              <View style={styles.tasksContainer}>
                {/* Input Row */}
                <View style={[styles.taskInputRow]}>
                  <TextInput
                    placeholder="Agregar nueva tarea..."
                    placeholderTextColor={theme.icon}
                    style={[styles.taskInput, { color: theme.text }]}
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                    accessibilityLabel="Agregar nueva tarea"
                    accessibilityHint="Escribe el nombre de la tarea y presiona enter"
                  />
                  <TouchableOpacity
                    onPress={handleAddTask}
                    disabled={addingTask || !newTask.trim()}
                    style={[styles.addTaskButton, { backgroundColor: newTask.trim() ? theme.tint : theme.separator }]}
                    accessibilityLabel="Agregar tarea"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: addingTask || !newTask.trim() }}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Tasks List with Staggered Animations */}
                {tasks.length === 0 ? (
                  <View style={styles.emptyTasks} accessibilityLabel="No hay tareas pendientes">
                    <Ionicons name="create-outline" size={24} color={theme.separator} style={{ marginBottom: 5 }} />
                    <Text style={[styles.emptyTasksText, { color: theme.icon }]}>No hay tareas pendientes</Text>
                  </View>
                ) : (
                  tasks.map((task: any, index: number) => (
                    <AnimatedItem key={task.id} index={index} delay={50}>
                      <SwipeableTask
                        onDelete={() => handleCompleteTask(task.id)}
                        theme={theme}
                      >
                        <TaskItem
                          task={task}
                          onDelete={() => handleCompleteTask(task.id)}
                          theme={theme}
                          separatorColor={separatorColor}
                          isGuest={isGuest}
                        />
                      </SwipeableTask>
                    </AnimatedItem>
                  ))
                )}
              </View>
            </View>

            {/* SECCIÓN: ACCIONES RÁPIDAS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.icon }]}>ACCESO RÁPIDO</Text>
              <View style={styles.priorityGrid}>
                <AnimatedItem index={0} delay={100}>
                  <PriorityCard
                    icon="star"
                    label="Finales"
                    subtitle="En curso"
                    color={theme.blue}
                    onPress={() => router.push('/finales')}
                    theme={theme}
                    cardColor={cardColor}
                  />
                </AnimatedItem>
                <AnimatedItem index={1} delay={100}>
                  <PriorityCard
                    icon="calendar"
                    label="Parciales"
                    subtitle="Próximos"
                    color={theme.orange}
                    onPress={() => router.push('/parciales')}
                    theme={theme}
                    cardColor={cardColor}
                  />
                </AnimatedItem>
              </View>
            </View>

            {/* SECCIÓN: HERRAMIENTAS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.icon }]}>HERRAMIENTAS</Text>
              <View style={[styles.tableContainer, { backgroundColor: cardColor, borderColor: separatorColor }]}>
                <AnimatedItem index={0} delay={150}>
                  <TableRow
                    icon="book"
                    label="Mis Materias"
                    color={theme.blue}
                    onPress={() => router.push('/mis-materias')}
                    isLast={false}
                    theme={theme}
                  />
                </AnimatedItem>
                <AnimatedItem index={1} delay={150}>
                  <TableRow
                    icon="time"
                    label="Horarios"
                    color={theme.green}
                    onPress={() => router.push('/horarios')}
                    isLast={false}
                    theme={theme}
                  />
                </AnimatedItem>
                <AnimatedItem index={2} delay={150}>
                  <TableRow
                    icon="calculator"
                    label="Simulador de Notas"
                    color={theme.red}
                    onPress={() => router.push('/simulador')}
                    isLast={false}
                    theme={theme}
                  />
                </AnimatedItem>
                <AnimatedItem index={3} delay={150}>
                  <TableRow
                    icon="folder-open"
                    label="Repositorio"
                    color={theme.slate}
                    onPress={() => router.push('/repositorio' as any)}
                    isLast={true}
                    theme={theme}
                  />
                </AnimatedItem>
              </View>
            </View>

            <View style={styles.infoBox} accessibilityLabel="Datos sincronizados correctamente">
              <Ionicons name="checkmark-circle-outline" size={14} color={theme.green} />
              <Text style={[styles.infoText, { color: theme.icon }]}>
                Datos sincronizados correctamente
              </Text>
            </View>
          </>
        )}
      </Animated.ScrollView>

      {/* MODAL / SHEET DE ESTADÍSTICAS */}
      <Modal
        animationType="none" // Controlado por Animated
        transparent={true}
        visible={statsModalVisible}
        onRequestClose={closeStats}
      >
        <TouchableWithoutFeedback onPress={closeStats}>
          <Animated.View style={[styles.modalOverlay, { opacity: statsOverlayOpacity }]}>
            <View style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContent,
            {
              backgroundColor: cardColor,
              transform: [{ translateY: statsSheetAnim }]
            }
          ]}
        >
          {/* Handle Bar */}
          <View style={[styles.modalHandle, { backgroundColor: theme.separator }]} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Estado Académico</Text>
              <Text style={[styles.modalSubtitle, { color: theme.icon }]}>Tu resumen hasta el momento</Text>
            </View>
            <TouchableOpacity onPress={closeStats} style={styles.closeButton}>
              <View style={[styles.closeBtnCircle, { backgroundColor: theme.separator + '30' }]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Resumen Principal (Con Circular Progress SVG) */}
          <View style={styles.statsSummary}>
            <CircularProgress
              percentage={carreraProgreso}
              size={160}
              strokeWidth={12}
              color={theme.tint}
              theme={theme}
              privacyMode={privacyMode}
            />
          </View>

          {/* Desgloze de Estados (Bento Grid) */}
          <View style={styles.statsGrid}>
            <StatItem
              iconName="school"
              number={privacyMode ? "•" : stats.cursando}
              label="Cursando"
              color={theme.blue}
              theme={theme}
              isBig
            />
            <StatItem
              iconName="checkbox"
              number={privacyMode ? "•" : stats.regulares}
              label="Regulares"
              color={theme.orange}
              theme={theme}
              isBig
            />
            <StatItem
              iconName="trophy"
              number={privacyMode ? "•" : stats.aprobadas}
              label="Aprobadas"
              color={theme.green}
              theme={theme}
              isBig
            />
            <StatItem
              iconName="book-outline"
              number={privacyMode ? "•" : stats.noCursadas}
              label="Pendientes"
              color={theme.icon}
              theme={theme}
              isBig
            />
          </View>

          <TouchableOpacity
            style={[styles.fullReportButton, { backgroundColor: theme.tint }]}
            onPress={() => {
              closeStats();
              router.push('/mis-materias');
            }}
          >
            <Text style={styles.fullReportText}>Ver Mis Materias</Text>
            <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* MODAL / SHEET DE PERFIL */}
      <Modal
        animationType="none"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={closeProfile}
      >
        <TouchableWithoutFeedback onPress={closeProfile}>
          <Animated.View style={[styles.modalOverlay, { opacity: profileOverlayOpacity }]}>
            <View style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.profileSheetContent,
            {
              backgroundColor: cardColor,
              transform: [{ translateY: profileSheetAnim }]
            }
          ]}
        >
          {/* Handle Bar */}
          <View style={[styles.modalHandle, { backgroundColor: theme.separator }]} />

          {/* Header del Perfil */}
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatarSection}>
              <View style={[styles.profileAvatarRing, { borderColor: theme.tint }]}>
                <Image
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                  style={styles.profileAvatar}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.text }]}>
                  {user?.user_metadata?.full_name || 'Usuario Invitado'}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.icon }]}>
                  {user?.email || 'Modo sin conexión'}
                </Text>
                {isGuest && (
                  <View style={[styles.guestBadge, { backgroundColor: theme.orange + '20' }]}>
                    <Ionicons name="person-outline" size={12} color={theme.orange} />
                    <Text style={[styles.guestBadgeText, { color: theme.orange }]}>Invitado</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={closeProfile} style={styles.closeButton}>
              <View style={[styles.closeBtnCircle, { backgroundColor: theme.separator + '30' }]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Sección de Configuración */}
          <View style={styles.profileSection}>
            <Text style={[styles.profileSectionTitle, { color: theme.icon }]}>PREFERENCIAS</Text>

            {/* Toggle Modo Oscuro */}
            <View style={[styles.profileOptionRow, { backgroundColor: theme.background }]}>
              <View style={[styles.profileOptionIcon, { backgroundColor: colorScheme === 'dark' ? theme.blue : theme.orange }]}>
                <Ionicons name={colorScheme === 'dark' ? 'moon' : 'sunny'} size={18} color="white" />
              </View>
              <View style={styles.profileOptionContent}>
                <Text style={[styles.profileOptionLabel, { color: theme.text }]}>Modo Oscuro</Text>
                <Text style={[styles.profileOptionHint, { color: theme.icon }]}>
                  {colorScheme === 'dark' ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.separator, true: theme.tint + '60' }}
                thumbColor={darkModeEnabled ? theme.tint : '#f4f3f4'}
                ios_backgroundColor={theme.separator}
              />
            </View>

            {/* Toggle Modo Privado */}
            <View style={[styles.profileOptionRow, { backgroundColor: theme.background, marginTop: 8 }]}>
              <View style={[styles.profileOptionIcon, { backgroundColor: theme.slate }]}>
                <Ionicons name={privacyMode ? 'eye-off' : 'eye'} size={18} color="white" />
              </View>
              <View style={styles.profileOptionContent}>
                <Text style={[styles.profileOptionLabel, { color: theme.text }]}>Modo Privado</Text>
                <Text style={[styles.profileOptionHint, { color: theme.icon }]}>
                  Oculta tu progreso académico
                </Text>
              </View>
              <Switch
                value={privacyMode}
                onValueChange={(val) => {
                  setPrivacyMode(val);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  AsyncStorage.setItem('privacy_mode', String(val));
                }}
                trackColor={{ false: theme.separator, true: theme.tint + '60' }}
                thumbColor={privacyMode ? theme.tint : '#f4f3f4'}
                ios_backgroundColor={theme.separator}
              />
            </View>
          </View>

          {/* Sección de Cuenta */}
          <View style={styles.profileSection}>
            <Text style={[styles.profileSectionTitle, { color: theme.icon }]}>CUENTA</Text>

            {/* Info de Sesión */}
            <TouchableOpacity
              style={[styles.profileOptionRow, { backgroundColor: theme.background }]}
              onPress={() => {
                closeProfile();
                router.push('/mis-materias');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.profileOptionIcon, { backgroundColor: theme.blue }]}>
                <Ionicons name="school" size={18} color="white" />
              </View>
              <View style={styles.profileOptionContent}>
                <Text style={[styles.profileOptionLabel, { color: theme.text }]}>Mis Materias</Text>
                <Text style={[styles.profileOptionHint, { color: theme.icon }]}>
                  {stats.aprobadas} aprobadas de {stats.totalPlan}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.separator} />
            </TouchableOpacity>

            {/* Info de Almacenamiento */}
            <View style={[styles.profileOptionRow, { backgroundColor: theme.background, marginTop: 8 }]}>
              <View style={[styles.profileOptionIcon, { backgroundColor: theme.green }]}>
                <Ionicons name="cloud-done" size={18} color="white" />
              </View>
              <View style={styles.profileOptionContent}>
                <Text style={[styles.profileOptionLabel, { color: theme.text }]}>
                  {isGuest ? 'Datos Locales' : 'Sincronizado'}
                </Text>
                <Text style={[styles.profileOptionHint, { color: theme.icon }]}>
                  {isGuest ? 'Los datos se guardan en tu dispositivo' : 'Conectado con tu cuenta'}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: theme.green }]} />
            </View>
          </View>

          {/* Botón Cerrar Sesión */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.red + '15' }]}
            onPress={() => {
              closeProfile();
              setTimeout(() => handleLogout(), 300);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.red} />
            <Text style={[styles.logoutButtonText, { color: theme.red }]}>
              {isGuest ? 'Salir del Modo Invitado' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>

          {/* Versión */}
          <Text style={[styles.versionText, { color: theme.icon }]}>
            miFACU v1.0.0
          </Text>
        </Animated.View>
      </Modal>
    </View>
  );
}

// --- SVG CIRCULAR PROGRESS ---
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress = ({ percentage, size, strokeWidth, color, theme, privacyMode }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animate progress when percentage changes
  useEffect(() => {
    const target = privacyMode ? 0 : percentage;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [percentage, privacyMode]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.separator + '40'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {/* Centered Text */}
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.statsBigNumber, { color: theme.text }]}>
          {privacyMode ? "•••" : `${Math.round(percentage)}%`}
        </Text>
        <Text style={[styles.statsTotal, { color: theme.icon }]}>Completado</Text>
      </View>
    </View>
  );
};

// --- COMPONENTE ANIMADO PARA TAREAS ---

const PriorityCard = ({ icon, label, subtitle, color, onPress, theme, cardColor }: any) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.priorityCard,
      { backgroundColor: cardColor, transform: [{ scale: pressed ? 0.96 : 1 }] }
    ]}
    accessibilityLabel={`${label}. ${subtitle}`}
    accessibilityRole="button"
    accessibilityHint={`Abre la sección de ${label}`}
  >
    <View style={[styles.priorityIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={22} color="white" />
    </View>
    <Text style={[styles.priorityLabel, { color: theme.text }]}>{label}</Text>
    <Text style={[styles.prioritySubtitle, { color: theme.icon }]}>{subtitle}</Text>
  </Pressable>
);

const TableRow = ({ icon, label, color, onPress, isLast, theme }: any) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.rowWrapper,
      { backgroundColor: pressed ? theme.separator + '20' : 'transparent' }
    ]}
    accessibilityLabel={label}
    accessibilityRole="button"
    accessibilityHint={`Abre ${label}`}
  >
    <View style={[styles.rowContainer, !isLast && { borderBottomColor: theme.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.rowIconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="white" />
      </View>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.separator} />
    </View>
  </Pressable>
);

// StatItem Mejorado para Grid
const StatItem = ({ number, label, color, theme, iconName, isBig }: any) => (
  <View style={[styles.statItem, { backgroundColor: theme.background }]}>
    <View style={[styles.statIconCircle, { backgroundColor: color + '20' }]}>
      <Ionicons name={iconName} size={20} color={color} />
    </View>
    <Text style={[styles.statNumber, { color: theme.text, fontSize: isBig ? 28 : 24 }]}>{number}</Text>
    <Text style={[styles.statLabelItem, { color: theme.icon }]}>{label}</Text>
  </View>
);

// --- COMPONENTE ANIMADO CON STAGGER ---
const AnimatedItem = ({ children, index = 0, delay = 50 }: { children: React.ReactNode; index?: number; delay?: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const staggerDelay = index * delay;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, staggerDelay);

    return () => clearTimeout(timer);
  }, [index, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

// --- SWIPE TO DELETE TASK ---
const SwipeableTask = ({ children, onDelete, theme }: { children: React.ReactNode; onDelete: () => void; theme: any }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.swipeDeleteContainer, { opacity }]}>
        <TouchableOpacity
          style={[styles.swipeDeleteButton, { backgroundColor: theme.red }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            swipeableRef.current?.close();
            onDelete();
          }}
          accessibilityLabel="Eliminar tarea"
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash-outline" size={22} color="white" />
          </Animated.View>
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const onSwipeOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={onSwipeOpen}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
};

// --- COMPONENTE TAREA CON ANIMACIÓN DE ELIMINACIÓN ---
const TaskItem = ({ task, onDelete, theme, separatorColor, isGuest }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(task.nombre || task.titulo);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handleSave = async () => {
    setIsEditing(false);
    if (text.trim() !== task.nombre) {
      try {
        await DataRepository.updateRecordatorio(isGuest, task.id, { nombre: text.trim() });
      } catch (e) { console.error("Error updating task", e); }
    }
  };

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true })
    ]).start(() => {
      onDelete();
    });
  };

  return (
    <Animated.View style={[
      styles.taskItem,
      {
        backgroundColor: theme.backgroundSecondary,
        borderColor: separatorColor,
        opacity,
        transform: [{ scale }]
      }
    ]}>
      <TouchableOpacity
        onPress={handleComplete}
        style={styles.taskCheckbox}
        accessibilityLabel="Marcar tarea como completada"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}
      >
        <View style={[styles.checkboxCircle, { borderColor: theme.tint }]} />
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={[styles.taskInputEdit, { color: theme.text }]}
          value={text}
          onChangeText={setText}
          onBlur={handleSave}
          onSubmitEditing={handleSave}
          autoFocus={true}
          returnKeyType="done"
          accessibilityLabel="Editar nombre de tarea"
        />
      ) : (
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={{ flex: 1 }}
          accessibilityLabel={`Tarea: ${text}. Toca para editar`}
          accessibilityRole="button"
        >
          <Text style={[styles.taskText, { color: theme.text }]}>{text}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // STICKY HEADER INLINE (Aparece al colapsar)
  headerInline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 70,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInlineContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerInlineTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerInlineAvatar: {
    padding: 2,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // LARGE TITLE HEADER (Dentro del scroll)
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  avatarContainer: { borderWidth: 2, padding: 3, borderRadius: 50 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  progressSection: { marginTop: 5 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: 12, fontWeight: '600' },
  progressPercentage: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 38, borderRadius: 10, paddingHorizontal: 5 },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontSize: 16 },
  section: { marginBottom: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },

  // SWIPE TO DELETE
  swipeDeleteContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  swipeDeleteButton: {
    width: 80,
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  swipeDeleteText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  // Estilos Notificación Inline (Card Style)
  inlinePillContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 25,
  },
  nextStepPill: {
    padding: 20,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  pillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
    textTransform: 'uppercase',
  },
  pillMateria: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 15,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  pillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
  },
  pillInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillInfoText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    opacity: 0.9,
  },

  // Quick Tasks Styles
  tasksContainer: {},
  taskInputRow: {
    flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 15,
    backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 12
  },
  taskInput: { flex: 1, fontSize: 16, marginRight: 10, paddingVertical: 8, paddingHorizontal: 5 },
  addTaskButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyTasks: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTasksText: { fontSize: 14, fontWeight: '500', opacity: 0.5 },

  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  taskCheckbox: { marginRight: 15, padding: 2 },
  checkboxCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, opacity: 0.6 },
  taskText: { fontSize: 16, fontWeight: '500' },
  taskInputEdit: { flex: 1, fontSize: 16, fontWeight: '500', padding: 0 },

  priorityGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  priorityCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  priorityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  priorityLabel: { fontSize: 16, fontWeight: '700' },
  prioritySubtitle: { fontSize: 12, marginTop: 2 },
  tableContainer: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  rowWrapper: { width: '100%' },
  rowContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, marginLeft: 55 },
  rowIconBox: { position: 'absolute', left: -40, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '400' },
  infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingBottom: 20 },
  infoText: { fontSize: 11, fontWeight: '500', marginLeft: 6 },

  // Modal Styles Actualizados (Sheet)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20
  },
  modalHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20, opacity: 0.3 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  modalSubtitle: { fontSize: 13, fontWeight: '500', marginTop: 4 },

  closeButton: { padding: 4 },
  closeBtnCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  statsSummary: { alignItems: 'center', marginBottom: 30 },
  percRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 8, alignItems: 'center', justifyContent: 'center',
    borderStyle: 'solid'
  },
  statsBigNumber: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  statsTotal: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  statItem: {
    width: '48%', padding: 16, borderRadius: 20,
    alignItems: 'flex-start', marginBottom: 0,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
  },
  statIconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statNumber: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabelItem: { fontSize: 13, fontWeight: '600' },

  fullReportButton: { flexDirection: 'row', marginTop: 10, padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fullReportText: { color: 'white', fontWeight: '700', fontSize: 16 },

  // Profile Modal Styles
  profileSheetContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 25,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatarRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2.5,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  profileOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  profileOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileOptionContent: {
    flex: 1,
    marginLeft: 14,
  },
  profileOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileOptionHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 16,
    opacity: 0.6,
  },
});
