import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { usePomodoroTimer } from '../../src/hooks/usePomodoroTimer';
import { useGamification } from '../../src/hooks/useGamification';
import PomodoroTimer from '../../src/components/milo/PomodoroTimer';
import MiloMascot, { MiloState } from '../../src/components/milo/MiloMascot';
import StatsPanel from '../../src/components/milo/StatsPanel';
import SessionHistory from '../../src/components/milo/SessionHistory';
import { pomodoroApi, gamificationApi } from '../../src/services/api';
import { PremiumGate } from '../../src/components/premium';

// Duolingo-inspired colors
const MILO_THEME = {
  dark: {
    background: '#131F24',
    card: '#1A2C32',
    text: '#FFFFFF',
    subtext: '#AFAFAF',
  },
  light: {
    background: '#F7F7F7',
    card: '#FFFFFF',
    text: '#4B4B4B',
    subtext: '#777777',
  },
};

function MiloContent() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? MILO_THEME.dark : MILO_THEME.light;

  const timer = usePomodoroTimer();
  const gamification = useGamification(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  // Determine Milo's state
  const getMiloState = (): MiloState => {
    if (timer.sessionJustCompleted) return 'celebrating';
    if (timer.isRunning && timer.mode === 'focus') return 'studying';
    if (timer.isRunning && timer.mode !== 'focus') return 'sleeping';
    return 'idle';
  };

  // Handle session completion
  useEffect(() => {
    if (timer.sessionJustCompleted && timer.mode === 'focus' && user?.id) {
      const registerSession = async () => {
        try {
          await pomodoroApi.complete({
            userId: user.id,
            tipo: 'focus',
            duracionMinutos: timer.duracionMinutos,
            duracionRealSegundos: timer.duracionRealSegundos,
            completada: true,
            xpGanado: timer.duracionMinutos,
          });

          await gamificationApi.completeSession({
            userId: user.id,
            duracionMinutos: timer.duracionMinutos,
            tipo: 'focus',
          });

          gamification.refresh();
        } catch (e) {
          console.error('Error registering session:', e);
        }
      };
      registerSession();
    }
  }, [timer.sessionJustCompleted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await gamification.refresh();
    setRefreshing(false);
  }, [gamification]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>Milo</Text>

        {/* Mascot */}
        <MiloMascot state={getMiloState()} isDark={isDark} />

        {/* Timer */}
        <PomodoroTimer
          timeRemaining={timer.timeRemaining}
          isRunning={timer.isRunning}
          progress={timer.progress}
          mode={timer.mode}
          modeLabel={timer.modeLabel}
          sessionsCompleted={timer.sessionsCompleted}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
          onSwitchMode={timer.switchMode}
          isDark={isDark}
        />

        {/* Stats Panel */}
        <StatsPanel
          profile={gamification.profile}
          loading={gamification.loading}
          isDark={isDark}
        />

        {/* Session History */}
        <SessionHistory
          userId={user?.id}
          isDark={isDark}
          refreshTrigger={timer.sessionsCompleted}
        />
      </ScrollView>
    </View>
  );
}

export default function MiloScreen() {
  return (
    <PremiumGate featureName="Milo - Tu Compañero de Estudio">
      <MiloContent />
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
});
