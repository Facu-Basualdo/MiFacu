import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

interface ToolItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  color: string;
  route: string;
}

const TOOLS: ToolItem[] = [
  { id: 'simulador', icon: 'calculator', label: 'Simulador de correlativas', subtitle: 'Planifica qué materias rendir', color: 'red', route: '/simulador' },
  { id: 'calificaciones', icon: 'chatbubbles', label: 'Reseñas de cátedras', subtitle: 'Opiniones de profesores y materias', color: 'tint', route: '/selectMateria' },
  { id: 'finales', icon: 'star', label: 'Finales', subtitle: 'Gestiona tus exámenes finales', color: 'blue', route: '/finales' },
  { id: 'parciales', icon: 'calendar', label: 'Parciales/Entregas', subtitle: 'Seguimiento de parciales y entregas', color: 'orange', route: '/parciales' },
  { id: 'horarios', icon: 'time', label: 'Horarios', subtitle: 'Ver horarios de cursada', color: 'green', route: '/horarios' },
  { id: 'repositorio', icon: 'folder-open', label: 'Repositorio', subtitle: 'Links y recursos útiles', color: 'slate', route: '/repositorio' },
];

const AnimatedItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

export default function HerramientasScreen() {
  const router = useRouter();
  const { colorScheme, isDark } = useTheme();
  const theme = Colors[colorScheme];

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const getColor = (colorName: string) => {
    return theme[colorName as keyof typeof theme] || theme.tint;
  };

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* STICKY HEADER */}
      <Animated.View style={[styles.headerInline, { opacity: headerOpacity }]}>
        <BlurView intensity={80} tint={colorScheme} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerBorder, { borderBottomColor: theme.separator }]} />
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerInlineContent}>
            <Text style={[styles.headerInlineTitle, { color: theme.text }]}>Herramientas</Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* LARGE TITLE */}
        <Animated.View style={[styles.headerLarge, { opacity: largeTitleOpacity }]}>
          <SafeAreaView edges={['top']}>
            <Text style={[styles.headerLabel, { color: theme.icon }]}>UTILIDADES</Text>
            <Text style={[styles.headerLargeTitle, { color: theme.text }]}>Herramientas</Text>
          </SafeAreaView>
        </Animated.View>

        {/* TOOLS GRID */}
        <View style={styles.section}>
          <View style={[styles.toolsContainer, { backgroundColor: theme.backgroundSecondary }]}>
            {TOOLS.map((tool, index) => (
              <AnimatedItem key={tool.id} index={index}>
                <TouchableOpacity
                  style={[
                    styles.toolRow,
                    index < TOOLS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator },
                  ]}
                  onPress={() => handlePress(tool.route)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.toolIconContainer, { backgroundColor: getColor(tool.color) + '15' }]}>
                    <Ionicons name={tool.icon} size={22} color={getColor(tool.color)} />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={[styles.toolLabel, { color: theme.text }]}>{tool.label}</Text>
                    <Text style={[styles.toolSubtitle, { color: theme.icon }]}>{tool.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                </TouchableOpacity>
              </AnimatedItem>
            ))}
          </View>
        </View>

        {/* INFO */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: theme.tint + '15' }]}>
              <Ionicons name="bulb-outline" size={24} color={theme.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Consejo</Text>
              <Text style={[styles.infoText, { color: theme.icon }]}>
                Usa el Simulador para planificar qué materias rendir y ver cómo afecta tu progreso de carrera.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  headerInline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 70,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSafeArea: { flex: 1 },
  headerInlineContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerInlineTitle: { fontSize: 17, fontWeight: '700' },

  headerLarge: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  headerLargeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: 0.37 },

  section: { paddingHorizontal: 20 },

  toolsContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toolInfo: { flex: 1 },
  toolLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  toolSubtitle: { fontSize: 13 },

  infoSection: { paddingHorizontal: 20, marginTop: 30 },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoText: { fontSize: 14, lineHeight: 20 },
});
