import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MateriaSimulador } from '../../hooks/useSimuladorData';
import { SIMULADOR_COLORS, getEstadoConfig } from '../../utils/estadoMapper';

interface CorrelativaFaltante {
  materia: MateriaSimulador;
  tipoRequerido: 'regularizada' | 'aprobada';
}

interface BlockedMateriaSheetProps {
  materia: MateriaSimulador | null;
  correlativasFaltantes: CorrelativaFaltante[];
  visible: boolean;
  sheetAnim: Animated.Value;
  overlayOpacity: Animated.Value;
  onClose: () => void;
}

export function BlockedMateriaSheet({
  materia,
  correlativasFaltantes,
  visible,
  sheetAnim,
  overlayOpacity,
  onClose,
}: BlockedMateriaSheetProps) {
  if (!visible || !materia) return null;

  // Separar por tipo de requisito
  const faltantesRegularizadas = correlativasFaltantes.filter(c => c.tipoRequerido === 'regularizada');
  const faltantesAprobadas = correlativasFaltantes.filter(c => c.tipoRequerido === 'aprobada');

  const backdropStyle = {
    opacity: overlayOpacity,
  };

  const sheetStyle = {
    transform: [{ translateY: sheetAnim }],
  };

  const renderCorrelativaItem = (item: CorrelativaFaltante) => {
    const { materia: correlativa, tipoRequerido } = item;
    const estadoConfig = getEstadoConfig(correlativa.estado);
    const requiereAprobada = tipoRequerido === 'aprobada';

    return (
      <View key={`${correlativa.id}-${tipoRequerido}`} style={styles.correlativaItem}>
        <View style={styles.correlativaIconContainer}>
          <Ionicons
            name={requiereAprobada ? "school" : "document-text"}
            size={20}
            color={requiereAprobada ? "#ff6b6b" : "#ffa500"}
          />
        </View>
        <View style={styles.correlativaInfo}>
          <Text style={styles.correlativaText} numberOfLines={2}>
            {correlativa.nombre}
          </Text>
          <View style={styles.correlativaEstadoRow}>
            <Text style={styles.correlativaNivel}>
              Nivel {correlativa.nivel}
            </Text>
            <View style={[styles.estadoBadge, { borderColor: estadoConfig.color }]}>
              <Ionicons
                name={estadoConfig.icon}
                size={12}
                color={estadoConfig.iconColor}
              />
              <Text style={[styles.estadoText, { color: estadoConfig.color }]}>
                {estadoConfig.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, backdropStyle]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, sheetStyle]}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header con icono de bloqueo */}
              <View style={styles.blockedHeader}>
                <View style={styles.blockedIconContainer}>
                  <Ionicons name="lock-closed" size={32} color="#ff4444" />
                </View>
                <Text style={styles.blockedTitle}>Materia Bloqueada</Text>
              </View>

              {/* Nombre de la materia */}
              <View style={styles.materiaInfo}>
                <Text style={styles.materiaNombre}>{materia.nombre}</Text>
                <Text style={styles.nivelText}>Nivel {materia.nivel}</Text>
              </View>

              {/* Separador */}
              <View style={styles.separator} />

              {/* Mensaje explicativo */}
              <View style={styles.messageContainer}>
                <Ionicons name="information-circle" size={20} color="#888" />
                <Text style={styles.messageText}>
                  Para poder cursar esta materia, necesitas cumplir con las siguientes correlativas:
                </Text>
              </View>

              {/* Lista de correlativas faltantes */}
              <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Sección: Necesitan estar REGULARIZADAS */}
                {faltantesRegularizadas.length > 0 && (
                  <View style={styles.correlativasSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="document-text" size={16} color="#ffa500" />
                      <Text style={[styles.sectionTitle, { color: '#ffa500' }]}>
                        NECESITAS REGULARIZAR ({faltantesRegularizadas.length})
                      </Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                      Estas materias deben estar al menos regularizadas
                    </Text>
                    {faltantesRegularizadas.map(renderCorrelativaItem)}
                  </View>
                )}

                {/* Sección: Necesitan estar APROBADAS */}
                {faltantesAprobadas.length > 0 && (
                  <View style={styles.correlativasSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="school" size={16} color="#ff6b6b" />
                      <Text style={[styles.sectionTitle, { color: '#ff6b6b' }]}>
                        NECESITAS APROBAR ({faltantesAprobadas.length})
                      </Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                      Estas materias deben tener el final aprobado
                    </Text>
                    {faltantesAprobadas.map(renderCorrelativaItem)}
                  </View>
                )}
              </ScrollView>

              {/* Botón de cerrar */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Entendido"
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText}>Entendido</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

// Exportar el tipo para usar en otros componentes
export type { CorrelativaFaltante };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.3)',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 20,
  },
  blockedHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  blockedIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  blockedTitle: {
    color: '#ff4444',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  materiaInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  materiaNombre: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  nivelText: {
    color: '#666',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  separator: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  messageText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  scrollContainer: {
    maxHeight: 280,
    marginBottom: 16,
  },
  correlativasSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 24,
  },
  correlativaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.15)',
  },
  correlativaIconContainer: {
    marginRight: 12,
    width: 28,
    alignItems: 'center',
  },
  correlativaInfo: {
    flex: 1,
  },
  correlativaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  correlativaEstadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  correlativaNivel: {
    color: '#555',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#222',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
