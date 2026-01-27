import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
  ScrollView,
  RefreshControl,
  Pressable,
  FlatList,
  Keyboard,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/theme';
import { DataRepository } from '../src/services/dataRepository';
import { useAuth } from '../src/context/AuthContext';
import { materiasApi } from '../src/services/api';

const { width, height } = Dimensions.get('window');

// Colores predefinidos para los links
const LINK_COLORS = [
  '#007AFF', // Blue
  '#FF9500', // Orange
  '#34C759', // Green
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#5856D6', // Indigo
  '#00C7BE', // Teal
];

interface LinkItem {
  id: number;
  nombre: string;
  materia: string;
  url: string;
  color: string;
}

export default function RepositorioScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { isGuest, user } = useAuth();

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState(LINK_COLORS[0]);

  // Estado para materias disponibles y picker
  const [materiasDisponibles, setMateriasDisponibles] = useState<string[]>([]);
  const [showMateriaPicker, setShowMateriaPicker] = useState(false);
  const [materiaSearch, setMateriaSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DataRepository.getLinks(isGuest);
      setLinks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterias = async () => {
    try {
      if (!isGuest && user?.id) {
        const usuarioMaterias = await materiasApi.getMateriasByUsuario(user.id);
        // La respuesta tiene estructura: { materia: { nombre: "..." }, estado: "..." }
        const nombres: string[] = usuarioMaterias
          .map((um: any) => um.materia?.nombre as string)
          .filter((n: string | undefined): n is string => Boolean(n))
          .sort((a: string, b: string) => a.localeCompare(b));
        setMateriasDisponibles(nombres);
      } else if (isGuest) {
        // Para guests, obtener materias de los links locales existentes
        const localLinks = await DataRepository.getLinks(true);
        const materiasSet = new Set<string>(localLinks.map((l: any) => l.materia as string).filter(Boolean));
        setMateriasDisponibles([...materiasSet].sort());
      }
    } catch (e) {
      console.error('Error cargando materias:', e);
      // Si falla, al menos mostrar las materias de los links existentes
      try {
        const existingLinks = await DataRepository.getLinks(isGuest);
        const materiasSet = new Set<string>(existingLinks.map((l: any) => l.materia as string).filter(Boolean));
        setMateriasDisponibles([...materiasSet].sort());
      } catch {}
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('light');
    await loadData();
    setRefreshing(false);
  }, [isGuest]);

  React.useEffect(() => {
    loadData();
    loadMaterias();
  }, [isGuest, user]);

  // Animated values for Modal
  const modalSheetAnim = useRef(new Animated.Value(height)).current;
  const modalBackdropAnim = useRef(new Animated.Value(0)).current;

  // Form states
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [nuevaUrl, setNuevaUrl] = useState('');

  // Standard Animated API Values
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

  // Agrupar links por materia
  const groupedLinks = useMemo(() => {
    const filtered = searchQuery
      ? links.filter(l =>
          l.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.materia.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : links;

    const groups: { [key: string]: LinkItem[] } = {};
    filtered.forEach(link => {
      const materia = link.materia || 'GENERAL';
      if (!groups[materia]) groups[materia] = [];
      groups[materia].push(link);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [links, searchQuery]);

  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const abrirEnlace = async (url: string) => {
    triggerHaptic('light');
    try {
      const urlLimpia = url.trim();
      const puedeAbrir = await Linking.canOpenURL(urlLimpia);
      if (puedeAbrir) {
        await Linking.openURL(urlLimpia);
      } else {
        Alert.alert("URL Inválida", "Asegúrate de que el link empiece con https://");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir el enlace.");
    }
  };

  const abrirModalParaCrear = () => {
    triggerHaptic('medium');
    setEditandoId(null);
    setNuevoNombre('');
    setNuevaMateria('');
    setNuevaUrl('');
    setSelectedColor(LINK_COLORS[Math.floor(Math.random() * LINK_COLORS.length)]);

    setModalVisible(true);

    Animated.parallel([
      Animated.timing(modalBackdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalSheetAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const abrirModalParaEditar = (item: LinkItem) => {
    triggerHaptic('medium');
    setEditandoId(item.id);
    setNuevoNombre(item.nombre);
    setNuevaMateria(item.materia);
    setNuevaUrl(item.url);
    setSelectedColor(item.color || LINK_COLORS[0]);

    setModalVisible(true);

    Animated.parallel([
      Animated.timing(modalBackdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalSheetAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cerrarModal = () => {
    Animated.parallel([
      Animated.timing(modalBackdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalSheetAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setShowMateriaPicker(false);
    });
  };

  const handleGuardar = async () => {
    if (!nuevoNombre || !nuevaUrl) {
      triggerHaptic('warning');
      return Alert.alert("Faltan datos", "El nombre y la URL son obligatorios.");
    }

    let urlFinal = nuevaUrl.trim();
    if (!urlFinal.startsWith('http')) {
      urlFinal = 'https://' + urlFinal;
    }

    try {
      if (editandoId) {
        await DataRepository.updateLink(isGuest, editandoId, {
          nombre: nuevoNombre,
          materia: nuevaMateria.toUpperCase() || "GENERAL",
          url: urlFinal,
          color: selectedColor
        });
        triggerHaptic('success');
      } else {
        await DataRepository.createLink(isGuest, {
          nombre: nuevoNombre,
          materia: nuevaMateria.toUpperCase() || "GENERAL",
          url: urlFinal,
          color: selectedColor
        });
        triggerHaptic('success');
      }
      loadData();
      cerrarModal();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el link.");
    }
  };

  const eliminarLink = (id: number, nombre: string) => {
    triggerHaptic('warning');
    Alert.alert(
      "Eliminar acceso directo",
      `¿Estás seguro de que quieres eliminar "${nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await DataRepository.deleteLink(isGuest, id);
              loadData();
              triggerHaptic('success');
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el link.");
            }
          }
        }
      ]
    );
  };

  const getIconForUrl = (url: string): keyof typeof Ionicons.glyphMap => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('drive.google') || urlLower.includes('docs.google')) return 'logo-google';
    if (urlLower.includes('github')) return 'logo-github';
    if (urlLower.includes('youtube')) return 'logo-youtube';
    if (urlLower.includes('notion')) return 'document-text';
    if (urlLower.includes('slack')) return 'chatbubbles';
    if (urlLower.includes('discord')) return 'logo-discord';
    if (urlLower.includes('zoom')) return 'videocam';
    if (urlLower.includes('meet.google')) return 'videocam';
    if (urlLower.includes('classroom')) return 'school';
    if (urlLower.includes('moodle') || urlLower.includes('campus')) return 'school';
    if (urlLower.includes('pdf')) return 'document';
    return 'link';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} />

      {/* STICKY HEADER con Blur */}
      <Animated.View style={[styles.headerInline, { opacity: headerOpacity }]}>
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.headerInlineContent, { borderBottomColor: theme.separator }]}>
          <TouchableOpacity onPress={() => { triggerHaptic(); router.back(); }} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.blue} />
          </TouchableOpacity>
          <Text style={[styles.headerInlineTitle, { color: theme.text }]}>Repositorio</Text>
          <TouchableOpacity onPress={abrirModalParaCrear} style={styles.headerBtn}>
            <Ionicons name="add-circle" size={28} color={theme.blue} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.blue}
            />
          }
        >
          {/* LARGE TITLE HEADER */}
          <View style={styles.headerLarge}>
            <Animated.View style={[styles.headerTopRow, { opacity: headerLargeOpacity }]}>
              <TouchableOpacity onPress={() => { triggerHaptic(); router.back(); }} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={28} color={theme.blue} />
                <Text style={[styles.backText, { color: theme.blue }]}>Inicio</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={abrirModalParaCrear} style={styles.addBtn}>
                <Ionicons name="add-circle-outline" size={32} color={theme.blue} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.Text style={[styles.headerLargeTitle, { color: theme.text, opacity: headerLargeOpacity }]}>
              Repositorio
            </Animated.Text>
          </View>

          {/* SEARCH BAR */}
          <View style={[styles.searchBarWrapper, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="search" size={18} color={theme.icon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar enlaces..."
              placeholderTextColor={theme.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && Platform.OS === 'android' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats rápidas */}
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: theme.blue + '15' }]}>
              <Ionicons name="link" size={16} color={theme.blue} />
              <Text style={[styles.statText, { color: theme.blue }]}>{links.length} enlaces</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: theme.green + '15' }]}>
              <Ionicons name="folder" size={16} color={theme.green} />
              <Text style={[styles.statText, { color: theme.green }]}>{groupedLinks.length} materias</Text>
            </View>
          </View>

          {/* LINKS AGRUPADOS POR MATERIA */}
          {groupedLinks.length > 0 ? (
            groupedLinks.map(([materia, items]) => (
              <View key={materia} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>{materia}</Text>
                <View style={[styles.listGroup, { backgroundColor: theme.backgroundSecondary }]}>
                  {items.map((item, index) => (
                    <LinkItemRow
                      key={item.id}
                      item={item}
                      theme={theme}
                      isLast={index === items.length - 1}
                      onPress={() => abrirEnlace(item.url)}
                      onEdit={() => abrirModalParaEditar(item)}
                      onDelete={() => eliminarLink(item.id, item.nombre)}
                      getIcon={getIconForUrl}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="bookmark-outline" size={48} color={theme.icon} style={{ opacity: 0.4 }} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {searchQuery ? 'Sin resultados' : 'Sin enlaces guardados'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
                {searchQuery
                  ? `No hay enlaces que coincidan con "${searchQuery}"`
                  : 'Guarda tus enlaces favoritos para acceder rápidamente'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.blue }]}
                  onPress={abrirModalParaCrear}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Agregar enlace</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      {/* FAB para agregar */}
      {links.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.blue }]}
          onPress={abrirModalParaCrear}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* MODAL SHEET */}
      <Modal animationType="none" transparent={true} visible={modalVisible} onRequestClose={cerrarModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={cerrarModal}>
            <Animated.View style={[styles.modalOverlay, { opacity: modalBackdropAnim }]}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      transform: [{ translateY: modalSheetAnim }]
                    }
                  ]}
                >
                  <View style={[styles.modalHandle, { backgroundColor: theme.separator }]} />

                  {!showMateriaPicker ? (
                    <>
                      {/* MODO FORMULARIO */}
                      <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={cerrarModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Text style={[styles.modalActionText, { color: theme.blue }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                          {editandoId ? 'Editar enlace' : 'Nuevo enlace'}
                        </Text>
                        <TouchableOpacity onPress={handleGuardar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Text style={[styles.modalActionText, { color: theme.blue, fontWeight: '600' }]}>
                            {editandoId ? 'Guardar' : 'Agregar'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                      >
                        {/* Preview del link */}
                        <View style={[styles.previewCard, { backgroundColor: theme.background }]}>
                          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                            <Ionicons
                              name={nuevaUrl ? getIconForUrl(nuevaUrl) : 'link'}
                              size={24}
                              color={selectedColor}
                            />
                          </View>
                          <View style={styles.previewText}>
                            <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={1}>
                              {nuevoNombre || 'Nombre del enlace'}
                            </Text>
                            <Text style={[styles.previewSubtitle, { color: theme.icon }]} numberOfLines={1}>
                              {nuevaMateria || 'MATERIA'}
                            </Text>
                          </View>
                        </View>

                        {/* Selector de color */}
                        <Text style={[styles.colorLabel, { color: theme.icon }]}>COLOR</Text>
                        <View style={styles.colorRow}>
                          {LINK_COLORS.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                selectedColor === color && styles.colorOptionSelected
                              ]}
                              onPress={() => {
                                triggerHaptic('light');
                                setSelectedColor(color);
                              }}
                            >
                              {selectedColor === color && (
                                <Ionicons name="checkmark" size={18} color="#fff" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Inputs */}
                        <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                          <View style={styles.inputRow}>
                            <Ionicons name="text" size={20} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                              style={[styles.input, { color: theme.text }]}
                              placeholder="Nombre del enlace"
                              placeholderTextColor={theme.icon}
                              value={nuevoNombre}
                              onChangeText={setNuevoNombre}
                            />
                          </View>
                          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
                          <Pressable
                            style={({ pressed }) => [
                              styles.inputRow,
                              pressed && { opacity: 0.7 }
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              triggerHaptic('light');
                              setMateriaSearch('');
                              setShowMateriaPicker(true);
                            }}
                          >
                            <Ionicons name="school-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                            <View style={styles.inputTextWrapper}>
                              <Text
                                style={[styles.inputText, { color: nuevaMateria ? theme.text : theme.icon }]}
                                numberOfLines={1}
                              >
                                {nuevaMateria || 'Seleccionar materia'}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.separator} />
                          </Pressable>
                          <View style={[styles.hairline, { backgroundColor: theme.separator }]} />
                          <View style={styles.inputRow}>
                            <Ionicons name="link" size={20} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                              style={[styles.input, { color: theme.text }]}
                              placeholder="https://..."
                              placeholderTextColor={theme.icon}
                              value={nuevaUrl}
                              onChangeText={setNuevaUrl}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                            />
                          </View>
                        </View>

                        {editandoId && (
                          <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: theme.red + '15' }]}
                            onPress={() => {
                              cerrarModal();
                              setTimeout(() => eliminarLink(editandoId, nuevoNombre), 300);
                            }}
                          >
                            <Ionicons name="trash-outline" size={20} color={theme.red} />
                            <Text style={[styles.deleteButtonText, { color: theme.red }]}>Eliminar enlace</Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    </>
                  ) : (
                    <>
                      {/* MODO PICKER DE MATERIAS */}
                      <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowMateriaPicker(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name="chevron-back" size={24} color={theme.blue} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar Materia</Text>
                        <View style={{ width: 24 }} />
                      </View>

                      {/* Buscador */}
                      <View style={[styles.pickerSearchWrapper, { backgroundColor: theme.background }]}>
                        <Ionicons name="search" size={18} color={theme.icon} />
                        <TextInput
                          style={[styles.searchInput, { color: theme.text }]}
                          placeholder="Buscar o escribir nueva..."
                          placeholderTextColor={theme.icon}
                          value={materiaSearch}
                          onChangeText={setMateriaSearch}
                          autoCapitalize="characters"
                          autoFocus
                        />
                        {materiaSearch.length > 0 && (
                          <TouchableOpacity onPress={() => setMateriaSearch('')}>
                            <Ionicons name="close-circle" size={18} color={theme.icon} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Opción para usar texto personalizado */}
                        {materiaSearch.length > 0 && !materiasDisponibles.some(m => m.toUpperCase() === materiaSearch.toUpperCase()) && (
                          <TouchableOpacity
                            style={[styles.pickerOption, { backgroundColor: theme.blue + '15' }]}
                            onPress={() => {
                              triggerHaptic('light');
                              setNuevaMateria(materiaSearch.toUpperCase());
                              setShowMateriaPicker(false);
                            }}
                          >
                            <Ionicons name="add-circle" size={22} color={theme.blue} />
                            <Text style={[styles.pickerOptionText, { color: theme.blue, fontWeight: '600' }]}>
                              Usar "{materiaSearch.toUpperCase()}"
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Opción GENERAL */}
                        <TouchableOpacity
                          style={[styles.pickerOption, { backgroundColor: theme.background }]}
                          onPress={() => {
                            triggerHaptic('light');
                            setNuevaMateria('GENERAL');
                            setShowMateriaPicker(false);
                          }}
                        >
                          <Ionicons name="folder-outline" size={22} color={theme.icon} />
                          <Text style={[styles.pickerOptionText, { color: theme.text }]}>GENERAL</Text>
                          {nuevaMateria === 'GENERAL' && (
                            <Ionicons name="checkmark" size={22} color={theme.blue} style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>

                        {/* Lista de materias */}
                        {materiasDisponibles
                          .filter(m => m.toUpperCase().includes(materiaSearch.toUpperCase()))
                          .map((item) => (
                            <TouchableOpacity
                              key={item}
                              style={[styles.pickerOption, { backgroundColor: theme.background }]}
                              onPress={() => {
                                triggerHaptic('light');
                                setNuevaMateria(item.toUpperCase());
                                setShowMateriaPicker(false);
                              }}
                            >
                              <Ionicons name="school" size={22} color={theme.green} />
                              <Text style={[styles.pickerOptionText, { color: theme.text }]}>{item}</Text>
                              {nuevaMateria.toUpperCase() === item.toUpperCase() && (
                                <Ionicons name="checkmark" size={22} color={theme.blue} style={{ marginLeft: 'auto' }} />
                              )}
                            </TouchableOpacity>
                          ))}

                        {materiasDisponibles.length === 0 && materiaSearch.length === 0 && (
                          <View style={styles.pickerEmpty}>
                            <Text style={[styles.pickerEmptyText, { color: theme.icon }]}>
                              No tenés materias cargadas
                            </Text>
                            <Text style={[styles.pickerEmptySubtext, { color: theme.icon }]}>
                              Escribí arriba para crear una nueva
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </>
                  )}
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Componente para cada item de link con animación de press
const LinkItemRow = ({
  item,
  theme,
  isLast,
  onPress,
  onEdit,
  onDelete,
  getIcon
}: {
  item: LinkItem;
  theme: typeof Colors.light;
  isLast: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getIcon: (url: string) => keyof typeof Ionicons.glyphMap;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.listItem}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onEdit}
        delayLongPress={500}
      >
        <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={getIcon(item.url)} size={22} color={item.color} />
        </View>
        <View style={styles.infoBox}>
          <Text style={[styles.linkNombre, { color: theme.text }]} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={[styles.linkUrl, { color: theme.icon }]} numberOfLines={1}>
            {item.url.replace(/^https?:\/\//, '').split('/')[0]}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={18} color={theme.blue} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={18} color={theme.separator} style={{ marginLeft: 4 }} />
        </View>
      </Pressable>
      {!isLast && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  // Header Styles
  headerInline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 70,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerInlineContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInlineTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerLarge: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLargeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  backText: {
    fontSize: 17,
    marginLeft: -4,
  },
  addBtn: {
    padding: 4,
  },

  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
    height: 24,
    padding: 0,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 35,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  listGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 }
    })
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBox: { flex: 1 },
  linkNombre: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
  linkUrl: { fontSize: 13 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 }
    })
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalActionText: { fontSize: 17 },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  previewText: { flex: 1 },
  previewTitle: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
  previewSubtitle: { fontSize: 13 },

  colorLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  inputGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: '100%',
  },
  inputTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 17,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },

  // Picker de materias
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerContent: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 8,
    paddingHorizontal: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  pickerHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  pickerOptionCustom: {
    marginBottom: 12,
  },
  pickerOptionText: {
    fontSize: 17,
  },
  pickerList: {
    flex: 1,
  },
  pickerEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  pickerEmptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerEmptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});
