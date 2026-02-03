import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useTimelineData } from '../src/hooks/useTimelineData';
import SummaryCard from '../src/components/timeline/SummaryCard';
import TimelineChart from '../src/components/timeline/TimelineChart';

const EVENT_LEGEND = [
  { color: '#F59E0B', label: 'Parcial' },
  { color: '#EF4444', label: 'Final' },
  { color: '#3B82F6', label: 'Entrega' },
];

export default function LineaDeTiempoScreen() {
  const router = useRouter();
  const { colorScheme, isDark } = useTheme();
  const theme = Colors[colorScheme];
  const { data, loading, refresh } = useTimelineData();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const isEmpty = !loading && (!data || data.totalEvents === 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.tint }]}>Listo</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Calendario Académico
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.tint} />
          </View>
        ) : isEmpty ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
            }
          >
            <Ionicons name="analytics-outline" size={60} color={theme.separator} />
            <Text style={[styles.emptyText, { color: theme.icon }]}>
              No hay eventos en este cuatrimestre
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.icon }]}>
              Agrega parciales, finales o entregas para ver tu calendario
            </Text>
          </ScrollView>
        ) : data ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
            }
          >
            {/* Semester label */}
            <Text style={[styles.semesterLabel, { color: theme.icon }]}>
              {data.semesterLabel.toUpperCase()}
            </Text>

            {/* Summary Card */}
            <View style={styles.section}>
              <SummaryCard
                totalEvents={data.totalEvents}
                hellWeeks={data.hellWeeks}
                currentWeekNumber={
                  data.currentWeekIndex >= 0
                    ? data.weeks[data.currentWeekIndex]?.weekNumber ?? 1
                    : 1
                }
                theme={theme}
              />
            </View>

            {/* Legend */}
            <View style={styles.section}>
              <View style={styles.legendRow}>
                {EVENT_LEGEND.map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: item.color }]}
                    />
                    <Text style={[styles.legendText, { color: theme.icon }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.section}>
              <TimelineChart
                events={data.weeks.flatMap((w) => w.events)}
                eventsByDate={data.eventsByDate}
                monthsRange={data.monthsRange}
                theme={theme}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  closeButton: { paddingVertical: 5, width: 50 },
  closeText: { fontSize: 17, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  semesterLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
