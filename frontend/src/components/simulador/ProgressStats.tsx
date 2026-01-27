import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { SIMULADOR_COLORS } from '../../utils/estadoMapper';
import { SimuladorStats } from '../../hooks/useSimuladorData';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressStatsProps {
  stats: SimuladorStats;
  compact?: boolean;
}

/**
 * Componente de estadísticas de progreso para el simulador
 */
export function ProgressStats({ stats, compact = false }: ProgressStatsProps) {
  const { aprobadas, regulares, cursando, restantes, total, porcentaje } = stats;

  const size = compact ? 80 : 100;
  const strokeWidth = compact ? 6 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: porcentaje,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [porcentaje, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Circular Progress */}
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#222"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={SIMULADOR_COLORS.aprobada}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.compactPercentage}>{porcentaje}%</Text>
          </View>
        </View>

        {/* Stats compactos */}
        <View style={styles.compactStats}>
          <StatItem color={SIMULADOR_COLORS.aprobada} label="Apr" value={aprobadas} compact />
          <StatItem color={SIMULADOR_COLORS.regularizada} label="Reg" value={regulares} compact />
          <StatItem color="#fff" label="Curs" value={cursando} compact />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={styles.progressContainer}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#222"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={SIMULADOR_COLORS.aprobada}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.percentage}>{porcentaje}%</Text>
            <Text style={styles.label}>Carrera</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatItem color={SIMULADOR_COLORS.aprobada} label="Aprobadas" value={aprobadas} />
        <StatItem color={SIMULADOR_COLORS.regularizada} label="Regulares" value={regulares} />
        <StatItem color="#fff" label="Cursando" value={cursando} />
        <StatItem color="#666" label="Restantes" value={restantes} />
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Plan de Estudios</Text>
        <Text style={styles.totalValue}>{total} materias</Text>
      </View>
    </View>
  );
}

interface StatItemProps {
  color: string;
  label: string;
  value: number;
  compact?: boolean;
}

function StatItem({ color, label, value, compact }: StatItemProps) {
  if (compact) {
    return (
      <View style={styles.compactStatItem}>
        <View style={[styles.statDot, { backgroundColor: color }]} />
        <Text style={styles.compactStatValue}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.statItem}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 15, 20, 0.9)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  percentage: {
    color: SIMULADOR_COLORS.aprobada,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  label: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    gap: 8,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  totalValue: {
    color: SIMULADOR_COLORS.aprobada,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  // Estilos compactos
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactPercentage: {
    color: SIMULADOR_COLORS.aprobada,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  compactStats: {
    flexDirection: 'row',
    gap: 12,
  },
  compactStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactStatValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
