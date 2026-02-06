import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSimuladorData, MateriaSimulador, SimuladorStats } from '../src/hooks/useSimuladorData';
import { useSheetAnimation } from '../src/hooks/useSheetAnimation';
import { MateriaDetailSheet } from '../src/components/simulador/MateriaDetailSheet';
import { BlockedMateriaSheet, CorrelativaFaltante } from '../src/components/simulador/BlockedMateriaSheet';
import {
  SIMULADOR_COLORS,
  getSimuladorColors,
  getEstadoConfig,
  getNextEstado,
  EstadoVisual,
} from '../src/utils/estadoMapper';
import { useTheme } from '../src/context/ThemeContext';
import { PremiumGate } from '../src/components/premium';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuración visual optimizada
const NODE_SIZE = 100;
const NODE_SPACING_X = 16;
const NODE_SPACING_Y = 140;
const PADDING_X = 20;
const PADDING_Y = 24;

// Componente de conexión entre materias
interface ConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive: boolean;
  index: number;
  inactiveColor: string;
}

const Connection = React.memo(({ x1, y1, x2, y2, isActive, index, inactiveColor }: ConnectionProps) => {
  // Ajustar puntos para que las líneas terminen antes del nodo
  const padding = 8;
  const adjustedY1 = y1 + padding;
  const adjustedY2 = y2 - padding;

  // Curva bezier suave
  const midY = (adjustedY1 + adjustedY2) / 2;
  const pathD = `M ${x1} ${adjustedY1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${adjustedY2}`;

  const strokeColor = isActive ? SIMULADOR_COLORS.aprobada : inactiveColor;
  const strokeWidth = isActive ? 2.5 : 1.5;
  const opacity = isActive ? 1 : 0.6;

  return (
    <Path
      d={pathD}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      opacity={opacity}
    />
  );
});

// Componente de nodo de materia
interface MateriaNodeProps {
  materia: MateriaSimulador;
  left: number;
  top: number;
  onPress: () => void;
  onLongPress: () => void;
  isDark: boolean;
}

const MateriaNode = React.memo(({ materia, left, top, onPress, onLongPress, isDark }: MateriaNodeProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = getEstadoConfig(materia.estado);
  const colors = getSimuladorColors(isDark);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const isCompleted = materia.estado === 'aprobada' || materia.estado === 'regularizada';
  const isBlocked = materia.estado === 'bloqueada';

  // Fondo sólido basado en estado
  const solidBgColor = isBlocked
    ? (isDark ? '#2C2C2E' : '#F5F5F5')
    : isCompleted
      ? (materia.estado === 'aprobada' ? (isDark ? '#1A3A2A' : '#E8F8EE') : (isDark ? '#3A2A1A' : '#FFF8E8'))
      : colors.backgroundSecondary;

  return (
    <Animated.View
      style={[
        styles.nodeWrapper,
        {
          left,
          top,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.nodeContainer,
          {
            backgroundColor: solidBgColor,
            borderColor: isCompleted ? config.color : colors.separator,
            borderWidth: isCompleted ? 2.5 : 1,
            opacity: isBlocked ? 0.7 : 1,
          },
          pressed && styles.nodePressed,
        ]}
      >
        {/* Indicador de estado */}
        <View style={[styles.statusIndicator, { backgroundColor: config.color }]}>
          <Ionicons
            name={config.iconFilled}
            size={14}
            color="#FFFFFF"
          />
        </View>

        {/* Nombre de la materia */}
        <Text
          style={[
            styles.nodeText,
            { color: isBlocked ? colors.textTertiary : colors.textPrimary }
          ]}
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {materia.nombre}
        </Text>

        {/* Badge de nivel */}
        <View style={[styles.levelBadge, { backgroundColor: colors.backgroundTertiary }, isCompleted && { backgroundColor: config.color + '20' }]}>
          <Text style={[styles.levelText, { color: colors.textTertiary }, isCompleted && { color: config.color }]}>
            Año {materia.nivel}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// Componente de estadísticas compactas
interface StatsBarProps {
  stats: SimuladorStats;
  isDark: boolean;
}

const StatsBar = React.memo(({ stats, isDark }: StatsBarProps) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const colors = getSimuladorColors(isDark);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: stats.porcentaje,
      damping: 20,
      stiffness: 90,
      useNativeDriver: false,
    }).start();
  }, [stats.porcentaje, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.statsContainer}>
      {/* Barra de progreso */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: progressWidth }
          ]}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: SIMULADOR_COLORS.aprobada }]} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.aprobadas}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Apr</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: SIMULADOR_COLORS.regularizada }]} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.regulares}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Reg</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: SIMULADOR_COLORS.pendiente }]} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.cursando}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Disp</Text>
        </View>
        <Text style={styles.percentageText}>{stats.porcentaje}%</Text>
      </View>
    </View>
  );
});

function SimuladorContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const dynamicColors = getSimuladorColors(isDark);

  const {
    materias,
    stats,
    loading,
    error,
    refetch,
  } = useSimuladorData();

  const [localMaterias, setLocalMaterias] = useState<MateriaSimulador[]>([]);
  const [localStats, setLocalStats] = useState<SimuladorStats>(stats);

  // Sheets
  const [selectedMateria, setSelectedMateria] = useState<MateriaSimulador | null>(null);
  const { visible: sheetVisible, sheetAnim, overlayOpacity, open: openSheet, close: closeSheet } = useSheetAnimation();

  const [blockedMateria, setBlockedMateria] = useState<MateriaSimulador | null>(null);
  const [blockedCorrelativas, setBlockedCorrelativas] = useState<CorrelativaFaltante[]>([]);
  const {
    visible: blockedSheetVisible,
    sheetAnim: blockedSheetAnim,
    overlayOpacity: blockedOverlayOpacity,
    open: openBlockedSheet,
    close: closeBlockedSheet,
  } = useSheetAnimation();

  // Sincronizar materias
  useEffect(() => {
    if (materias.length > 0) {
      setLocalMaterias(materias);
    }
  }, [materias]);

  // Recalcular stats locales
  useEffect(() => {
    if (localMaterias.length > 0) {
      const aprobadas = localMaterias.filter(m => m.estado === 'aprobada').length;
      const regulares = localMaterias.filter(m => m.estado === 'regularizada').length;
      const cursando = localMaterias.filter(m => m.estado === 'pendiente').length;
      const restantes = localMaterias.filter(m => m.estado === 'bloqueada').length;
      const total = localMaterias.length;
      const porcentaje = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
      setLocalStats({ aprobadas, regulares, cursando, restantes, total, porcentaje });
    }
  }, [localMaterias]);

  // Recalcular cascada
  const recalcularCascada = useCallback((lista: MateriaSimulador[]): MateriaSimulador[] => {
    if (!lista.length) return [];
    let nuevaLista = [...lista];

    for (let i = 0; i < 3; i++) {
      nuevaLista = nuevaLista.map(materia => {
        if (materia.nivel === 1) {
          if (materia.estado === 'bloqueada') {
            return { ...materia, estado: 'pendiente' as EstadoVisual };
          }
          return materia;
        }

        const regularizadasCumplidas = materia.reqsRegularizadas.length === 0 ||
          materia.reqsRegularizadas.every(reqId => {
            const matRequisito = nuevaLista.find(m => m.id === reqId);
            return matRequisito && (matRequisito.estado === 'regularizada' || matRequisito.estado === 'aprobada');
          });

        const aprobadasCumplidas = materia.reqsAprobadas.length === 0 ||
          materia.reqsAprobadas.every(reqId => {
            const matRequisito = nuevaLista.find(m => m.id === reqId);
            return matRequisito && matRequisito.estado === 'aprobada';
          });

        const requisitosCumplidos = regularizadasCumplidas && aprobadasCumplidas;

        if (requisitosCumplidos) {
          if (materia.estado === 'bloqueada') {
            return { ...materia, estado: 'pendiente' as EstadoVisual };
          }
        } else {
          if (materia.estado !== 'aprobada' && materia.estado !== 'regularizada') {
            return { ...materia, estado: 'bloqueada' as EstadoVisual };
          }
        }
        return materia;
      });
    }
    return nuevaLista;
  }, []);

  // Handlers
  const handlePressNode = useCallback((materia: MateriaSimulador) => {
    if (materia.estado === 'bloqueada') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      const faltantesRegularizadas: CorrelativaFaltante[] = materia.reqsRegularizadas
        .map(reqId => localMaterias.find(m => m.id === reqId))
        .filter((m): m is MateriaSimulador =>
          m !== undefined && m.estado !== 'aprobada' && m.estado !== 'regularizada'
        )
        .map(m => ({ materia: m, tipoRequerido: 'regularizada' as const }));

      const faltantesAprobadas: CorrelativaFaltante[] = materia.reqsAprobadas
        .map(reqId => localMaterias.find(m => m.id === reqId))
        .filter((m): m is MateriaSimulador =>
          m !== undefined && m.estado !== 'aprobada'
        )
        .map(m => ({ materia: m, tipoRequerido: 'aprobada' as const }));

      const allFaltantes = [...faltantesRegularizadas];
      faltantesAprobadas.forEach(fa => {
        if (!allFaltantes.some(fr => fr.materia.id === fa.materia.id)) {
          allFaltantes.push(fa);
        }
      });

      setBlockedMateria(materia);
      setBlockedCorrelativas(allFaltantes);
      openBlockedSheet();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nuevoEstado = getNextEstado(materia.estado);
    const nuevasMaterias = localMaterias.map(m =>
      m.id === materia.id ? { ...m, estado: nuevoEstado } : m
    );
    setLocalMaterias(recalcularCascada(nuevasMaterias));
  }, [localMaterias, recalcularCascada, openBlockedSheet]);

  const handleLongPress = useCallback((materia: MateriaSimulador) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMateria(materia);
    openSheet();
  }, [openSheet]);

  const handleSheetChangeEstado = useCallback((nuevoEstado: EstadoVisual) => {
    if (!selectedMateria) return;
    const nuevasMaterias = localMaterias.map(m =>
      m.id === selectedMateria.id ? { ...m, estado: nuevoEstado } : m
    );
    setLocalMaterias(recalcularCascada(nuevasMaterias));
  }, [selectedMateria, localMaterias, recalcularCascada]);

  // Calcular dimensiones del canvas
  const { totalLevels, maxItemsPerLevel, canvasWidth, canvasHeight } = useMemo(() => {
    if (localMaterias.length === 0) {
      return { totalLevels: 5, maxItemsPerLevel: 8, canvasWidth: SCREEN_WIDTH, canvasHeight: 800 };
    }

    const niveles = new Set(localMaterias.map(m => m.nivel));
    const totalLevels = Math.max(...Array.from(niveles), 1);

    const porNivel: Record<number, number> = {};
    localMaterias.forEach(m => {
      porNivel[m.nivel] = (porNivel[m.nivel] || 0) + 1;
    });
    const maxItemsPerLevel = Math.max(...Object.values(porNivel), 1);

    const canvasWidth = Math.max(
      PADDING_X * 2 + maxItemsPerLevel * (NODE_SIZE + NODE_SPACING_X),
      SCREEN_WIDTH
    );
    const canvasHeight = PADDING_Y * 2 + totalLevels * (NODE_SIZE + NODE_SPACING_Y);

    return { totalLevels, maxItemsPerLevel, canvasWidth, canvasHeight };
  }, [localMaterias]);

  // Calcular posiciones de nodos
  const nodePositions = useMemo(() => {
    const positions = new Map<number, { left: number; top: number }>();
    const porNivel: Record<number, MateriaSimulador[]> = {};

    localMaterias.forEach(m => {
      if (!porNivel[m.nivel]) porNivel[m.nivel] = [];
      porNivel[m.nivel].push(m);
    });

    Object.entries(porNivel).forEach(([nivel, materias]) => {
      const nivelNum = parseInt(nivel);
      const totalWidth = materias.length * (NODE_SIZE + NODE_SPACING_X) - NODE_SPACING_X;
      const startX = (canvasWidth - totalWidth) / 2;

      materias.forEach((mat, idx) => {
        positions.set(mat.id, {
          left: startX + idx * (NODE_SIZE + NODE_SPACING_X),
          top: PADDING_Y + (nivelNum - 1) * (NODE_SIZE + NODE_SPACING_Y),
        });
      });
    });

    return positions;
  }, [localMaterias, canvasWidth]);

  // Renderizar conexiones
  const renderConnections = useMemo(() => {
    if (!localMaterias.length) return null;

    let connectionIndex = 0;
    const connections: React.ReactNode[] = [];

    localMaterias.forEach(materia => {
      materia.reqs.forEach(reqId => {
        const requisito = localMaterias.find(m => m.id === reqId);
        if (!requisito) return;

        const fromPos = nodePositions.get(requisito.id);
        const toPos = nodePositions.get(materia.id);
        if (!fromPos || !toPos) return;

        const x1 = fromPos.left + NODE_SIZE / 2;
        const y1 = fromPos.top + NODE_SIZE;
        const x2 = toPos.left + NODE_SIZE / 2;
        const y2 = toPos.top;

        const isActive = requisito.estado === 'aprobada' || requisito.estado === 'regularizada';

        connections.push(
          <Connection
            key={`${reqId}-${materia.id}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            isActive={isActive}
            index={connectionIndex++}
            inactiveColor={dynamicColors.lineaInactiva}
          />
        );
      });
    });

    return connections;
  }, [localMaterias, nodePositions, dynamicColors.lineaInactiva]);

  // Loading
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: dynamicColors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={dynamicColors.background} />
        <ActivityIndicator size="large" color={dynamicColors.pendiente} />
        <Text style={[styles.loadingText, { color: dynamicColors.textTertiary }]}>Cargando plan de estudios...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: dynamicColors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={dynamicColors.background} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color={dynamicColors.regularizada} />
          </View>
          <Text style={[styles.errorTitle, { color: dynamicColors.textPrimary }]}>No se pudo cargar</Text>
          <Text style={[styles.errorText, { color: dynamicColors.textTertiary }]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dynamicColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header con Blur */}
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.header, { paddingTop: insets.top, borderBottomColor: dynamicColors.separator }]}>
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={dynamicColors.pendiente} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: dynamicColors.textPrimary }]}>Simulador</Text>
            <Text style={[styles.headerSubtitle, { color: dynamicColors.textTertiary }]}>{localStats.total} materias</Text>
          </View>

          <Pressable
            onPress={refetch}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={24} color={dynamicColors.pendiente} />
          </Pressable>
        </View>

        <StatsBar stats={localStats} isDark={isDark} />

        {/* Banner de simulación */}
        <View style={styles.simulationBanner}>
          <Ionicons name="flask-outline" size={14} color={dynamicColors.regularizada} />
          <Text style={styles.simulationText}>Modo simulación · Los cambios no se guardan</Text>
        </View>
      </BlurView>

      {/* Canvas con árbol de correlativas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 180 + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ minWidth: canvasWidth }}
        >
          <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
            {/* Etiquetas de nivel */}
            {Array.from({ length: totalLevels }, (_, i) => (
              <View
                key={`level-${i + 1}`}
                style={[
                  styles.levelLabel,
                  {
                    top: PADDING_Y + i * (NODE_SIZE + NODE_SPACING_Y) + NODE_SIZE / 2 - 12,
                    backgroundColor: dynamicColors.backgroundSecondary,
                  }
                ]}
              >
                <Text style={[styles.levelLabelText, { color: dynamicColors.textTertiary }]}>{i + 1}°</Text>
              </View>
            ))}

            {/* Conexiones SVG */}
            <Svg
              width={canvasWidth}
              height={canvasHeight}
              style={styles.svgConnections}
            >
              {renderConnections}
            </Svg>

            {/* Nodos */}
            {localMaterias.map(materia => {
              const pos = nodePositions.get(materia.id);
              if (!pos) return null;

              return (
                <MateriaNode
                  key={materia.id}
                  materia={materia}
                  left={pos.left}
                  top={pos.top}
                  onPress={() => handlePressNode(materia)}
                  onLongPress={() => handleLongPress(materia)}
                  isDark={isDark}
                />
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Leyenda flotante */}
      <View style={[styles.legend, { bottom: insets.bottom + 16 }]}>
        <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.legendBlur}>
          <View style={styles.legendContent}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SIMULADOR_COLORS.aprobada }]} />
              <Text style={[styles.legendText, { color: dynamicColors.textSecondary }]}>Aprobada</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SIMULADOR_COLORS.regularizada }]} />
              <Text style={[styles.legendText, { color: dynamicColors.textSecondary }]}>Regular</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SIMULADOR_COLORS.pendiente }]} />
              <Text style={[styles.legendText, { color: dynamicColors.textSecondary }]}>Disponible</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SIMULADOR_COLORS.bloqueada }]} />
              <Text style={[styles.legendText, { color: dynamicColors.textSecondary }]}>Bloqueada</Text>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Sheets */}
      <MateriaDetailSheet
        materia={selectedMateria}
        allMaterias={localMaterias}
        visible={sheetVisible}
        sheetAnim={sheetAnim}
        overlayOpacity={overlayOpacity}
        onClose={closeSheet}
        onChangeEstado={handleSheetChangeEstado}
        isDark={isDark}
      />

      <BlockedMateriaSheet
        materia={blockedMateria}
        correlativasFaltantes={blockedCorrelativas}
        visible={blockedSheetVisible}
        sheetAnim={blockedSheetAnim}
        overlayOpacity={blockedOverlayOpacity}
        onClose={closeBlockedSheet}
        isDark={isDark}
      />
    </View>
  );
}

export default function SimuladorScreen() {
  return (
    <PremiumGate featureName="Simulador de Correlativas">
      <SimuladorContent />
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: SIMULADOR_COLORS.aprobada,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  percentageText: {
    fontSize: 17,
    fontWeight: '700',
    color: SIMULADOR_COLORS.aprobada,
    marginLeft: 'auto',
  },

  // Simulation Banner
  simulationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    paddingVertical: 8,
    gap: 6,
  },
  simulationText: {
    fontSize: 12,
    color: SIMULADOR_COLORS.regularizada,
    fontWeight: '500',
  },

  // Canvas
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  canvas: {
    position: 'relative',
  },
  svgConnections: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },

  // Level Labels
  levelLabel: {
    position: 'absolute',
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  levelLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Nodes
  nodeWrapper: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    zIndex: 1,
  },
  nodeContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  nodePressed: {
    shadowOpacity: 0.02,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 9,
    fontWeight: '600',
  },

  // Legend
  legend: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 50,
  },
  legendBlur: {
    borderRadius: 16,
  },
  legendContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Loading & Error
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: SIMULADOR_COLORS.pendiente,
    borderRadius: 14,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
