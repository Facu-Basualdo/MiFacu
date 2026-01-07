import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// --- CONFIGURACIÓN VISUAL ---
const COL_WIDTH = 110;
const ROW_HEIGHT = 180;
const MARGIN_X = 25;
const OFFSET_X = 20;
const OFFSET_Y = 40;

const TOTAL_LEVELS = 5;
const ITEMS_PER_LEVEL = 8; // Ancho de 8 para soportar 1er año del Plan 2023

const COLORS = {
  aprobada: '#00ff9d',     
  regularizada: '#FFD700', 
  pendiente: '#FFFFFF',    
  bloqueada: '#1a1a1a',    
  fondo: '#050a10',
  lineaInactiva: '#222'
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- COMPONENTE CABLE ---
const CableConector = ({ x1, y1, x2, y2, isActive }) => {
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
      <Path d={d} stroke={COLORS.lineaInactiva} strokeWidth="2" fill="none" />
      <AnimatedPath
        d={d}
        stroke={COLORS.aprobada}
        strokeWidth="3"
        strokeDasharray={1500}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="none"
        opacity={isActive ? 1 : 0}
      />
      {isActive && <Circle cx={x2} cy={y2} r="3" fill={COLORS.aprobada} />}
    </>
  );
};

// --- PLAN DE ESTUDIOS 2023 REAL (Extraído de tu PDF) ---
const PLAN_ESTUDIOS = [
  // --- NIVEL 1 (8 Materias) ---
  { id: 1, nombre: "Análisis Mat. I", nivel: 1, col: 0, reqs: [] },
  { id: 2, nombre: "Álgebra y Geom.", nivel: 1, col: 1, reqs: [] },
  { id: 3, nombre: "Física I", nivel: 1, col: 2, reqs: [] },
  { id: 4, nombre: "Algoritmos y ED", nivel: 1, col: 3, reqs: [] }, // Troncal
  { id: 5, nombre: "Arq. Computad.", nivel: 1, col: 4, reqs: [] },
  { id: 6, nombre: "Sist. y Proc. Neg.", nivel: 1, col: 5, reqs: [] }, 
  { id: 7, nombre: "Lógica y Est. D.", nivel: 1, col: 6, reqs: [] },
  { id: 8, nombre: "Inglés I", nivel: 1, col: 7, reqs: [] },

  // --- NIVEL 2 ---
  { id: 9, nombre: "Análisis Mat. II", nivel: 2, col: 0, reqs: [1, 2] }, // AMI + Algebra
  { id: 10, nombre: "Física II", nivel: 2, col: 1, reqs: [1, 3] }, // AMI + Fisica I
  { id: 11, nombre: "Sintaxis y Sem.", nivel: 2, col: 2, reqs: [7, 4] }, // Logica + Algoritmos
  { id: 12, nombre: "Paradigmas Pr.", nivel: 2, col: 3, reqs: [7, 4] }, // Logica + Algoritmos
  { id: 13, nombre: "Sist. Operativos", nivel: 2, col: 4, reqs: [5] }, // Arquitectura
  { id: 14, nombre: "Análisis Sist.", nivel: 2, col: 5, reqs: [6, 4] }, // SyO + Algoritmos
  { id: 15, nombre: "Ing. y Sociedad", nivel: 2, col: 6, reqs: [] }, // Flotante
  { id: 16, nombre: "Inglés II", nivel: 2, col: 7, reqs: [8] }, // Ingles I

  // --- NIVEL 3 ---
  { id: 17, nombre: "Probabilidad", nivel: 3, col: 0, reqs: [9, 2] }, // AMII + Algebra
  { id: 18, nombre: "Comunicaciones", nivel: 3, col: 1, reqs: [9, 10] }, // AMII + Fisica II
  { id: 19, nombre: "Gestión Datos", nivel: 3, col: 2, reqs: [14, 11] }, // Analisis + Sintaxis
  { id: 20, nombre: "Diseño de Sist.", nivel: 3, col: 5, reqs: [14, 12] }, // Analisis + Paradigmas
  { id: 21, nombre: "Economía", nivel: 3, col: 6, reqs: [] },

  // --- NIVEL 4 ---
  { id: 22, nombre: "Simulación", nivel: 4, col: 0, reqs: [17] }, // Proba
  { id: 23, nombre: "Teoría de Control", nivel: 4, col: 1, reqs: [9, 10] }, 
  { id: 24, nombre: "Redes de Info", nivel: 4, col: 2, reqs: [13, 18] }, // SO + Comunicaciones
  { id: 25, nombre: "Adm. de Recursos", nivel: 4, col: 5, reqs: [20, 26] }, // Diseño + IO
  { id: 26, nombre: "Inv. Operativa", nivel: 4, col: 6, reqs: [17] }, // Proba
  { id: 27, nombre: "Ing. Software", nivel: 4, col: 3, reqs: [17, 20, 19] }, // Proba + Diseño + Datos

  // --- NIVEL 5 ---
  { id: 28, nombre: "Inteligencia Art.", nivel: 5, col: 0, reqs: [22, 26] }, // Simulacion + IO
  { id: 29, nombre: "Proyecto Final", nivel: 5, col: 3, reqs: [27, 24, 25] }, // Ing Soft + Redes + Adm Rec
  { id: 30, nombre: "Sist. de Gestión", nivel: 5, col: 5, reqs: [26, 25] }, // IO + Adm Rec
  { id: 31, nombre: "Legislación", nivel: 5, col: 6, reqs: [15] }, // Ing y Soc
  { id: 32, nombre: "Adm. Gerencial", nivel: 5, col: 7, reqs: [25] }, // Adm Rec
];

