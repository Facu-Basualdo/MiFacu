import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Keyboard,
  Platform,
  RefreshControl,
  Animated,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/config/supabase';
import { Colors, mifacuNavy, mifacuGold } from '../../src/constants/theme';
import { useThemeColor } from '../../src/hooks/use-theme-color';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { DataRepository } from '../../src/services/dataRepository';
import { HomeSkeleton } from '../../src/components/Skeleton';

// Hooks
import { useHomeData } from '../../src/hooks/useHomeData';
import { useNotificationAnimation } from '../../src/hooks/useSheetAnimation';

// Components
import {
  AnimatedItem,
  SwipeableTask,
  TaskItem,
  StatsModal,
  CarreraModal,
} from '../../src/components/home';

// Types
import type { ThemeColors } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QUICK_ACCESS_KEY = '@mifacu_quick_access';

// Available quick access options with SF Symbol-like icons
const AVAILABLE_SHORTCUTS = [
  { id: 'finales', icon: 'ribbon', label: 'Finales', subtitle: 'Exámenes finales', color: 'blue', route: '/finales' },
  { id: 'parciales', icon: 'document-text', label: 'Parciales', subtitle: 'Próximos exámenes', color: 'orange', route: '/parciales' },
  { id: 'simulador', icon: 'analytics', label: 'Simulador', subtitle: 'Planifica tu carrera', color: 'red', route: '/simulador' },
  { id: 'horarios', icon: 'calendar', label: 'Horarios', subtitle: 'Ver clases', color: 'green', route: '/horarios' },
  { id: 'repositorio', icon: 'folder', label: 'Repositorio', subtitle: 'Links y recursos', color: 'slate', route: '/repositorio' },
] as const;

type ShortcutId = typeof AVAILABLE_SHORTCUTS[number]['id'];

const DEFAULT_SHORTCUTS: ShortcutId[] = ['finales', 'parciales', 'simulador', 'horarios'];

