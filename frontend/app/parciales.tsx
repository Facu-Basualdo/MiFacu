
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

const { width, height } = Dimensions.get('window');
const CARD_MARGIN = 20;

const PALETA_COLORES = [
  '#FF9F0A', // Orange
  '#0A84FF', // Blue
  '#FF453A', // Red
  '#30D158', // Green
  '#BF5AF2', // Purple
  '#FF375F', // Pink
  '#64D2FF'  // Cyan
];

// --- HELPERS GLOBALES ---
const parseDate = (fechaStr: string) => {
  if (!fechaStr) return new Date();
  if (fechaStr.includes('/')) {
    const [dia, mes] = fechaStr.split('/').map(Number);
    const hoy = new Date();
    let anio = hoy.getFullYear();
    if (mes < (hoy.getMonth() + 1)) anio += 1;
    return new Date(anio, mes - 1, dia);
  }
  return new Date(fechaStr); // Fallback ISO
};

const getTiempoRestante = (fechaStr: string) => {
  const fechaEvento = parseDate(fechaStr);
  const hoy = new Date();
  const diffTime = fechaEvento.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Finalizado";
  if (diffDays === 0) return "¡Es hoy!";
  if (diffDays === 1) return "Mañana";
  if (diffDays < 30) return `${diffDays} días`;
  return `${Math.floor(diffDays / 30)} mes(es)`;
};

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

const EventCardContent = ({ evento, onDeleteTrigger }: { evento: any, onDeleteTrigger?: () => void }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: evento.color, marginBottom: 0 }]}
      onLongPress={onDeleteTrigger}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.tagContainer, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
            <Text style={styles.tagText}>{evento.tipo.toUpperCase()}</Text>
          </View>
          <Text style={[styles.cardCountdown, { marginLeft: 10 }]}>{getTiempoRestante(evento.fecha)}</Text>
        </View>
        <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{evento.titulo}</Text>

      <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.footerText}>{evento.hora} hs</Text>
          </View>
          <View style={[styles.footerItem, { marginLeft: 15 }]}>
            <Ionicons name="calendar-clear-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.footerText}>{evento.fecha}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {evento.notificar && (
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