export default function PlanMapaScreen() {
  const router = useRouter();
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    // Inicialización
    const dataInicial = PLAN_ESTUDIOS.map(m => ({
      ...m,
      estado: m.nivel === 1 ? 'pendiente' : 'bloqueada'
    }));
    setMaterias(recalcularCascada(dataInicial));
  }, []);

  const recalcularCascada = (lista) => {
    if (!lista) return [];
    let nuevaLista = [...lista];
    
    // 3 pasadas para asegurar propagación
    for (let i = 0; i < 3; i++) {
        nuevaLista = nuevaLista.map(materia => {
            if (materia.nivel === 1) {
                if (materia.estado === 'bloqueada') return { ...materia, estado: 'pendiente' };
                return materia;
            }

            const requisitosCumplidos = materia.reqs.every(reqId => {
                const matRequisito = nuevaLista.find(m => m.id === reqId);
                return matRequisito && (matRequisito.estado === 'aprobada' || matRequisito.estado === 'regularizada');
            });

            if (requisitosCumplidos) {
                if (materia.estado === 'bloqueada') return { ...materia, estado: 'pendiente' };
            } else {
                if (materia.estado !== 'aprobada' && materia.estado !== 'regularizada') {
                    return { ...materia, estado: 'bloqueada' };
                }
            }
            return materia;
        });
    }
    return nuevaLista;
  };

  const handlePressNode = (materia) => {
    if (materia.estado === 'bloqueada') return;

    let nuevoEstado = 'pendiente';
    if (materia.estado === 'pendiente') nuevoEstado = 'regularizada';
    else if (materia.estado === 'regularizada') nuevoEstado = 'aprobada';
    else if (materia.estado === 'aprobada') nuevoEstado = 'pendiente';

    const nuevasMaterias = materias.map(m => 
      m.id === materia.id ? { ...m, estado: nuevoEstado } : m
    );
    setMaterias(recalcularCascada(nuevasMaterias));
  };

  const renderConnections = () => {
    if (!materias) return null;
    const cables = [];
    
    materias.forEach(materia => {
      materia.reqs.forEach(reqId => {
        const requisito = materias.find(m => m.id === reqId);
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

  const renderNodes = () => {
    if (!materias) return null;

    return materias.map((materia) => {
      const left = OFFSET_X + (materia.col * (COL_WIDTH + MARGIN_X));
      const top = OFFSET_Y + ((materia.nivel - 1) * ROW_HEIGHT);

      let borderColor = COLORS.bloqueada;
      let bgColor = '#111';
      let icon = "lock-closed";
      let shadowColor = 'transparent';
      let iconColor = '#444';

      if (materia.estado === 'aprobada') {
        borderColor = COLORS.aprobada;
        bgColor = 'rgba(0, 255, 157, 0.15)';
        icon = "checkmark-done";
        iconColor = COLORS.aprobada;
        shadowColor = COLORS.aprobada;
      } else if (materia.estado === 'regularizada') {
        borderColor = COLORS.regularizada;
        bgColor = 'rgba(255, 215, 0, 0.1)';
        icon = "checkmark"; 
        iconColor = COLORS.regularizada;
        shadowColor = COLORS.regularizada;
      } else if (materia.estado === 'pendiente') {
        borderColor = COLORS.pendiente;
        bgColor = '#222';
        icon = "lock-open-outline";
        iconColor = '#fff';
      } else {
        borderColor = '#333';
        bgColor = '#080808';
        iconColor = '#333';
      }

      return (
        <TouchableOpacity
          key={materia.id}
          style={[
            styles.nodeContainer, 
            { left, top, borderColor, backgroundColor: bgColor, shadowColor, elevation: shadowColor !== 'transparent' ? 10 : 0 }
          ]}
          onPress={() => handlePressNode(materia)}
          onLongPress={() => {
             if(materia.estado !== 'bloqueada') router.push({ pathname: '/detalle-materia', params: { ...materia } });
          }}
          activeOpacity={0.8}
        >
          <View style={{marginBottom: 6}}>
            <Ionicons name={icon} size={26} color={iconColor} />
          </View>
          <Text style={[styles.nodeText, { color: materia.estado === 'bloqueada' ? '#555' : borderColor }]} numberOfLines={3}>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.fondo} />

      <View style={styles.hudHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.aprobada} />
        </TouchableOpacity>
        <View>
           <Text style={styles.hudTitle}>INGENIERÍA EN SISTEMAS</Text>
           <Text style={styles.hudSubtitle}>SIMULADOR DE PLAN DE ESTUDIOS</Text>
        </View>
        <Ionicons name="git-network-outline" size={28} color={COLORS.aprobada} />
      </View>

      <ScrollView style={styles.verticalScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScrollView horizontal style={styles.horizontalScroll}>
          <View style={styles.canvas}>
            <Svg 
              height={OFFSET_Y + (ROW_HEIGHT * TOTAL_LEVELS)} 
              width={OFFSET_X + ((COL_WIDTH + MARGIN_X) * ITEMS_PER_LEVEL) + OFFSET_X} 
              style={styles.svgLayer}
            >
              {renderConnections()}
            </Svg>
            {renderNodes()}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  hudHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: 'rgba(5, 10, 16, 0.95)', borderBottomWidth: 1, borderBottomColor: '#333', zIndex: 10
  },
  hudTitle: { color: COLORS.aprobada, fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  hudSubtitle: { color: '#888', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
  verticalScroll: { flex: 1 },
  horizontalScroll: { flex: 1 },
  canvas: {
    width: OFFSET_X + ((COL_WIDTH + MARGIN_X) * ITEMS_PER_LEVEL) + OFFSET_X, 
    height: OFFSET_Y + (ROW_HEIGHT * TOTAL_LEVELS),
    position: 'relative'
  },
  svgLayer: { position: 'absolute', top: 0, left: 0, zIndex: 0 },
  nodeContainer: {
    position: 'absolute', width: COL_WIDTH, height: COL_WIDTH,
    borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 5,
    zIndex: 1, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10
  },
  nodeText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', fontFamily: 'monospace' },
  levelBadge: {
    position: 'absolute', top: -8, right: -8, backgroundColor: COLORS.fondo, width: 22, height: 22,
    borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center'
  },
  levelText: { fontSize: 10, fontWeight: 'bold' }
});