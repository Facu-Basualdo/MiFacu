import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, mifacuGold } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { usePremium } from '../../src/context/PremiumContext';

interface ToolItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  color: string;
  route: string;
  premium?: boolean;
}

interface ToolCategory {
  title: string;
  tools: ToolItem[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    title: 'Gestión académica',
    tools: [
      { id: 'simulador', icon: 'calculator', label: 'Simulador', subtitle: 'Planificá qué materias rendir', color: 'red', route: '/simulador', premium: true },
      { id: 'finales', icon: 'star', label: 'Finales', subtitle: 'Gestiona tus exámenes finales', color: 'blue', route: '/finales' },
      { id: 'parciales', icon: 'calendar', label: 'Parciales y Entregas', subtitle: 'Seguimiento de parciales y entregas', color: 'orange', route: '/parciales' },
      { id: 'temas-finales', icon: 'document-text', label: 'Temas de Finales', subtitle: 'Temas frecuentes en mesas de final', color: 'orange', route: '/selectMateriaFija', premium: true },
    ],
  },
  {
    title: 'Recursos',
    tools: [
      { id: 'calificaciones', icon: 'chatbubbles', label: 'Reseñas', subtitle: 'Opiniones de profesores y cátedras', color: 'tint', route: '/selectMateria', premium: true },
      { id: 'repositorio', icon: 'folder-open', label: 'Repositorio', subtitle: 'Links y recursos útiles', color: 'slate', route: '/repositorio' },
      { id: 'horarios', icon: 'time', label: 'Horarios', subtitle: 'Ver horarios de cursada', color: 'green', route: '/horarios' },
      { id: 'timeline', icon: 'calendar', label: 'Calendario', subtitle: 'Visión anual de tu carrera', color: 'tint', route: '/linea-de-tiempo' },
    ],
  },
];

// ─── Animated Card Entry ───
const AnimatedCard = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 50,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 50,
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

// ─── Tool Card (Apple Library style) ───
const ToolCard = ({
  tool,
  index,
  theme,
  isPro,
  getColor,
  onPress,
}: {
  tool: ToolItem;
  index: number;
  theme: typeof Colors.light;
  isPro: boolean;
  getColor: (c: string) => string;
  onPress: (route: string) => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const color = getColor(tool.color);

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
    <AnimatedCard index={index}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onPress(tool.route)}
        >
          <LinearGradient
            colors={[color + '14', color + '06']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.card}
          >
            {/* Icon */}
            <View style={[styles.iconSquare, { backgroundColor: color }]}>
              <Ionicons name={tool.icon} size={22} color="#fff" />
            </View>

            {/* Text */}
            <View style={styles.cardTextContainer}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {tool.label}
                </Text>
                {tool.premium && !isPro && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardSubtitle, { color: theme.icon }]} numberOfLines={1}>
                {tool.subtitle}
              </Text>
            </View>

            {/* Right */}
            {tool.premium && !isPro ? (
              <Ionicons name="lock-closed" size={16} color={mifacuGold} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={theme.separator} />
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </AnimatedCard>
  );
};

// ─── Premium Banner ───
const PremiumBanner = ({
  theme,
  onPress,
}: {
  theme: typeof Colors.light;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  return (
    <Animated.View style={[styles.bannerWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <LinearGradient
          colors={[mifacuGold, '#D4A84B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <View style={styles.bannerIconCircle}>
            <Ionicons name="star" size={20} color={mifacuGold} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Desbloquea Premium</Text>
            <Text style={styles.bannerSubtitle}>Accedé a todas las herramientas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ───
export default function HerramientasScreen() {
  const router = useRouter();
  const { colorScheme, isDark } = useTheme();
  const { isPro } = usePremium();
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

  let globalIndex = 0;

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

        {/* PREMIUM BANNER */}
        {!isPro && (
          <View style={styles.section}>
            <PremiumBanner theme={theme} onPress={() => handlePress('/subscription')} />
          </View>
        )}

        {/* TOOL CATEGORIES */}
        {TOOL_CATEGORIES.map((category) => (
          <View key={category.title} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
            <View style={styles.cardList}>
              {category.tools.map((tool) => {
                const idx = globalIndex++;
                return (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    index={idx}
                    theme={theme}
                    isPro={isPro}
                    getColor={getColor}
                    onPress={handlePress}
                  />
                );
              })}
            </View>
          </View>
        ))}

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

  // Premium Banner
  bannerWrapper: { marginBottom: 8 },
  banner: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  bannerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  // Categories
  categorySection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  cardList: {
    gap: 10,
  },

  // Tool Card
  cardWrapper: {
    // shadow on the wrapper so it doesn't get clipped by gradient overflow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: mifacuGold + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  proBadgeText: {
    color: mifacuGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Info card
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
