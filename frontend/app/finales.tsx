import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated as RNAnimated,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { DataRepository } from '../src/services/dataRepository';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/theme';

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const { width, height } = Dimensions.get('window');
const CARD_MARGIN = 20;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

const PALETA_COLORES = [
  '#FF9500', // Naranja
  '#007AFF', // Azul
  '#FF3B30', // Rojo
  '#34C759', // Verde
  '#5856D6', // Violeta
];

// --- COMPONENTE ANIMADO "THANOS SNAP" ---
const DeletableCard = ({
  children,
  onDelete,
  onConfirm,
  index,
  theme
}: {
  children: React.ReactNode,
  onDelete: () => void,
  onConfirm?: () => Promise<boolean>,
  index: number,
  theme: any
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const opacity = useRef(new RNAnimated.Value(1)).current;
  const scale = useRef(new RNAnimated.Value(1)).current;

  // Generar partículas aleatorias
  const particles = useRef([...Array(12)].map(() => ({
    x: new RNAnimated.Value(0),
    y: new RNAnimated.Value(0),
    opacity: new RNAnimated.Value(0),
    scale: new RNAnimated.Value(0.5 + Math.random()),
    dx: (Math.random() - 0.5) * 150, // Dispersión X
    dy: (Math.random() - 0.5) * 150, // Dispersión Y
  }))).current;

  const triggerDelete = async () => {
    // 0. Preguntar primero (Si existe onConfirm)
    if (onConfirm) {
      const confirmed = await onConfirm();
      if (!confirmed) return;
    }

    setIsDeleting(true);
    // Solo feedback táctil suave al iniciar la destrucción
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // 1. Fade out card + Scale down slightly
    const cardAnim = RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scale, {
        toValue: 0.9,
        duration: 400,
        useNativeDriver: true,
      })
    ]);

    // 2. Explode particles
    const particleAnims = particles.map(p => {
      // Set initial state visible
      p.opacity.setValue(0.8);

      return RNAnimated.parallel([
        RNAnimated.timing(p.x, {
          toValue: p.dx,
          duration: 600,
          useNativeDriver: true,
        }),
        RNAnimated.timing(p.y, {
          toValue: p.dy,
          duration: 600,
          useNativeDriver: true,
        }),
        RNAnimated.timing(p.opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]);
    });

    RNAnimated.parallel([
      cardAnim,
      RNAnimated.stagger(20, particleAnims)
    ]).start(() => {
      onDelete(); // Ejecutar borrado real en DB al terminar
    });
  };

  // Exponer la función triggerDelete a través de clonar el hijo y pasarle la prop
  // O simplemente envolver el hijo y pasarle el trigger (más limpio)

  // Hack: Inyectamos la función onPress al botón de borrar dentro del hijo
  // Esto requiere que el hijo acepte una prop especial o usar Context, pero para simplificar
  // vamos a asumir que DeletableCard maneja el gesto si fuera swipe, pero aquí es botón.
  // MEJOR: Pasamos triggerDelete al hijo modificando el render.

  // Para no complicar la prop drilling, usaremos un contexto o render prop pattern si fuera necesario.
  // Pero como 'children' es un elemento React, podemos usar cloneElement.

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { onDeleteTrigger: triggerDelete });
    }
    return child;
  });

  return (
    <View style={[styles.swipeContainer, { zIndex: isDeleting ? 999 : 1 }]}>
      <RNAnimated.View style={[styles.cardContainer, { opacity, transform: [{ scale }] }]}>
        {childrenWithProps}
      </RNAnimated.View>

      {/* Partículas (solo visibles al borrar) */}
      {isDeleting && particles.map((p, i) => (
        <RNAnimated.View
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.text, // Color polvo/partícula
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { scale: p.scale }
            ]
          }}
        />
      ))}
    </View>
  );
};

// --- HELPERS GLOBALES ---
const parseDate = (fechaStr: string) => {
  if (!fechaStr || !fechaStr.includes('/')) return new Date();
  const [dia, mes] = fechaStr.split('/').map(Number);
  const hoy = new Date();
  let anio = hoy.getFullYear();
  if (mes < (hoy.getMonth() + 1)) anio += 1;
  return new Date(anio, mes - 1, dia);
};

