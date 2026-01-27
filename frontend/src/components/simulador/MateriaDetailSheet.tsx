import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MateriaSimulador } from '../../hooks/useSimuladorData';
import { SIMULADOR_COLORS, getEstadoConfig, EstadoVisual } from '../../utils/estadoMapper';

interface MateriaDetailSheetProps {
  materia: MateriaSimulador | null;
  allMaterias: MateriaSimulador[];
  visible: boolean;
  sheetAnim: Animated.Value;
  overlayOpacity: Animated.Value;
  onClose: () => void;
  onChangeEstado: (nuevoEstado: EstadoVisual) => void;
}

export function MateriaDetailSheet({
  materia,
  allMaterias,
  visible,
  sheetAnim,
  overlayOpacity,
  onClose,
  onChangeEstado,
}: MateriaDetailSheetProps) {
  if (!visible || !materia) return null;

  const estadoConfig = getEstadoConfig(materia.estado);

  // Obtener correlativas con su estado
  const correlativas = materia.reqs.map(reqId => {
    const correlativa = allMaterias.find(m => m.id === reqId);
    return correlativa;
  }).filter(Boolean) as MateriaSimulador[];

  const correlativasCumplidas = correlativas.filter(
    c => c.estado === 'aprobada' || c.estado === 'regularizada'
  );
  const correlativasFaltantes = correlativas.filter(
    c => c.estado !== 'aprobada' && c.estado !== 'regularizada'
  );

  const handleAprobar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChangeEstado('aprobada');
    onClose();
  };

  const handleRegularizar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChangeEstado('regularizada');
    onClose();
  };

  const handlePendiente = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeEstado('pendiente');
    onClose();
  };

  const backdropStyle = {
    opacity: overlayOpacity,
  };

  const sheetStyle = {
    transform: [{ translateY: sheetAnim }],
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, backdropStyle]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, sheetStyle]}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityLabel="Cerrar"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color="#888" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Materia</Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Nombre y Estado */}
              <View style={styles.materiaInfo}>
                <Text style={styles.materiaNombre}>{materia.nombre}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: estadoConfig.bgColor, borderColor: estadoConfig.color }]}>
                  <Ionicons name={estadoConfig.icon} size={16} color={estadoConfig.iconColor} />
                  <Text style={[styles.estadoText, { color: estadoConfig.color }]}>
                    {estadoConfig.label}
                  </Text>
                </View>
                <Text style={styles.nivelText}>Nivel {materia.nivel}</Text>
              </View>

              {/* Correlativas */}
              <ScrollView style={styles.correlativasContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>CORRELATIVAS</Text>

                {correlativas.length === 0 ? (
                  <View style={styles.noCorrelativas}>
                    <Ionicons name="checkmark-circle" size={32} color={SIMULADOR_COLORS.aprobada} />
                    <Text style={styles.noCorrelativasText}>Sin correlativas</Text>
                    <Text style={styles.noCorrelativasSubtext}>
                      Podes cursar esta materia sin requisitos previos
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Correlativas Faltantes */}
                    {correlativasFaltantes.length > 0 && (
                      <View style={styles.correlativasSection}>
                        <Text style={styles.correlativasSectionTitle}>
                          <Ionicons name="lock-closed" size={14} color="#ff4444" /> Faltantes ({correlativasFaltantes.length})
                        </Text>
                        {correlativasFaltantes.map(c => (
                          <View key={c.id} style={styles.correlativaItem}>
                            <Ionicons name="close-circle" size={20} color="#ff4444" />
                            <Text style={styles.correlativaText}>{c.nombre}</Text>
                            <Text style={[styles.correlativaEstado, { color: getEstadoConfig(c.estado).color }]}>
                              {getEstadoConfig(c.estado).label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Correlativas Cumplidas */}
                    {correlativasCumplidas.length > 0 && (
                      <View style={styles.correlativasSection}>
                        <Text style={styles.correlativasSectionTitle}>
                          <Ionicons name="checkmark-circle" size={14} color={SIMULADOR_COLORS.aprobada} /> Cumplidas ({correlativasCumplidas.length})
                        </Text>
                        {correlativasCumplidas.map(c => (
                          <View key={c.id} style={styles.correlativaItem}>
                            <Ionicons name="checkmark-circle" size={20} color={SIMULADOR_COLORS.aprobada} />
                            <Text style={styles.correlativaText}>{c.nombre}</Text>
                            <Text style={[styles.correlativaEstado, { color: getEstadoConfig(c.estado).color }]}>
                              {getEstadoConfig(c.estado).label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              {/* Botones de Acción */}
              {materia.estado !== 'bloqueada' && (
                <View style={styles.actions}>
                  {materia.estado !== 'aprobada' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.aprobarButton]}
                      onPress={handleAprobar}
                      accessibilityLabel="Marcar como aprobada"
                      accessibilityRole="button"
                    >
                      <Ionicons name="checkmark-done" size={20} color="#000" />
                      <Text style={styles.actionButtonTextDark}>Aprobar</Text>
                    </TouchableOpacity>
                  )}

                  {materia.estado !== 'regularizada' && materia.estado !== 'aprobada' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.regularButton]}
                      onPress={handleRegularizar}
                      accessibilityLabel="Marcar como regularizada"
                      accessibilityRole="button"
                    >
                      <Ionicons name="checkmark" size={20} color="#000" />
                      <Text style={styles.actionButtonTextDark}>Regularizar</Text>
                    </TouchableOpacity>
                  )}

                  {(materia.estado === 'aprobada' || materia.estado === 'regularizada') && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.resetButton]}
                      onPress={handlePendiente}
                      accessibilityLabel="Marcar como pendiente"
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Resetear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Mensaje para bloqueadas */}
              {materia.estado === 'bloqueada' && (
                <View style={styles.blockedMessage}>
                  <Ionicons name="information-circle" size={20} color="#888" />
                  <Text style={styles.blockedMessageText}>
                    Completa las correlativas para desbloquear esta materia
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  materiaInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  materiaNombre: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  estadoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nivelText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  correlativasContainer: {
    maxHeight: 250,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  noCorrelativas: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noCorrelativasText: {
    color: SIMULADOR_COLORS.aprobada,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  noCorrelativasSubtext: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  correlativasSection: {
    marginBottom: 16,
  },
  correlativasSectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  correlativaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  correlativaText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  correlativaEstado: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  aprobarButton: {
    backgroundColor: SIMULADOR_COLORS.aprobada,
  },
  regularButton: {
    backgroundColor: SIMULADOR_COLORS.regularizada,
  },
  resetButton: {
    backgroundColor: '#333',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextDark: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  blockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  blockedMessageText: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
});