// Shortcut Card Component - iOS Widget Style
const ShortcutCard = React.memo(({
  shortcut,
  theme,
  isDarkMode,
  cardColor,
  onPress
}: {
  shortcut: typeof AVAILABLE_SHORTCUTS[number];
  theme: ThemeColors;
  isDarkMode: boolean;
  cardColor: string;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getColor = (colorName: string) => {
    return theme[colorName as keyof ThemeColors] || theme.tint;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.shortcutCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.shortcutCard, { backgroundColor: cardColor }]}
      >
        <View style={[styles.shortcutIconContainer, { backgroundColor: isDarkMode ? getColor(shortcut.color) : mifacuNavy }]}>
          <Ionicons name={shortcut.icon as any} size={22} color={isDarkMode ? "white" : mifacuGold} />
        </View>
        <View style={styles.shortcutContent}>
          <Text style={[styles.shortcutLabel, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
            {shortcut.label}
          </Text>
          <Text style={[styles.shortcutSubtitle, { color: theme.icon, fontSize: 12 }]} numberOfLines={1}>
            {shortcut.subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.separator} />
      </Pressable>
    </Animated.View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme, isDark: isDarkMode } = useTheme();
  const theme = Colors[colorScheme] as ThemeColors;

  // Data hook
  const {
    loading,
    refreshing,
    tasks,
    stats,
    carreraProgreso,
    proximaClase,
    privacyMode,
    onRefresh,
    togglePrivacyMode,
    setTasks,
    loadData,
  } = useHomeData();

  // Quick access state
  const [selectedShortcuts, setSelectedShortcuts] = useState<ShortcutId[]>(DEFAULT_SHORTCUTS);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempShortcuts, setTempShortcuts] = useState<ShortcutId[]>([]);

  // Stats modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCarreraModal, setShowCarreraModal] = useState(false);
  const statsOverlayOpacity = useRef(new Animated.Value(0)).current;
  const statsSheetAnim = useRef(new Animated.Value(0)).current;

  // Quick Tasks state
  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Animations
  const notification = useNotificationAnimation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const taskInputRef = useRef<TextInput>(null);

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Dynamic colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'backgroundSecondary');
  const separatorColor = useThemeColor({}, 'separator');

  const hour = new Date().getHours();
  const currentGreeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Hola' : 'Buenas noches';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Estudiante';
  const userCarrera = user?.user_metadata?.carrera;

  // Onboarding: Si no hay carrera, mostrar modal
  useEffect(() => {
    if (user && !userCarrera && !loading) {
      setTimeout(() => setShowCarreraModal(true), 1500); // Pequeño delay para dejar cargar el dashboard
    }
  }, [user, userCarrera, loading]);

  // Load shortcuts from storage
  useEffect(() => {
    const loadShortcuts = async () => {
      try {
        const saved = await AsyncStorage.getItem(QUICK_ACCESS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ShortcutId[];
          setSelectedShortcuts(parsed);
        }
      } catch (error) {
        console.error('Error loading shortcuts:', error);
      }
    };
    loadShortcuts();
  }, []);

  // Show notification when data loads
  useEffect(() => {
    if (!loading && proximaClase) {
      notification.show();
    }
  }, [loading, proximaClase]);

  // Stats modal handlers
  const openStatsModal = useCallback(() => {
    setShowStatsModal(true);
    Animated.parallel([
      Animated.timing(statsOverlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(statsSheetAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const closeStatsModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(statsOverlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(statsSheetAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setShowStatsModal(false));
  }, []);

  const handlePrivacyToggle = useCallback(async () => {
    await togglePrivacyMode();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [togglePrivacyMode]);

  const handleAddTask = useCallback(async () => {
    if (!newTask.trim() || addingTask) return;

    const taskText = newTask.trim();
    const taskDescription = newTaskDescription.trim() || undefined;
    const tempId = Date.now(); // ID temporal para optimistic update

    // Optimistic update - agregar inmediatamente a la UI
    const optimisticTask = {
      id: tempId,
      nombre: taskText,
      descripcion: taskDescription,
      fecha: new Date().toISOString().split('T')[0],
      hora: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
      tipo: 'quick_task',
    };

    setTasks((prev) => [...prev, optimisticTask as any]);
    setNewTask('');
    setNewTaskDescription('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Guardar en background
    try {
      setAddingTask(true);
      const created = await DataRepository.createRecordatorio(false, {
        nombre: taskText,
        descripcion: taskDescription,
        fecha: optimisticTask.fecha,
        hora: optimisticTask.hora,
        tipo: 'quick_task',
      });

      // Reemplazar el optimistic con el real
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch (error) {
      console.error('Error creando tarea:', error);
      // Rollback - remover la tarea optimistic
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      Alert.alert('Error', 'No se pudo agregar la tarea');
    } finally {
      setAddingTask(false);
    }
  }, [newTask, newTaskDescription, setTasks, addingTask]);

  const handleCompleteTask = useCallback(
    async (id: number) => {
      try {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        await DataRepository.deleteRecordatorio(id);
      } catch (error) {
        console.error('Error deleting task:', error);
        loadData();
      }
    },
    [setTasks, loadData]
  );

  // Quick access handlers
  const openEditModal = useCallback(() => {
    setTempShortcuts([...selectedShortcuts]);
    setShowEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedShortcuts]);

  const toggleShortcut = useCallback((id: ShortcutId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempShortcuts((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return prev;
        }
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const saveShortcuts = useCallback(async () => {
    try {
      await AsyncStorage.setItem(QUICK_ACCESS_KEY, JSON.stringify(tempShortcuts));
      setSelectedShortcuts(tempShortcuts);
      setShowEditModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving shortcuts:', error);
      Alert.alert('Error', 'No se pudieron guardar los accesos');
    }
  }, [tempShortcuts]);

  const handleSelectCarrera = useCallback(async (carreraId: string, carreraNombre: string) => {
    try {
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'No se encontró sesión activa');
        return;
      }

      // 1. Update in our DB (critical for filtering materias)
      await DataRepository.updateCareer(userId, carreraId);

      // 2. Update in Supabase Metadata (for UI display)
      const { error } = await supabase.auth.updateUser({
        data: { carrera: carreraNombre, carreraId: carreraId }
      });
      if (error) throw error;

      setShowCarreraModal(false);
      loadData(); // Re-fetch to update progress card
    } catch (error) {
      console.error('Error selecting carrera:', error);
      Alert.alert('Error', 'No se pudo guardar la carrera');
    }
  }, [user, loadData]);

  // Get active shortcuts data
  const activeShortcuts = selectedShortcuts
    .map((id) => AVAILABLE_SHORTCUTS.find((s) => s.id === id))
    .filter(Boolean) as typeof AVAILABLE_SHORTCUTS[number][];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* STICKY HEADER WITH BLUR */}
      <Animated.View style={[styles.headerInline, { opacity: headerOpacity }]}>
        <BlurView
          intensity={80}
          tint={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.headerBorder, { borderBottomColor: theme.separator }]} />
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerInlineContent}>
            <Text style={[styles.headerInlineTitle, { color: textColor }]}>Inicio</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/perfil')}
              style={styles.headerInlineAvatar}
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
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.tint}
            colors={[theme.tint]}
          />
        }
      >
        {/* LARGE TITLE HEADER */}
        <Animated.View style={[styles.header, { opacity: largeTitleOpacity }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.headerLabel, { color: theme.icon, letterSpacing: 1.5, fontSize: 11, fontWeight: '700' }]}>DASHBOARD DE ESTUDIANTE</Text>
                <Text style={[styles.headerTitle, { color: textColor, fontWeight: '900' }]}>
                  {currentGreeting}, {userName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/perfil')}
                activeOpacity={0.8}
                style={[
                  styles.headerAvatarContainer,
                  {
                    borderColor: isDarkMode ? theme.separator : mifacuGold,
                    borderWidth: 2,
                    padding: 2,
                    borderRadius: 24
                  }
                ]}
              >
                <Image
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                  style={styles.avatarLarge}
                />
              </TouchableOpacity>
            </View>

            {/* PROGRESS CARD - Mockup Style */}
            <View style={[styles.progressCard, { backgroundColor: cardColor }]}>
              <Pressable onPress={openStatsModal} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
                <View style={[styles.progressSectionLabelContainer, { backgroundColor: isDarkMode ? theme.separator : mifacuNavy }]}>
                  <Text style={[styles.progressSectionLabel, { color: 'white' }]}>CARRERA</Text>
                </View>
                <View style={styles.progressContent}>
                  <View style={styles.progressInfo}>
                    <Text style={[styles.progressSubtitle, { color: theme.icon }]} numberOfLines={1}>
                      {user?.user_metadata?.carrera || 'Lic. en Administración'}
                    </Text>
                    <Text style={[styles.progressPercentage, { color: isDarkMode ? theme.tint : mifacuNavy, fontWeight: '800' }]}>
                      {privacyMode ? '•••' : `${carreraProgreso}% Completo`}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? theme.separator + '40' : '#E2E8F0' }]}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: privacyMode ? '0%' : `${carreraProgreso}%`,
                          backgroundColor: isDarkMode ? theme.tint : mifacuGold,
                          opacity: privacyMode ? 0 : 1,
                        },
                      ]}
                    />
                  </View>
                </View>
                {privacyMode && (
                  <View style={[StyleSheet.absoluteFill, styles.progressPrivacy, { backgroundColor: theme.separator }]} />
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* NEXT CLASS NOTIFICATION */}
        {!loading && proximaClase && (
          <Animated.View
            style={[
              styles.inlinePillContainer,
              {
                opacity: notification.opacity,
                transform: [{ translateY: notification.translateY }],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.nextStepPill,
                {
                  backgroundColor: isDarkMode ? theme.tint : mifacuNavy,
                  opacity: pressed ? 0.9 : 1,
                  borderWidth: isDarkMode ? 0 : 1,
                  borderColor: mifacuGold + '30'
                },
              ]}
              onPress={() => router.push('/horarios')}
            >
              <View style={styles.pillHeader}>
                <View style={[styles.pillBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : mifacuGold }]}>
                  <Ionicons name="notifications" size={14} color="white" />
                  <Text style={styles.pillBadgeText}>{proximaClase.tipo}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </View>
              <Text style={[styles.pillMateria, { color: 'white', fontWeight: '800' }]}>{proximaClase.materia}</Text>
              <View style={styles.pillFooter}>
                <View style={styles.pillInfoItem}>
                  <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.pillInfoText}>{proximaClase.hora}</Text>
                </View>
                {proximaClase.aula && proximaClase.aula !== '-' && (
                  <View style={[styles.pillInfoItem, styles.pillInfoItemSpaced]}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.pillInfoText}>{proximaClase.aula}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* SKELETON LOADING OR CONTENT */}
        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* QUICK ACCESS SECTION - iOS Widget Style */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>ACCESO RÁPIDO</Text>
                <TouchableOpacity onPress={openEditModal} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={[styles.editButtonText, { color: theme.tint }]}>Editar</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.shortcutsContainer, { backgroundColor: cardColor }]}>
                {activeShortcuts.map((shortcut, index) => (
                  <React.Fragment key={shortcut.id}>
                    <ShortcutCard
                      shortcut={shortcut}
                      theme={theme}
                      isDarkMode={isDarkMode}
                      cardColor={cardColor}
                      onPress={() => router.push(shortcut.route as any)}
                    />
                    {index < activeShortcuts.length - 1 && (
                      <View style={[styles.shortcutDivider, { backgroundColor: theme.separator }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* QUICK TASKS SECTION - Mockup Style */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? theme.text : mifacuNavy }]}>TAREAS RÁPIDAS</Text>
              </View>
              <View style={[styles.tasksContainer, { backgroundColor: cardColor, borderWidth: isDarkMode ? 0 : 1, borderColor: '#E2E8F0' }]}>
                {/* Task Input */}
                <View style={[styles.taskInputRow, { backgroundColor: isDarkMode ? 'transparent' : '#F8FAFC' }]}>
                  <View style={styles.taskInputFields}>
                    <TextInput
                      ref={taskInputRef}
                      placeholder="Nueva tarea..."
                      placeholderTextColor={theme.icon}
                      style={[styles.taskInput, { color: theme.text }]}
                      value={newTask}
                      onChangeText={setNewTask}
                      onFocus={() => {
                        // Scroll suave para que el input sea visible
                        setTimeout(() => {
                          (scrollViewRef.current as any)?.scrollTo?.({ y: 400, animated: true });
                        }, 150);
                      }}
                      onSubmitEditing={() => {
                        if (newTask.trim() && !newTaskDescription) {
                          handleAddTask();
                        }
                      }}
                      returnKeyType={newTaskDescription ? 'next' : 'done'}
                      blurOnSubmit={false}
                    />
                    {newTask.trim().length > 0 && (
                      <TextInput
                        placeholder="Descripción (opcional)"
                        placeholderTextColor={theme.separator}
                        style={[styles.taskDescriptionInput, { color: theme.icon }]}
                        value={newTaskDescription}
                        onChangeText={setNewTaskDescription}
                        onSubmitEditing={handleAddTask}
                        returnKeyType="done"
                        blurOnSubmit={false}
                      />
                    )}
                  </View>
                  <Pressable
                    onPress={handleAddTask}
                    disabled={addingTask || !newTask.trim()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={({ pressed }) => [
                      styles.addTaskButton,
                      {
                        backgroundColor: newTask.trim() ? (isDarkMode ? theme.tint : mifacuNavy) : theme.separator,
                        opacity: pressed && newTask.trim() ? 0.7 : 1,
                        transform: [{ scale: pressed && newTask.trim() ? 0.9 : 1 }],
                      },
                    ]}
                  >
                    <Ionicons name="arrow-up" size={16} color="white" />
                  </Pressable>
                </View>

                {/* Divider */}
                {tasks.length > 0 && (
                  <View style={[styles.tasksDivider, { backgroundColor: separatorColor }]} />
                )}

                {/* Tasks List */}
                {tasks.length === 0 ? (
                  <View style={styles.emptyTasks}>
                    <Ionicons name="checkmark-circle-outline" size={32} color={theme.separator} />
                    <Text style={[styles.emptyTasksText, { color: theme.icon }]}>Sin tareas pendientes</Text>
                    <Text style={[styles.emptyTasksHint, { color: theme.separator }]}>Escribe arriba para agregar</Text>
                  </View>
                ) : (
                  tasks.map((task, index) => (
                    <AnimatedItem key={task.id} index={index} delay={40}>
                      <View style={[
                        styles.taskItemWrapper,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: separatorColor }
                      ]}>
                        <SwipeableTask onDelete={() => handleCompleteTask(task.id)} theme={theme}>
                          <TaskItem
                            task={task}
                            onDelete={() => handleCompleteTask(task.id)}
                            theme={theme}
                            separatorColor={separatorColor}
                          />
                        </SwipeableTask>
                      </View>
                    </AnimatedItem>
                  ))
                )}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="checkmark-circle" size={14} color={theme.green} />
              <Text style={[styles.infoText, { color: theme.icon }]}>Sincronizado</Text>
            </View>
          </>
        )}
      </Animated.ScrollView>

      {/* STATS MODAL */}
      <StatsModal
        visible={showStatsModal}
        onClose={closeStatsModal}
        overlayOpacity={statsOverlayOpacity}
        sheetAnim={statsSheetAnim}
        theme={theme}
        cardColor={cardColor}
        carreraProgreso={carreraProgreso}
        stats={stats}
        privacyMode={privacyMode}
        onNavigateToMaterias={() => {
          closeStatsModal();
          setTimeout(() => router.push('/(tabs)/materias'), 300);
        }}
      />

      {/* CARRERA MODAL (Onboarding) */}
      <CarreraModal
        visible={showCarreraModal}
        onClose={() => setShowCarreraModal(false)}
        onSelect={handleSelectCarrera}
        theme={theme}
        isDarkMode={isDarkMode}
      />

      {/* EDIT SHORTCUTS MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <SafeAreaView edges={['top']} style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: separatorColor }]}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.modalCancel, { color: theme.tint }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: textColor }]}>Accesos Rápidos</Text>
              <TouchableOpacity onPress={saveShortcuts} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.modalSave, { color: theme.tint }]}>Listo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalDescription, { color: theme.icon }]}>
                Selecciona los accesos que quieres ver en tu inicio. Puedes elegir entre 2 y 5.
              </Text>

              {/* Options List */}
              <View style={[styles.optionsList, { backgroundColor: cardColor }]}>
                {AVAILABLE_SHORTCUTS.map((shortcut, index) => {
                  const isSelected = tempShortcuts.includes(shortcut.id);
                  const getOptColor = (colorName: string) => theme[colorName as keyof ThemeColors] || theme.tint;

                  return (
                    <TouchableOpacity
                      key={shortcut.id}
                      onPress={() => toggleShortcut(shortcut.id)}
                      activeOpacity={0.6}
                      style={[
                        styles.optionRow,
                        index < AVAILABLE_SHORTCUTS.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: separatorColor,
                        },
                      ]}
                    >
                      <View style={[styles.optionIconBox, { backgroundColor: getOptColor(shortcut.color) }]}>
                        <Ionicons name={shortcut.icon as any} size={18} color="white" />
                      </View>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionLabel, { color: theme.text }]}>{shortcut.label}</Text>
                        <Text style={[styles.optionSubtitle, { color: theme.icon }]}>{shortcut.subtitle}</Text>
                      </View>
                      <View style={[
                        styles.optionCheckbox,
                        isSelected
                          ? { backgroundColor: theme.tint }
                          : { borderWidth: 2, borderColor: theme.separator }
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalFooterText, { color: theme.icon }]}>
                {tempShortcuts.length} de 5 seleccionados
              </Text>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Sticky header
  headerInline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 70,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSafeArea: { flex: 1 },
  headerInlineContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerInlineTitle: { fontSize: 17, fontWeight: '600' },
  headerInlineAvatar: { padding: 2 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16 },

  // Large title header
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerAvatarContainer: { borderWidth: 2, padding: 2, borderRadius: 50 },
  avatarLarge: { width: 44, height: 44, borderRadius: 22 },

  // Progress Card - Mockup Style
  progressCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  progressSectionLabelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  progressSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  progressContent: {
    padding: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPrivacy: { borderRadius: 20, opacity: 0.2 },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  section: { marginBottom: 28, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  editButton: { paddingVertical: 4, paddingHorizontal: 8 },
  editButtonText: { fontSize: 15, fontWeight: '500' },

  // Notification pill
  inlinePillContainer: { paddingHorizontal: 20, marginBottom: 24, marginTop: 4 },
  nextStepPill: {
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
    textTransform: 'uppercase',
  },
  pillMateria: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  pillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
  },
  pillInfoItem: { flexDirection: 'row', alignItems: 'center' },
  pillInfoItemSpaced: { marginLeft: 16 },
  pillInfoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    opacity: 0.9,
  },

  // Shortcuts
  shortcutsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shortcutCardWrapper: {},
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  shortcutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutContent: {
    flex: 1,
    marginLeft: 14,
  },
  shortcutLabel: { fontSize: 16, fontWeight: '600' },
  shortcutSubtitle: { fontSize: 13, marginTop: 1 },
  shortcutDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
  },

  // Tasks
  tasksContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  taskInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  taskInputFields: {
    flex: 1,
  },
  taskInput: {
    fontSize: 17,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  taskDescriptionInput: {
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginTop: 2,
  },
  addTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  taskItemWrapper: {},
  emptyTasks: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTasksText: { fontSize: 16, fontWeight: '500' },
  emptyTasksHint: { fontSize: 13 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  infoText: { fontSize: 13, fontWeight: '500' },

  // Modal
  modalContainer: { flex: 1 },
  modalSafeArea: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: { fontSize: 17 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 17, fontWeight: '600' },
  modalContent: { flex: 1, paddingTop: 20 },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
    lineHeight: 20,
  },

  optionsList: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  optionLabel: { fontSize: 16, fontWeight: '500' },
  optionSubtitle: { fontSize: 13, marginTop: 1 },
  optionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalFooterText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
});
