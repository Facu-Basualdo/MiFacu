import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
// Zoom deshabilitado temporalmente para estabilidad
// import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useSimuladorData, MateriaSimulador, SimuladorStats } from '../src/hooks/useSimuladorData';
import { useSheetAnimation } from '../src/hooks/useSheetAnimation';
import { MateriaDetailSheet } from '../src/components/simulador/MateriaDetailSheet';
import { ProgressStats } from '../src/components/simulador/ProgressStats';
import { BlockedMateriaSheet, CorrelativaFaltante } from '../src/components/simulador/BlockedMateriaSheet';
import {
  SIMULADOR_COLORS,
  getEstadoConfig,
  getNextEstado,
  EstadoVisual,
} from '../src/utils/estadoMapper';

// --- CONFIGURACION VISUAL ---
const COL_WIDTH = 120; // Aumentado para mejor accesibilidad
const ROW_HEIGHT = 180;
const MARGIN_X = 25;
const OFFSET_X = 20;
const OFFSET_Y = 40;

const TOTAL_LEVELS = 5;
const ITEMS_PER_LEVEL = 9; // Nivel 2 tiene 9 materias (el máximo)

const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- COMPONENTE CABLE ---
interface CableProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive: boolean;
}

const CableConector = ({ x1, y1, x2, y2, isActive }: CableProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isActive ? 1 : 0,
      duration: isActive ? 1200 : 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const verticalGap = y2 - y1;
  const controlY1 = y1 + verticalGap * 0.5;
  const controlY2 = y2 - verticalGap * 0.5;
  const d = `M${x1},${y1} C${x1},${controlY1} ${x2},${controlY2} ${x2},${y2}`;

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1500, 0],
  });

  return (
    <>
      <Path d={d} stroke={SIMULADOR_COLORS.lineaInactiva} strokeWidth="2" fill="none" />
      <AnimatedPath
        d={d}
        stroke={SIMULADOR_COLORS.aprobada}
        strokeWidth="3"
        strokeDasharray={1500}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="none"
        opacity={isActive ? 1 : 0}
      />
      {isActive && <Circle cx={x2} cy={y2} r="3" fill={SIMULADOR_COLORS.aprobada} />}
    </>
  );
};

