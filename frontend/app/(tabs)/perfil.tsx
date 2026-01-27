import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { materiasApi as api } from '../../src/services/api';

interface Stats {
  aprobadas: number;
  regulares: number;
  cursando: number;
  totalPlan: number;
}

export default function PerfilScreen() {
  const router = useRouter();
  const { colorScheme, isDark, toggleTheme } = useTheme();
  const { user, isGuest, signOut } = useAuth();
  const theme = Colors[colorScheme];

  const [privacyMode, setPrivacyMode] = useState(false);
  const [stats, setStats] = useState<Stats>({ aprobadas: 0, regulares: 0, cursando: 0, totalPlan: 0 });

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load privacy mode
      const savedPrivacy = await AsyncStorage.getItem('privacy_mode');
      if (savedPrivacy !== null) {
        setPrivacyMode(savedPrivacy === 'true');
      }

      // Load stats
      const userId = user?.id || 'guest';
      const materias = await api.getMateriasByUsuario(userId);
      const aprobadas = materias.filter((m: any) => m.estado === 'aprobado').length;
      const regulares = materias.filter((m: any) => m.estado === 'regular').length;
      const cursando = materias.filter((m: any) => m.estado === 'cursado').length;

      // Get total from plan
      const allMaterias = await api.getMaterias();
      const totalPlan = allMaterias.length;

      setStats({ aprobadas, regulares, cursando, totalPlan });
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleToggleDarkMode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleTheme();
  }, [toggleTheme]);

  const handlePrivacyChange = useCallback(async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('privacy_mode', String(val));
    setPrivacyMode(val);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }, [signOut, router]);

  const progreso = stats.totalPlan > 0 ? Math.round((stats.aprobadas / stats.totalPlan) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* STICKY HEADER */}
      <Animated.View style={[styles.headerInline, { opacity: headerOpacity }]}>
        <BlurView intensity={80} tint={colorScheme} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerBorder, { borderBottomColor: theme.separator }]} />
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerInlineContent}>
            <Text style={[styles.headerInlineTitle, { color: theme.text }]}>Perfil</Text>
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
            <Text style={[styles.headerLabel, { color: theme.icon }]}>MI CUENTA</Text>
            <Text style={[styles.headerLargeTitle, { color: theme.text }]}>Perfil</Text>
          </SafeAreaView>
        </Animated.View>

        {/* PROFILE CARD */}
        <View style={styles.section}>
          <View style={[styles.profileCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.avatarRing, { borderColor: theme.tint }]}>
              <Image
                source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100?img=33' }}
                style={styles.avatar}
              />
            </View>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.user_metadata?.full_name || 'Usuario Invitado'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.icon }]}>
              {user?.email || 'Modo sin conexión'}
            </Text>
            {isGuest && (
              <View style={[styles.guestBadge, { backgroundColor: theme.orange + '20' }]}>
                <Ionicons name="person-outline" size={12} color={theme.orange} />
                <Text style={[styles.guestBadgeText, { color: theme.orange }]}>Invitado</Text>
              </View>
            )}
          </View>
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>ESTADÍSTICAS</Text>
          <View style={[styles.statsCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.tint }]}>
                  {privacyMode ? '•••' : `${progreso}%`}
                </Text>
                <Text style={[styles.statLabel, { color: theme.icon }]}>Progreso</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.green }]}>
                  {privacyMode ? '•••' : stats.aprobadas}
                </Text>
                <Text style={[styles.statLabel, { color: theme.icon }]}>Aprobadas</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.orange }]}>
                  {privacyMode ? '•••' : stats.regulares}
                </Text>
                <Text style={[styles.statLabel, { color: theme.icon }]}>Regulares</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.blue }]}>
                  {privacyMode ? '•••' : stats.cursando}
                </Text>
                <Text style={[styles.statLabel, { color: theme.icon }]}>Cursando</Text>
              </View>
            </View>
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>PREFERENCIAS</Text>
          <View style={[styles.optionsContainer, { backgroundColor: theme.backgroundSecondary }]}>
            {/* Dark Mode */}
            <View style={[styles.optionRow, { borderBottomColor: theme.separator }]}>
              <View style={[styles.optionIcon, { backgroundColor: isDark ? theme.blue : theme.orange }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="white" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Modo Oscuro</Text>
                <Text style={[styles.optionHint, { color: theme.icon }]}>
                  {isDark ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: theme.separator, true: theme.tint + '60' }}
                thumbColor={isDark ? theme.tint : '#f4f3f4'}
                ios_backgroundColor={theme.separator}
              />
            </View>

            {/* Privacy Mode */}
            <View style={styles.optionRow}>
              <View style={[styles.optionIcon, { backgroundColor: theme.slate }]}>
                <Ionicons name={privacyMode ? 'eye-off' : 'eye'} size={18} color="white" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Modo Privado</Text>
                <Text style={[styles.optionHint, { color: theme.icon }]}>Oculta tu progreso</Text>
              </View>
              <Switch
                value={privacyMode}
                onValueChange={handlePrivacyChange}
                trackColor={{ false: theme.separator, true: theme.tint + '60' }}
                thumbColor={privacyMode ? theme.tint : '#f4f3f4'}
                ios_backgroundColor={theme.separator}
              />
            </View>
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>CUENTA</Text>
          <View style={[styles.optionsContainer, { backgroundColor: theme.backgroundSecondary }]}>
            {/* My Subjects */}
            <TouchableOpacity
              style={[styles.optionRow, { borderBottomColor: theme.separator }]}
              onPress={() => router.push('/(tabs)/materias')}
              activeOpacity={0.6}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.blue }]}>
                <Ionicons name="school" size={18} color="white" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Mis Materias</Text>
                <Text style={[styles.optionHint, { color: theme.icon }]}>
                  {stats.aprobadas} aprobadas de {stats.totalPlan}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.separator} />
            </TouchableOpacity>

            {/* Storage Info */}
            <View style={styles.optionRow}>
              <View style={[styles.optionIcon, { backgroundColor: theme.green }]}>
                <Ionicons name="cloud-done" size={18} color="white" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  {isGuest ? 'Datos Locales' : 'Sincronizado'}
                </Text>
                <Text style={[styles.optionHint, { color: theme.icon }]}>
                  {isGuest ? 'Los datos se guardan en tu dispositivo' : 'Conectado con tu cuenta'}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: theme.green }]} />
            </View>
          </View>
        </View>

        {/* LOGOUT */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.red + '15' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.red} />
            <Text style={[styles.logoutText, { color: theme.red }]}>
              {isGuest ? 'Salir del Modo Invitado' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* VERSION */}
        <Text style={[styles.versionText, { color: theme.icon }]}>miFACU v1.0.0</Text>

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

  headerLarge: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  headerLargeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: 0.37 },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  // Profile card
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarRing: { padding: 3, borderRadius: 50, borderWidth: 3 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  profileName: { fontSize: 22, fontWeight: '700', marginTop: 16, letterSpacing: -0.3 },
  profileEmail: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 12,
  },
  guestBadgeText: { fontSize: 13, fontWeight: '600', marginLeft: 4 },

  // Stats
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 40 },

  // Options
  optionsContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1, marginLeft: 14 },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  optionHint: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  logoutText: { fontSize: 16, fontWeight: '600', marginLeft: 10 },

  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    opacity: 0.6,
  },
});