export default function ParcialesScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Sheet (Modal Animado)
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'Parcial' | 'Entrega'>('Parcial');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevoColor, setNuevoColor] = useState(PALETA_COLORES[0]);

  // Notificaciones
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

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DataRepository.getRecordatorios(isGuest);

      // Filtrar solo Parciales y Entregas
      const filtrados = data.filter((item: any) =>
        item.tipo === 'Parcial' || item.tipo === 'Entrega' || item.tipo === 'PARCIAL' || item.tipo === 'ENTREGA'
      );

      // Mapear y Ordenar
      const mapped = filtrados.map((item: any) => ({
        id: item.id,
        titulo: item.nombre || item.titulo,
        tipo: item.tipo === 'PARCIAL' ? 'Parcial' : (item.tipo === 'ENTREGA' ? 'Entrega' : item.tipo),
        fechaRaw: item.fecha,
        fecha: formatearFecha(item.fecha),
        hora: item.hora ? item.hora.toString().slice(0, 5) : "09:00",
        color: item.color || PALETA_COLORES[0],
        notificar: item.notificar, // Asumiendo que la DB soporta esto, si no mockearlo o ajustarlo
        recordatorioAnticipacion: item.recordatorioAnticipacion
      })).sort((a: any, b: any) => new Date(a.fechaRaw).getTime() - new Date(b.fechaRaw).getTime());

      setEventos(mapped);
    } catch (e) {
      console.error("Error cargando parciales:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaISO: string | Date) => {
    if (!fechaISO) return '--/--';
    const date = new Date(fechaISO);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();
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

  const askConfirmation = () => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "¿Eliminar Evento?",
        "Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
          { text: "Eliminar", style: "destructive", onPress: () => resolve(true) }
        ]
      );
    });
  };

  const executeDelete = async (id: any) => {
    try {
      await DataRepository.deleteRecordatorio(isGuest, id);

      // Cancelar notificación local (si se hubiera guardado el ID de notif, aunque aquí usamos el ID del evento)
      try {
        await Notifications.cancelScheduledNotificationAsync(id.toString());
      } catch (e) { }

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
    if (!nuevoTitulo || nuevaFecha.length < 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert("Faltan datos", "Ingresá un título y una fecha válida (DD/MM)");
    }

    try {
      const [d, m] = nuevaFecha.split('/');
      const year = new Date().getFullYear();
      const isoDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

      const nuevoEvento = {
        nombre: nuevoTitulo,
        tipo: nuevoTipo,
        fecha: isoDate,
        hora: nuevaHora || "09:00",
        color: nuevoColor,
        materiaNombre: "General",
        // Agregar campos de notificación si la DB lo soporta, o usar custom fields
      };

      const result = await DataRepository.createRecordatorio(isGuest, nuevoEvento);
      const newId = result?.id || result?.data?.id;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Programar notificación local if enabled
      if (notificar && newId) {
        try {
          const fechaExamen = parseDate(nuevaFecha);
          const [h, min] = (nuevaHora || "09:00").split(':').map(Number);
          fechaExamen.setHours(h, min, 0, 0);

          const scheduledDate = new Date(fechaExamen.getTime() - anticipacion * 60000);

          if (scheduledDate > new Date()) {
            await Notifications.scheduleNotificationAsync({
              identifier: newId.toString(),
              content: {
                title: `📅 ${nuevoTipo}: ${nuevoTitulo}`,
                body: `Recordatorio: ${nuevoTitulo} es mañana. ¡Prepárate!`,
                data: { id: newId },
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

      // Reset inputs
      setNuevoTitulo(''); setNuevaFecha(''); setNuevaHora('');
      setNuevoColor(PALETA_COLORES[0]); setNotificar(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el evento.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* HEADER iOS STYLE */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.tint }]}>Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Parciales</Text>
          <TouchableOpacity onPress={openSheet} style={styles.addButtonHead}>
            <Ionicons name="add-circle" size={28} color={theme.tint} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>PRÓXIMAS FECHAS</Text>

          {eventos.map((evento, index) => (
            <DeletableCard
              key={evento.id}
              index={index}
              onConfirm={() => askConfirmation()}
              onDelete={() => executeDelete(evento.id)}
              theme={theme}
            >
              <EventCardContent evento={evento} />
            </DeletableCard>
          ))}

          {eventos.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={60} color={theme.separator} />
              <Text style={[styles.emptyText, { color: theme.icon }]}>Todo despejado</Text>
              <Text style={[styles.emptySubtext, { color: theme.icon }]}>No tenés parciales ni entregas pendientes.</Text>
              <TouchableOpacity onPress={openSheet} style={[styles.emptyBtn, { backgroundColor: theme.tint }]}>
                <Text style={styles.emptyBtnText}>Agregar Evento</Text>
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
                  maxHeight: height * 0.9
                }
              ]}
            >
              <View style={[styles.sheetHandle, { backgroundColor: theme.separator }]} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.text }]}>Nuevo Evento</Text>
                  <TouchableOpacity onPress={closeSheet}>
                    <Ionicons name="close-circle" size={28} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  {/* TIPO */}
                  <View style={[styles.segmentedControl, { backgroundColor: theme.separator + '40' }]}>
                    {(['Parcial', 'Entrega'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.segmentBtn,
                          nuevoTipo === t && styles.segmentBtnActive,
                          { backgroundColor: nuevoTipo === t ? theme.background : 'transparent' }
                        ]}
                        onPress={() => {
                          setNuevoTipo(t);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={[
                          styles.segmentText,
                          { color: nuevoTipo === t ? theme.text : theme.icon, fontWeight: nuevoTipo === t ? '600' : '400' }
                        ]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { color: theme.icon }]}>TÍTULO</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.separator + '30', color: theme.text }]}
                    placeholder="E.J. ANÁLISIS II"
                    placeholderTextColor={theme.icon}
                    value={nuevoTitulo}
                    onChangeText={setNuevoTitulo}
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

                  {/* SECCIÓN NOTIFICACIONES */}
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
                    <Text style={styles.btnTextConfirm}>Guardar Evento</Text>
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
  },
  tagContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
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
  emptyText: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 15, color: '#333' },
  emptySubtext: { fontSize: 14, marginTop: 5, textAlign: 'center', width: '70%', opacity: 0.6 },
  emptyBtn: { marginTop: 25, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

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

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row', borderRadius: 9, padding: 2, marginBottom: 25, height: 36
  },
  segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  segmentBtnActive: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 13 },

  // SWIPE STYLES
  swipeContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  cardContainer: {
    width: '100%',
  },
});