import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState, useRef } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { materiasApi as api } from '../src/services/api';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

interface Materia {
  id: number;
  nombre: string;
  estado?: string;
  dia: string;
  hora: number;
  duracion?: number;
  aula?: string;
  color?: string;
}

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const DIAS_LABELS = ['L', 'M', 'Mi', 'J', 'V', 'S'];

const getDiaHoyIndex = () => {
  const days = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
  const today = days[new Date().getDay()];
  const index = DIAS.indexOf(today);
  return index !== -1 ? index : 0;
};

const getColors = (theme: any): Record<string, string> => ({
  'Análisis Mat. II': theme.blue,
  'Física II': theme.orange,
  'Análisis Sist.': theme.blue,
  'Algoritmos y ED': theme.green,
  'default': theme.red,
});

const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;

// ─── Animated Card Entry ───
const AnimatedCard = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Schedule Card (MyDyson style) ───
const ScheduleCard = ({
  materia,
  endHour,
  diasMateria,
  color,
  theme,
  isNow,
  onPress,
}: {
  materia: Materia;
  endHour: number;
  diasMateria: string[];
  color: string;
  theme: typeof Colors.light;
  isNow: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: isNow ? color + '08' : theme.backgroundSecondary,
            borderLeftColor: color,
          },
        ]}
      >
        {/* Time Column */}
        <View style={styles.timeSection}>
          <Text style={[styles.startTime, { color: theme.text }]}>
            {formatHour(materia.hora)}
          </Text>
          <View style={styles.timeConnector}>
            <View style={[styles.connectorDot, { backgroundColor: color + '50' }]} />
            <View style={[styles.connectorLine, { backgroundColor: color + '25' }]} />
            <View style={[styles.connectorDot, { backgroundColor: color + '50' }]} />
          </View>
          <Text style={[styles.endTime, { color: theme.icon }]}>
            {formatHour(endHour)}
          </Text>
        </View>

        {/* Vertical Divider */}
        <View style={[styles.cardDivider, { backgroundColor: theme.separator + '60' }]} />

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.materiaName, { color: theme.text }]} numberOfLines={2}>
            {materia.nombre}
          </Text>
          {materia.aula && (
            <View style={styles.aulaRow}>
              <Ionicons name="location-outline" size={13} color={color} />
              <Text style={[styles.aulaText, { color: theme.icon }]}>{materia.aula}</Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            {isNow && (
              <View style={[styles.nowBadge, { backgroundColor: color }]}>
                <Text style={styles.nowBadgeText}>Ahora</Text>
              </View>
            )}
            <Text style={[styles.diasText, { color: theme.icon }]}>
              {diasMateria.join(', ')}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ───
export default function HorariosScreen() {
  const router = useRouter();
  const { colorScheme, isDark } = useTheme();
  const theme = Colors[colorScheme];
  const COLORS = getColors(theme);
  const { user, isGuest } = useAuth();

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedDay, setSelectedDay] = useState(getDiaHoyIndex());

  // ─── Data Loading (same logic) ───
  useFocusEffect(
    useCallback(() => {
      const cargarMaterias = async () => {
        try {
          const userId = user?.id || (isGuest ? 'guest' : null);
          if (!userId) return;

          const todas = await api.getMateriasByUsuario(userId);

          const cursandoData = todas.filter((m: any) => {
            const isCursando = String(m.estado).toLowerCase().includes('cursad');
            const hasDia = !!m.dia;
            const hasHora = m.hora !== null && m.hora !== undefined;
            return isCursando && hasDia && hasHora;
          });

          const conColores = cursandoData.map((m: any) => {
            const nombreMateria = m.materia?.nombre || 'Materia';
            return {
              id: m.materiaId || Math.random(),
              nombre: nombreMateria,
              dia: (m.dia || '').trim().toUpperCase(),
              hora: Number(m.hora),
              duracion: Number(m.duracion || 2),
              aula: m.aula || null,
              color: COLORS[nombreMateria] || COLORS.default,
            };
          });

          setMaterias(conColores);
        } catch (error) {
          console.error('Error cargando materias para horarios:', error);
        }
      };

      cargarMaterias();
    }, [])
  );

  // ─── Computed ───
  const materiasDelDia = materias
    .filter((m) => m.dia === DIAS[selectedDay])
    .sort((a, b) => a.hora - b.hora);

  const diasConClases = new Set(materias.map((m) => DIAS.indexOf(m.dia)));

  const getDiasMateria = (nombre: string) => {
    return materias
      .filter((m) => m.nombre === nombre)
      .map((m) => DIAS_LABELS[DIAS.indexOf(m.dia)])
      .filter(Boolean);
  };

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isToday = selectedDay === getDiaHoyIndex();

  const handleDaySelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView edges={['top']}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Horarios</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* ─── Day Selector ─── */}
        <View style={styles.daySelector}>
          {DIAS_LABELS.map((label, index) => {
            const isSelected = index === selectedDay;
            const hasClases = diasConClases.has(index);

            return (
              <Pressable
                key={index}
                onPress={() => handleDaySelect(index)}
                style={styles.dayItem}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && { backgroundColor: theme.tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: theme.icon },
                      isSelected && styles.dayLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: hasClases
                        ? isSelected
                          ? theme.tint
                          : theme.icon
                        : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.selectorBorder, { backgroundColor: theme.separator + '40' }]} />
      </SafeAreaView>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {materias.length === 0 ? (
          /* No materias at all */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.separator + '15' }]}>
              <Ionicons name="calendar-outline" size={40} color={theme.separator} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin horarios</Text>
            <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
              Agregá materias en cursado para ver tus horarios
            </Text>
          </View>
        ) : materiasDelDia.length === 0 ? (
          /* No classes on selected day */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.separator + '15' }]}>
              <Ionicons name="sunny-outline" size={40} color={theme.separator} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Día libre</Text>
            <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
              No tenés clases este día
            </Text>
          </View>
        ) : (
          /* Schedule Cards */
          materiasDelDia.map((materia, index) => {
            const endHour = materia.hora + (materia.duracion || 2);
            const diasMateria = getDiasMateria(materia.nombre);
            const color = materia.color || COLORS.default;
            const isNow =
              isToday &&
              materia.hora <= currentHour &&
              currentHour < endHour;

            return (
              <AnimatedCard key={`${materia.id}-${selectedDay}`} index={index}>
                <ScheduleCard
                  materia={materia}
                  endHour={endHour}
                  diasMateria={diasMateria}
                  color={color}
                  theme={theme}
                  isNow={isNow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/detalle-materia', params: { id: materia.id } } as any);
                  }}
                />
              </AnimatedCard>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // ─── Day Selector ───
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  dayLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  selectorBorder: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ─── Schedule Card ───
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timeSection: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startTime: {
    fontSize: 15,
    fontWeight: '700',
  },
  endTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  timeConnector: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 0,
  },
  connectorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  connectorLine: {
    width: 1.5,
    flex: 1,
    minHeight: 8,
  },
  cardDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
    borderRadius: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  materiaName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  aulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  aulaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto' as any,
  },
  nowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nowBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  diasText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 'auto' as any,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
