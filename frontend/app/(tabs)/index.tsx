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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/theme';
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
  cardColor,
  onPress
}: {
  shortcut: typeof AVAILABLE_SHORTCUTS[number];
  theme: ThemeColors;
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
        <View style={[styles.shortcutIconContainer, { backgroundColor: getColor(shortcut.color) }]}>
          <Ionicons name={shortcut.icon as any} size={22} color="white" />
        </View>
        <View style={styles.shortcutContent}>
          <Text style={[styles.shortcutLabel, { color: theme.text }]} numberOfLines={1}>
            {shortcut.label}
          </Text>
          <Text style={[styles.shortcutSubtitle, { color: theme.icon }]} numberOfLines={1}>
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
  const { user, isGuest } = useAuth();
  const { colorScheme, isDark } = useTheme();
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
  const statsOverlayOpacity = useRef(new Animated.Value(0)).current;
  const statsSheetAnim = useRef(new Animated.Value(0)).current;

  // Quick Tasks state
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Animations
  const notification = useNotificationAnimation();
  const scrollY = useRef(new Animated.Value(0)).current;

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
    const tempId = Date.now(); // ID temporal para optimistic update

    // Optimistic update - agregar inmediatamente a la UI
    const optimisticTask = {
      id: tempId,
      nombre: taskText,
      descripcion: 'Tarea Rápida',
      fecha: new Date().toISOString().split('T')[0],
      hora: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
      tipo: 'quick_task',
    };

    setTasks((prev) => [...prev, optimisticTask as any]);
    setNewTask('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Guardar en background
    try {
      setAddingTask(true);
      const created = await DataRepository.createRecordatorio(isGuest, {
        nombre: taskText,
        descripcion: 'Tarea Rápida',
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
  }, [newTask, isGuest, setTasks, addingTask]);

  const handleCompleteTask = useCallback(
    async (id: number) => {
      try {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        await DataRepository.deleteRecordatorio(isGuest, id);
      } catch (error) {
        console.error('Error deleting task:', error);
        loadData();
      }
    },
    [isGuest, setTasks, loadData]
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

  // Get active shortcuts data
  const activeShortcuts = selectedShortcuts
    .map((id) => AVAILABLE_SHORTCUTS.find((s) => s.id === id))
    .filter(Boolean) as typeof AVAILABLE_SHORTCUTS[number][];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* STICKY HEADER WITH BLUR */}
      <Animated.View style={[styles.headerInline, { opacity: headerOpacity }]}>
        <BlurView
          intensity={80}
          tint={colorScheme}
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                <Text style={[styles.headerLabel, { color: theme.icon }]}>MI PANEL</Text>
                <Text style={[styles.headerTitle, { color: textColor }]}>
                  Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'} 👋
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/perfil')}
                style={[styles.avatarContainer, { borderColor: theme.tint + '40' }]}
              >
                <Image
                  source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>

            {/* PROGRESS BAR */}
            <View style={styles.progressSection}>
              <Pressable onPress={openStatsModal}>
                <View style={styles.progressInfo}>
                  <TouchableOpacity
                    style={styles.progressRow}
                    onPress={handlePrivacyToggle}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.progressText, { color: theme.icon }]}>Progreso de Carrera</Text>
                    <Ionicons
                      name={privacyMode ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={theme.icon}
                      style={styles.progressIcon}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.progressPercentage, { color: privacyMode ? theme.icon : theme.tint }]}>
                    {privacyMode ? '•••' : `${carreraProgreso}%`}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.separator + '40' }]}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: privacyMode ? '0%' : `${carreraProgreso}%`,
                        backgroundColor: theme.tint,
                        opacity: privacyMode ? 0 : 1,
                      },
                    ]}
                  />
                  {privacyMode && (
                    <View style={[StyleSheet.absoluteFill, styles.progressPrivacy, { backgroundColor: theme.separator }]} />
                  )}
                </View>
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
                { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push('/horarios')}
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

            {/* QUICK TASKS SECTION - iOS Reminders Style */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.icon }]}>TAREAS RÁPIDAS</Text>
              <View style={[styles.tasksContainer, { backgroundColor: cardColor }]}>
                {/* Task Input - Always visible button */}
                <View style={styles.taskInputRow}>
                  <TextInput
                    placeholder="Nueva tarea..."
                    placeholderTextColor={theme.icon}
                    style={[styles.taskInput, { color: theme.text }]}
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                  <Pressable
                    onPress={handleAddTask}
                    disabled={addingTask || !newTask.trim()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={({ pressed }) => [
                      styles.addTaskButton,
                      {
                        backgroundColor: newTask.trim() ? theme.tint : theme.separator,
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
                            isGuest={isGuest}
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

      {/* EDIT SHORTCUTS MODAL - iOS Settings Style */}
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

              {/* Options List - iOS Settings Style */}
              <View style={[styles.optionsList, { backgroundColor: cardColor }]}>
                {AVAILABLE_SHORTCUTS.map((shortcut, index) => {
                  const isSelected = tempShortcuts.includes(shortcut.id);
                  const getColor = (colorName: string) => theme[colorName as keyof ThemeColors] || theme.tint;

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
                      <View style={[styles.optionIconBox, { backgroundColor: getColor(shortcut.color) }]}>
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
    </View>
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
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  avatarContainer: { borderWidth: 2, padding: 2, borderRadius: 50 },
  avatar: { width: 44, height: 44, borderRadius: 22 },

  // Progress
  progressSection: { marginTop: 5 },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressText: { fontSize: 13, fontWeight: '500' },
  progressIcon: { marginLeft: 6, opacity: 0.8 },
  progressPercentage: { fontSize: 13, fontWeight: '600' },
  progressBarBg: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressPrivacy: { borderRadius: 4, opacity: 0.2 },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  editButton: { paddingVertical: 4, paddingHorizontal: 8 },
  editButtonText: { fontSize: 15, fontWeight: '500' },

  // Notification pill
  inlinePillContainer: { paddingHorizontal: 20, marginBottom: 24 },
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
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

  // Shortcuts - iOS Settings/Table Style
  shortcutsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  shortcutCardWrapper: {},
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  shortcutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutContent: {
    flex: 1,
    marginLeft: 14,
  },
  shortcutLabel: { fontSize: 16, fontWeight: '500' },
  shortcutSubtitle: { fontSize: 13, marginTop: 1 },
  shortcutDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },

  // Tasks - iOS Reminders Style
  tasksContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  taskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  taskInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  addTaskButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
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

  // Options List - iOS Settings Style
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
