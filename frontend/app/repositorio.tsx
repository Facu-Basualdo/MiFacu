import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useRef } from 'react';
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
  LayoutAnimation,
  UIManager
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/theme';
import { DataRepository } from '../src/services/dataRepository';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const { isGuest } = useAuth();

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  React.useEffect(() => {
    loadData();
  }, [isGuest]);

  // Animated values for Modal
  const modalSheetAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
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

  const filteredLinks = useMemo(() => {
    if (!searchQuery) return links;
    const q = searchQuery.toLowerCase();
    return links.filter(l =>
      l.nombre.toLowerCase().includes(q) ||
      l.materia.toLowerCase().includes(q)
    );
  }, [links, searchQuery]);

  const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    setModalVisible(true);
    setModalClosing(false);

    // Start Open Animations
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

    setModalVisible(true);
    setModalClosing(false);

    // Start Open Animations
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
    setModalClosing(true);
    Animated.parallel([
      Animated.timing(modalBackdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalSheetAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setModalClosing(false);
    });
  };

  const handleGuardar = async () => {
    if (!nuevoNombre || !nuevaUrl) {
      triggerHaptic('medium');
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
          materia: nuevaMateria.toUpperCase(),
          url: urlFinal
        });
        triggerHaptic('success');
      } else {
        await DataRepository.createLink(isGuest, {
          nombre: nuevoNombre,
          materia: nuevaMateria.toUpperCase() || "GENERAL",
          url: urlFinal,
          color: theme.blue
        });
        triggerHaptic('success');
      }
      loadData();
      cerrarModal();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el link.");
    }
  };

  const eliminarLink = (id: number) => {
    triggerHaptic('medium');
    Alert.alert("Eliminar", "¿Borrar este acceso directo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
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
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpoStatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* STICKY HEADER (STANDARD ANIMATED API) */}
      <Animated.View style={[
        styles.headerInline,
        {
          borderBottomColor: theme.separator,
          opacity: headerOpacity,
          backgroundColor: theme.background + 'EE'
        }
      ]}>
        <View style={styles.headerInlineContent}>
          <TouchableOpacity onPress={() => { triggerHaptic(); router.back(); }} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.blue} />
          </TouchableOpacity>
          <Text style={[styles.headerInlineTitle, { color: theme.text }]}>Repositorio</Text>
          <TouchableOpacity onPress={abrirModalParaCrear} style={styles.headerBtn}>
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
              <TouchableOpacity onPress={() => { triggerHaptic(); router.back(); }} style={styles.circularBtn}>
                <Ionicons name="chevron-back" size={24} color={theme.blue} />
              </TouchableOpacity>
              <TouchableOpacity onPress={abrirModalParaCrear} style={styles.circularBtn}>
                <Ionicons name="add" size={30} color={theme.blue} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.Text style={[styles.headerLargeTitle, { color: theme.text, opacity: headerLargeOpacity }]}>Repositorio</Animated.Text>
          </View>

          {/* SEARCH BAR */}
          <View style={[styles.searchBarWrapper, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="search" size={18} color={theme.icon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar por materia o nombre..."
              placeholderTextColor={theme.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.icon }]}>MIS ACCESOS DIRECTOS</Text>

          <View style={[styles.listGroup, { backgroundColor: theme.backgroundSecondary }]}>
            {filteredLinks.length > 0 ? (
              filteredLinks.map((item, index) => (
                <AnimatedItem key={item.id} isLast={index === filteredLinks.length - 1} theme={theme}>
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => abrirEnlace(item.url)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name="document-text" size={22} color={item.color} />
                    </View>
                    <View style={styles.infoBox}>
                      <Text style={[styles.linkNombre, { color: theme.text }]} numberOfLines={1}>{item.nombre}</Text>
                      <Text style={[styles.linkMateria, { color: theme.icon }]}>{item.materia}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity onPress={() => abrirModalParaEditar(item)} style={styles.miniBtn}>
                        <Ionicons name="pencil" size={16} color={theme.blue} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => eliminarLink(item.id)} style={styles.miniBtn}>
                        <Ionicons name="trash" size={16} color={theme.red} />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={18} color={theme.separator} style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                  {index < filteredLinks.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: theme.separator, marginLeft: 70 }]} />
                  )}
                </AnimatedItem>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
                <Text style={[styles.emptyText, { color: theme.icon }]}>
                  {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No tienes accesos directos'}
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </SafeAreaView>

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

                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={cerrarModal}>
                      <Text style={[styles.modalActionText, { color: theme.red }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      {editandoId ? 'Editar Link' : 'Nuevo Link'}
                    </Text>
                    <TouchableOpacity onPress={handleGuardar}>
                      <Text style={[styles.modalActionText, { color: theme.blue, fontWeight: '700' }]}>Guardar</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                      <View style={styles.inputRow}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>Nombre</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text }]}
                          placeholder="Ej: Drive de Apuntes"
                          placeholderTextColor={theme.icon}
                          value={nuevoNombre}
                          onChangeText={setNuevoNombre}
                        />
                      </View>
                      <View style={[styles.hairline, { backgroundColor: theme.separator, marginLeft: 16 }]} />
                      <View style={styles.inputRow}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>Materia</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text }]}
                          placeholder="Ej: ANÁLISIS II"
                          placeholderTextColor={theme.icon}
                          value={nuevaMateria}
                          onChangeText={setNuevaMateria}
                          autoCapitalize="characters"
                        />
                      </View>
                      <View style={[styles.hairline, { backgroundColor: theme.separator, marginLeft: 16 }]} />
                      <View style={styles.inputRow}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>URL</Text>
                        <TextInput
                          style={[styles.input, { color: theme.text }]}
                          placeholder="https://..."
                          placeholderTextColor={theme.icon}
                          value={nuevaUrl}
                          onChangeText={setNuevaUrl}
                          autoCapitalize="none"
                          keyboardType="url"
                        />
                      </View>
                    </View>
                    <View style={{ height: 20 }} />
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInlineContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerInlineTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerLarge: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLargeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
    height: 24,
    padding: 0,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 35,
    letterSpacing: -0.1,
    textTransform: 'uppercase'
  },

  listGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 30,
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
    padding: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  infoBox: { flex: 1 },
  linkNombre: { fontSize: 17, fontWeight: '500', marginBottom: 2 },
  linkMateria: { fontSize: 14, fontWeight: '400' },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  miniBtn: { padding: 10 },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    paddingHorizontal: 40
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.5
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: '40%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 15,
    opacity: 0.2
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalActionText: { fontSize: 17 },

  inputGroup: {
    borderRadius: 10,
    overflow: 'hidden'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54
  },
  inputLabel: {
    fontSize: 17,
    width: 90,
    fontWeight: '400'
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: '100%'
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  }
});

// Componente para animar la entrada de cada item sin Reanimated
const AnimatedItem = ({ children, theme }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
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
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};
