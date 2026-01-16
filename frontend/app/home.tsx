import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  useColorScheme,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/constants/theme';
import { useThemeColor } from '../src/hooks/use-theme-color';
import { useAuth } from '../src/context/AuthContext';
import { materiasApi } from '../src/services/api';
import { DataRepository } from '../src/services/dataRepository';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
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

  // Cargar datos reales
  useFocusEffect(
    useCallback(() => {
      loadData();
      checkPrivacyMode();
    }, [user, isGuest])
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
    try {
      setLoading(true);

      let userId = null;

      if (user) {
        userId = user.id;
      }

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER & PROGRESS (Ahora dentro del scroll) */}
        <View style={[styles.header, { borderBottomColor: 'transparent', paddingBottom: 10 }]}>
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
                onPress={handleLogout}
                style={[styles.avatarContainer, { borderColor: theme.tint + '40' }]}
              >
                <Image
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>

            {/* BARRA DE PROGRESO DE CARRERA */}
            <View style={styles.progressSection}>
              <Pressable onPress={openStats}>
                <View style={styles.progressInfo}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={togglePrivacyMode}
                    activeOpacity={0.6}
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
        </View>

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
        {/* BARRA DE BÚSQUEDA (Sticky en iOS) */}


        {/* WIDGET: PRÓXIMO PASO - Eliminado de aquí para ser stationary */}

        {/* SECCIÓN: TAREAS RÁPIDAS (NUEVO) */}
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
              />
              <TouchableOpacity
                onPress={handleAddTask}
                disabled={addingTask || !newTask.trim()}
                style={[styles.addTaskButton, { backgroundColor: newTask.trim() ? theme.tint : theme.separator }]}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Ionicons name="create-outline" size={24} color={theme.separator} style={{ marginBottom: 5 }} />
                <Text style={[styles.emptyTasksText, { color: theme.icon }]}>No hay tareas pendientes</Text>
              </View>
            ) : (
              tasks.map((task: any) => (
                <DeletableTask
                  key={task.id}
                  onComplete={() => handleCompleteTask(task.id)}
                  theme={theme}
                >
                  <TaskItem
                    task={task}
                    theme={theme}
                    separatorColor={separatorColor}
                    isGuest={isGuest}
                  />
                </DeletableTask>
              ))
            )}
          </View>
        </View>

        {/* SECCIÓN: ACCIONES RÁPIDAS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>ACCESO RÁPIDO</Text>
          <View style={styles.priorityGrid}>
            <PriorityCard
              icon="star"
              label="Finales"
              subtitle="En curso"
              color={theme.blue}
              onPress={() => router.push('/finales')}
              theme={theme}
              cardColor={cardColor}
            />
            <PriorityCard
              icon="calendar"
              label="Parciales"
              subtitle="Próximos"
              color={theme.orange}
              onPress={() => router.push('/parciales')}
              theme={theme}
              cardColor={cardColor}
            />
          </View>
        </View>

        {/* SECCIÓN: HERRAMIENTAS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>HERRAMIENTAS</Text>
          <View style={[styles.tableContainer, { backgroundColor: cardColor, borderColor: separatorColor }]}>
            <TableRow
              icon="book"
              label="Mis Materias"
              color={theme.blue}
              onPress={() => router.push('/mis-materias')}
              isLast={false}
              theme={theme}
            />
            <TableRow
              icon="time"
              label="Horarios"
              color={theme.green}
              onPress={() => router.push('/horarios')}
              isLast={false}
              theme={theme}
            />
            <TableRow
              icon="calculator"
              label="Simulador de Notas"
              color={theme.red}
              onPress={() => router.push('/simulador')}
              isLast={false}
              theme={theme}
            />
            <TableRow
              icon="folder-open"
              label="Repositorio"
              color={theme.slate}
              onPress={() => router.push('/repositorio' as any)}
              isLast={true}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.green} />
          <Text style={[styles.infoText, { color: theme.icon }]}>
            Datos sincronizados correctamente
          </Text>
        </View>
      </ScrollView>

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

// --- COMPONENTE ANIMADO PARA TAREAS ---
const DeletableTask = ({ children, onComplete, theme }: any) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Partículas más pequeñas para tareas
  const particles = useRef([...Array(8)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random()),
    dx: (Math.random() - 0.5) * 100,
    dy: (Math.random() - 0.5) * 100,
  }))).current;

  const triggerDelete = () => {
    setIsDeleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const cardAnim = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.95, duration: 300, useNativeDriver: true })
    ]);

    const particleAnims = particles.map(p => {
      p.opacity.setValue(0.6);
      return Animated.parallel([
        Animated.timing(p.x, { toValue: p.dx, duration: 500, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: p.dy, duration: 500, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true })
      ]);
    });

    Animated.parallel([
      cardAnim,
      Animated.stagger(30, particleAnims)
    ]).start(() => {
      onComplete();
    });
  };

  // Inyectar trigger al hijo
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { onDeleteTrigger: triggerDelete });
    }
    return child;
  });

  return (
    <View style={{ marginBottom: 10, zIndex: isDeleting ? 99 : 1 }}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        {childrenWithProps}
      </Animated.View>
      {isDeleting && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', left: '10%', top: '50%',
            width: 4, height: 4, borderRadius: 2,
            backgroundColor: theme.text, opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }]
          }}
        />
      ))}
    </View>
  );
};

const TaskItem = ({ task, onDeleteTrigger, theme, separatorColor, isGuest }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(task.nombre || task.titulo);

  const handleSave = async () => {
    setIsEditing(false);
    if (text.trim() !== task.nombre) {
      try {
        await DataRepository.updateRecordatorio(isGuest, task.id, { nombre: text.trim() });
      } catch (e) { console.error("Error updating task", e); }
    }
  };

  return (
    <View style={[styles.taskItem, { backgroundColor: theme.backgroundSecondary, borderColor: separatorColor }]}>
      <TouchableOpacity onPress={onDeleteTrigger} style={styles.taskCheckbox}>
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
        />
      ) : (
        <TouchableOpacity onPress={() => setIsEditing(true)} style={{ flex: 1 }}>
          <Text style={[styles.taskText, { color: theme.text }]}>{text}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  section: { marginBottom: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },

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
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 16, borderWidth: 1, marginBottom: 0
  },
  taskCheckbox: { marginRight: 15, padding: 2 },
  checkboxCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, opacity: 0.6 },
  taskText: { fontSize: 16, fontWeight: '500' },
  taskInputEdit: { flex: 1, fontSize: 16, fontWeight: '500', padding: 0 },

  priorityGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  priorityCard: { flex: 1, marginHorizontal: 5, padding: 16, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  priorityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  priorityLabel: { fontSize: 16, fontWeight: '700' },
  prioritySubtitle: { fontSize: 12, marginTop: 2 },
  tableContainer: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
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
});