export default function PlanMapaScreen() {
  const router = useRouter();

  // Hook de datos
  const {
    materias,
    stats,
    loading,
    error,
    isLoggedIn,
    refetch,
    updateMateriaEstado,
  } = useSimuladorData();

  // Estado local para el canvas
  const [localMaterias, setLocalMaterias] = useState<MateriaSimulador[]>([]);

  // Estado local para estadísticas (se actualiza con las simulaciones)
  const [localStats, setLocalStats] = useState<SimuladorStats>(stats);

  // Sheet de detalle
  const [selectedMateria, setSelectedMateria] = useState<MateriaSimulador | null>(null);
  const { visible: sheetVisible, sheetAnim, overlayOpacity, open: openSheet, close: closeSheet } = useSheetAnimation();

  // Sheet de materia bloqueada
  const [blockedMateria, setBlockedMateria] = useState<MateriaSimulador | null>(null);
  const [blockedCorrelativas, setBlockedCorrelativas] = useState<CorrelativaFaltante[]>([]);
  const {
    visible: blockedSheetVisible,
    sheetAnim: blockedSheetAnim,
    overlayOpacity: blockedOverlayOpacity,
    open: openBlockedSheet,
    close: closeBlockedSheet
  } = useSheetAnimation();


  // Sincronizar materias del hook con estado local
  useEffect(() => {
    if (materias.length > 0) {
      setLocalMaterias(materias);
    }
  }, [materias]);

  // Recalcular estadísticas locales cuando localMaterias cambie
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

  // Recalcular cascada localmente (misma lógica que el hook)
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

        // Verificar requisitos de materias REGULARIZADAS (pueden estar regularizadas o aprobadas)
        const regularizadasCumplidas = materia.reqsRegularizadas.length === 0 ||
          materia.reqsRegularizadas.every(reqId => {
            const matRequisito = nuevaLista.find(m => m.id === reqId);
            return matRequisito && (matRequisito.estado === 'regularizada' || matRequisito.estado === 'aprobada');
          });

        // Verificar requisitos de materias APROBADAS (deben estar aprobadas con final)
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

  // Handler para tap en nodo (ciclo de estados)
  const handlePressNode = useCallback((materia: MateriaSimulador) => {
    // Si está bloqueada, mostrar el sheet con las correlativas faltantes
    if (materia.estado === 'bloqueada') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Obtener correlativas faltantes que necesitan estar REGULARIZADAS
      const faltantesRegularizadas: CorrelativaFaltante[] = materia.reqsRegularizadas
        .map(reqId => localMaterias.find(m => m.id === reqId))
        .filter((m): m is MateriaSimulador =>
          m !== undefined && m.estado !== 'aprobada' && m.estado !== 'regularizada'
        )
        .map(m => ({ materia: m, tipoRequerido: 'regularizada' as const }));

      // Obtener correlativas faltantes que necesitan estar APROBADAS
      const faltantesAprobadas: CorrelativaFaltante[] = materia.reqsAprobadas
        .map(reqId => localMaterias.find(m => m.id === reqId))
        .filter((m): m is MateriaSimulador =>
          m !== undefined && m.estado !== 'aprobada'
        )
        .map(m => ({ materia: m, tipoRequerido: 'aprobada' as const }));

      // Combinar ambas listas (evitando duplicados mostrando solo el requisito más estricto)
      const allFaltantes = [...faltantesRegularizadas];
      faltantesAprobadas.forEach(fa => {
        // Si ya existe en regularizadas, no la agregamos (mostrar solo una vez)
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

    // NOTA: No sincronizamos con API - el simulador es solo temporal
  }, [localMaterias, recalcularCascada, updateMateriaEstado, openBlockedSheet]);

  // Handler para long press (abrir sheet)
  const handleLongPress = useCallback((materia: MateriaSimulador) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMateria(materia);
    openSheet();
  }, [openSheet]);

  // Handler para cambio de estado desde sheet
  const handleSheetChangeEstado = useCallback((nuevoEstado: EstadoVisual) => {
    if (!selectedMateria) return;

    const nuevasMaterias = localMaterias.map(m =>
      m.id === selectedMateria.id ? { ...m, estado: nuevoEstado } : m
    );
    setLocalMaterias(recalcularCascada(nuevasMaterias));
    // NOTA: No sincronizamos con API - el simulador es solo temporal
  }, [selectedMateria, localMaterias, recalcularCascada, updateMateriaEstado]);


  // Render conexiones
  const renderConnections = () => {
    if (!localMaterias.length) return null;
    const cables: React.ReactNode[] = [];

    localMaterias.forEach(materia => {
      materia.reqs.forEach(reqId => {
        const requisito = localMaterias.find(m => m.id === reqId);
        if (!requisito) return;

        const x1 = OFFSET_X + (requisito.col * (COL_WIDTH + MARGIN_X)) + (COL_WIDTH / 2);
        const y1 = OFFSET_Y + ((requisito.nivel - 1) * ROW_HEIGHT) + COL_WIDTH;
        const x2 = OFFSET_X + (materia.col * (COL_WIDTH + MARGIN_X)) + (COL_WIDTH / 2);
        const y2 = OFFSET_Y + ((materia.nivel - 1) * ROW_HEIGHT);

        const isActive = requisito.estado === 'aprobada' || requisito.estado === 'regularizada';

        cables.push(
          <CableConector
            key={`${reqId}-${materia.id}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            isActive={isActive}
          />
        );
      });
    });
    return cables;
  };

  // Render nodos
  const renderNodes = () => {
    if (!localMaterias.length) return null;

    return localMaterias.map((materia) => {
      const left = OFFSET_X + (materia.col * (COL_WIDTH + MARGIN_X));
      const top = OFFSET_Y + ((materia.nivel - 1) * ROW_HEIGHT);

      const config = getEstadoConfig(materia.estado);
      const borderColor = config.color;
      const bgColor = config.bgColor;
      const icon = config.icon;
      const iconColor = config.iconColor;
      const shadowColor = materia.estado === 'aprobada' || materia.estado === 'regularizada'
        ? config.color : 'transparent';

      return (
        <TouchableOpacity
          key={materia.id}
          style={[
            styles.nodeContainer,
            {
              left,
              top,
              borderColor,
              backgroundColor: bgColor,
              shadowColor,
              elevation: shadowColor !== 'transparent' ? 10 : 0,
            }
          ]}
          onPress={() => handlePressNode(materia)}
          onLongPress={() => handleLongPress(materia)}
          delayLongPress={400}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={`${materia.nombre}, ${config.label}`}
          accessibilityHint={materia.estado === 'bloqueada'
            ? 'Materia bloqueada, completa las correlativas primero'
            : 'Toca para cambiar estado, manten presionado para ver detalles'}
          accessibilityRole="button"
        >
          <View style={{ marginBottom: 6 }}>
            <Ionicons name={icon} size={26} color={iconColor} />
          </View>
          <Text
            style={[styles.nodeText, { color: materia.estado === 'bloqueada' ? '#555' : borderColor }]}
            numberOfLines={3}
          >
            {materia.nombre}
          </Text>
          <View style={[styles.levelBadge, { borderColor: materia.estado === 'bloqueada' ? '#333' : borderColor }]}>
            <Text style={[styles.levelText, { color: materia.estado === 'bloqueada' ? '#444' : borderColor }]}>
              {materia.nivel}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor={SIMULADOR_COLORS.fondo} />
        <ActivityIndicator size="large" color={SIMULADOR_COLORS.aprobada} />
        <Text style={styles.loadingText}>Cargando plan de estudios...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor={SIMULADOR_COLORS.fondo} />
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canvasWidth = OFFSET_X + ((COL_WIDTH + MARGIN_X) * ITEMS_PER_LEVEL) + OFFSET_X;
  const canvasHeight = OFFSET_Y + (ROW_HEIGHT * TOTAL_LEVELS);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={SIMULADOR_COLORS.fondo} />

      {/* Header */}
      <View style={styles.hudHeader}>
        <TouchableOpacity
          onPress={() => {
            refetch(); // Resetear a datos reales al salir
            router.back();
          }}
          style={styles.backBtn}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={SIMULADOR_COLORS.aprobada} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <ProgressStats stats={localStats} compact />
        </View>

        <TouchableOpacity
          onPress={refetch}
          style={styles.refreshBtn}
          accessibilityLabel="Actualizar"
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={24} color={SIMULADOR_COLORS.aprobada} />
        </TouchableOpacity>
      </View>

      {/* Banner de Modo Simulación - siempre visible */}
      <View style={styles.guestBanner}>
        <Ionicons name="flask" size={16} color="#FFD700" />
        <Text style={styles.guestBannerText}>
          🧪 Modo Simulación - Los cambios NO se guardarán
        </Text>
      </View>

      {/* Canvas */}
      <ScrollView style={styles.verticalScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScrollView horizontal style={styles.horizontalScroll}>
          <View
            style={[
              styles.canvas,
              {
                width: canvasWidth,
                height: canvasHeight,
              }
            ]}
          >
            <Svg
              height={canvasHeight}
              width={canvasWidth}
              style={styles.svgLayer}
            >
              {renderConnections()}
            </Svg>
            {renderNodes()}
          </View>
        </ScrollView>
      </ScrollView>


      {/* Sheet de detalle */}
      <MateriaDetailSheet
        materia={selectedMateria}
        allMaterias={localMaterias}
        visible={sheetVisible}
        sheetAnim={sheetAnim}
        overlayOpacity={overlayOpacity}
        onClose={closeSheet}
        onChangeEstado={handleSheetChangeEstado}
      />

      {/* Sheet de materia bloqueada */}
      <BlockedMateriaSheet
        materia={blockedMateria}
        correlativasFaltantes={blockedCorrelativas}
        visible={blockedSheetVisible}
        sheetAnim={blockedSheetAnim}
        overlayOpacity={blockedOverlayOpacity}
        onClose={closeBlockedSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIMULADOR_COLORS.fondo,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(5, 10, 16, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  guestBannerText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  verticalScroll: {
    flex: 1,
  },
  horizontalScroll: {
    flex: 1,
  },
  canvas: {
    position: 'relative',
  },
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  nodeContainer: {
    position: 'absolute',
    width: COL_WIDTH,
    height: COL_WIDTH,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    zIndex: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  nodeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  levelBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: SIMULADOR_COLORS.fondo,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: SIMULADOR_COLORS.aprobada,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