const getTiempoRestante = (fechaStr: string) => {
  const fechaExamen = parseDate(fechaStr);
  const hoy = new Date();
  const diffTime = fechaExamen.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Finalizado";
  if (diffDays === 0) return "¡Es hoy!";
  if (diffDays === 1) return "Mañana";
  if (diffDays < 30) return `${diffDays} días`;
  return `${Math.floor(diffDays / 30)} mes(es)`;
};

const ExamCardContent = ({ examen, onDeleteTrigger }: { examen: any, onDeleteTrigger?: () => void }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: examen.color, marginBottom: 0 }]}
      onLongPress={onDeleteTrigger}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardCountdown}>{getTiempoRestante(examen.fecha)}</Text>
        <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{examen.materia}</Text>

      <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.footerText}>{examen.hora} hs</Text>
          </View>
          <View style={[styles.footerItem, { marginLeft: 15 }]}>
            <Ionicons name="calendar-clear-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.footerText}>{examen.fecha}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {examen.notificar && (
            <Ionicons name="notifications-outline" size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 15 }} />
          )}
          <TouchableOpacity
            onPress={onDeleteTrigger}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function FinalesScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [examenes, setExamenes] = useState<{
    id: any,
    materia: string,
    fecha: string,
    hora: string,
    color: string,
    notificar: boolean,
    recordatorioAnticipacion: number
  }[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Sheet (Modal Animado)
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevoColor, setNuevoColor] = useState(PALETA_COLORES[0]);
  const [notificar, setNotificar] = useState(true);
  const [anticipacion, setAnticipacion] = useState(1440); // 1 día por defecto (minutos)

  const OPCIONES_ANTICIPACION = [
    { label: 'Momento', value: 0 },
    { label: '1 h', value: 60 },
    { label: '1 día', value: 1440 },
    { label: '2 días', value: 2880 },
    { label: '1 sem', value: 10080 },
  ];

  // Animación del Sheet
  const sheetAnim = useRef(new RNAnimated.Value(height)).current;
  const overlayOpacity = useRef(new RNAnimated.Value(0)).current;

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DataRepository.getFinales(isGuest);
      const mapped = data.map((item: any) => ({
        id: item.id,
        materia: item.materia?.nombre || item.materiaNombre || 'Desconocida',
        fecha: item.fecha.toString().split('T')[0].split('-').reverse().slice(0, 2).join('/'),
        hora: item.hora ? item.hora.toString().slice(0, 5) : "09:00",
        color: item.color || PALETA_COLORES[0],
        notificar: item.notificar,
        recordatorioAnticipacion: item.recordatorioAnticipacion,
      }));
      setExamenes(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  useEffect(() => {
    loadData();
    requestPermissions();
  }, [isGuest]);

  const openSheet = () => {
    setModalVisible(true);
    RNAnimated.parallel([
      RNAnimated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(sheetAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  };

  const closeSheet = () => {
    RNAnimated.parallel([
      RNAnimated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(sheetAnim, { toValue: height, duration: 400, useNativeDriver: false }),
    ]).start(() => setModalVisible(false));
    Keyboard.dismiss();
  };

  // parseDate y getTiempoRestante movidos arriba

  const getExamenesOrdenados = () => {
    return [...examenes].sort((a, b) => parseDate(a.fecha).getTime() - parseDate(b.fecha).getTime());
  };

  const askConfirmation = () => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "¿Borrar Examen?",
        "Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
          { text: "Borrar", style: "destructive", onPress: () => resolve(true) }
        ]
      );
    });
  };

  const executeDelete = async (id: any) => {
    try {
      if (!isGuest) await DataRepository.deleteFinal(isGuest, id);

      // Cancelar notificación local
      try {
        await Notifications.cancelScheduledNotificationAsync(id.toString());
      } catch (notifierr) {
        console.error("Error canceling notification:", notifierr);
      }

      loadData();
    } catch (e) { Alert.alert("Error al borrar"); }
  };

  const handleChangeFecha = (text: string) => {
    let limpio = text.replace(/[^0-9]/g, '');
    if (limpio.length > 2) limpio = limpio.slice(0, 2) + '/' + limpio.slice(2, 4);
    setNuevaFecha(limpio);
  };

  const handleChangeHora = (text: string) => {
    let limpio = text.replace(/[^0-9]/g, '');
    if (limpio.length > 2) limpio = limpio.slice(0, 2) + ':' + limpio.slice(2, 4);
    setNuevaHora(limpio);
  };

  const handleAgregar = async () => {
    if (!nuevaMateria || nuevaFecha.length < 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert("Faltan datos", "Por favor ingresa materia y fecha.");
    }

    const [d, m] = nuevaFecha.split('/');
    const currentYear = new Date().getFullYear();
    const isoDate = `${currentYear}-${m}-${d}`;

    const nuevo = {
      materiaNombre: nuevaMateria.toUpperCase().trim(),
      fecha: isoDate,
      hora: nuevaHora || "09:00",
      color: nuevoColor,
      notificar,
      recordatorioAnticipacion: anticipacion
    };

    try {
      const response = await DataRepository.createFinal(isGuest, nuevo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Programar notificación local if enabled
      if (notificar) {
        try {
          const fechaExamen = parseDate(nuevaFecha);
          const [h, min] = (nuevaHora || "09:00").split(':').map(Number);
          fechaExamen.setHours(h, min, 0, 0);

          const scheduledDate = new Date(fechaExamen.getTime() - anticipacion * 60000);

          if (scheduledDate > new Date()) {
            const finalId = response.id || response.data?.id;
            await Notifications.scheduleNotificationAsync({
              identifier: finalId.toString(),
              content: {
                title: `📚 ¡Examen de ${nuevaMateria.toUpperCase()}!`,
                body: `Mañana tienes el final de ${nuevaMateria}. ¡Mucho éxito!`,
                data: { finalId },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: scheduledDate
              } as Notifications.NotificationTriggerInput,
            });
          }
        } catch (notifierr) {
          console.error("Error scheduling notification:", notifierr);
        }
      }

      closeSheet();
      loadData();
      setNuevaMateria(''); setNuevaFecha(''); setNuevaHora(''); setNuevoColor(PALETA_COLORES[0]);
    } catch (e) { Alert.alert("Error creando"); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* HEADER iOS STYLE */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.tint }]}>Listo</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Exámenes</Text>
          <TouchableOpacity onPress={openSheet} style={styles.addButtonHead}>
            <Ionicons name="add-circle" size={28} color={theme.tint} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>PRÓXIMAS MESAS</Text>

          {getExamenesOrdenados().map((examen, index) => (
            <DeletableCard
              key={examen.id}
              index={index}
              onConfirm={() => askConfirmation()}
              onDelete={() => executeDelete(examen.id)}
              theme={theme}
            >
              <ExamCardContent
                examen={examen}
              />
            </DeletableCard>
          ))}

          {examenes.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={60} color={theme.separator} />
              <Text style={[styles.emptyText, { color: theme.icon }]}>No tienes exámenes programados</Text>
              <TouchableOpacity onPress={openSheet} style={[styles.emptyBtn, { backgroundColor: theme.tint }]}>
                <Text style={styles.emptyBtnText}>Agregar Fecha</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>


      </SafeAreaView>

      {/* CUSTOM ANIMATED SHEET */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={closeSheet}>
              <RNAnimated.View style={[styles.sheetOverlay, { opacity: overlayOpacity, ...StyleSheet.absoluteFillObject }]} />
            </TouchableWithoutFeedback>

            <RNAnimated.View
              style={[
                styles.sheetContent,
                {
                  backgroundColor: theme.backgroundSecondary,
                  transform: [{ translateY: sheetAnim }],
                  maxHeight: height * 0.9 // Evitar que ocupe toda la pantalla
                }
              ]}
            >
              <View style={[styles.sheetHandle, { backgroundColor: theme.separator }]} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.text }]}>Nueva Mesa</Text>
                  <TouchableOpacity onPress={closeSheet}>
                    <Ionicons name="close-circle" size={28} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  <Text style={[styles.label, { color: theme.icon }]}>MATERIA</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.separator + '30', color: theme.text }]}
                    placeholder="E.J. ANÁLISIS MATEMÁTICO"
                    placeholderTextColor={theme.icon}
                    value={nuevaMateria}
                    onChangeText={setNuevaMateria}
                    autoCapitalize="characters"
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 15 }}>
                      <Text style={[styles.label, { color: theme.icon }]}>FECHA (DD/MM)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.separator + '30', color: theme.text }]}
                        placeholder="19/02"
                        placeholderTextColor={theme.icon}
                        value={nuevaFecha}
                        onChangeText={handleChangeFecha}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: theme.icon }]}>HORA</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.separator + '30', color: theme.text }]}
                        placeholder="09:00"
                        placeholderTextColor={theme.icon}
                        value={nuevaHora}
                        onChangeText={handleChangeHora}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                  </View>

                  {/* SECCIÓN NOTIFICACIONES (ESTILO iOS) */}
                  <View style={[styles.settingRow, { borderBottomColor: theme.separator + '50' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.settingIcon, { backgroundColor: theme.tint }]}>
                        <Ionicons name="notifications" size={16} color="#fff" />
                      </View>
                      <Text style={[styles.settingLabel, { color: theme.text }]}>Recordatorio</Text>
                    </View>
                    <Switch
                      value={notificar}
                      onValueChange={setNotificar}
                      trackColor={{ false: theme.separator, true: theme.tint }}
                      ios_backgroundColor={theme.separator}
                    />
                  </View>

                  {notificar && (
                    <View style={styles.anticipacionContainer}>
                      <Text style={[styles.label, { color: theme.icon, marginBottom: 10 }]}>AVISO</Text>
                      <View style={styles.selectorContainer}>
                        {OPCIONES_ANTICIPACION.map(opcion => (
                          <TouchableOpacity
                            key={opcion.value}
                            onPress={() => {
                              setAnticipacion(opcion.value);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={[
                              styles.selectorItem,
                              anticipacion === opcion.value && { backgroundColor: theme.tint }
                            ]}
                          >
                            <Text style={[
                              styles.selectorText,
                              { color: anticipacion === opcion.value ? '#fff' : theme.icon }
                            ]}>
                              {opcion.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <Text style={[styles.label, { color: theme.icon, marginBottom: 15 }]}>COLOR IDENTIFICADOR</Text>
                  <View style={styles.colorPalette}>
                    {PALETA_COLORES.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[styles.colorCircle, { backgroundColor: color }, nuevoColor === color && { borderWidth: 3, borderColor: theme.text }]}
                        onPress={() => {
                          setNuevoColor(color);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        {nuevoColor === color && <Ionicons name="checkmark" size={20} color="#fff" />}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={[styles.btnConfirm, { backgroundColor: theme.tint }]} onPress={handleAgregar}>
                    <Text style={styles.btnTextConfirm}>Crear Recordatorio</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </RNAnimated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  closeButton: { paddingVertical: 5 },
  closeText: { fontSize: 17, fontWeight: '600' },
  addButtonHead: { padding: 5 },

  content: { paddingHorizontal: CARD_MARGIN },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 15, marginTop: 10 },

  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardCountdown: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 15,
    lineHeight: 28,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginLeft: 6 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 15, width: '80%', opacity: 0.7 },
  emptyBtn: { marginTop: 25, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  fab: {
    position: 'absolute', bottom: 30, right: 20,
    borderRadius: 30, width: 60, height: 60,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 8
  },

  // SHEET STYLES
  sheetOverlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetContent: {
    width: '100%',
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sheetTitle: { fontSize: 24, fontWeight: '800' },
  form: { width: '100%' },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  input: { borderRadius: 12, padding: 15, fontSize: 17, fontWeight: '500', marginBottom: 20 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  colorPalette: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  colorCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  btnConfirm: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  btnTextConfirm: { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Settings / Notifications Styles
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  settingIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  anticipacionContainer: {
    marginBottom: 25,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 3,
  },
  selectorItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // SWIPE STYLES
  swipeContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  cardContainer: {
    width: '100%',
  },
  underlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 20,
  },
  deleteButton: {
    height: '100%',
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});