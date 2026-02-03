import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SummaryCardProps {
  totalEvents: number;
  hellWeeks: number;
  currentWeekNumber: number;
  theme: any;
}

export default function SummaryCard({
  totalEvents,
  hellWeeks,
  currentWeekNumber,
  theme,
}: SummaryCardProps) {
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <StatItem
        icon="calendar-outline"
        label="Eventos"
        value={totalEvents.toString()}
        color={theme.tint}
        theme={theme}
      />
      <View style={[styles.divider, { backgroundColor: theme.separator }]} />
      <StatItem
        icon="flame-outline"
        label="Hell Weeks"
        value={hellWeeks.toString()}
        color={theme.red}
        theme={theme}
      />
      <View style={[styles.divider, { backgroundColor: theme.separator }]} />
      <StatItem
        icon="flag-outline"
        label="Actual"
        value={`Sem ${currentWeekNumber}`}
        color={theme.green}
        theme={theme}
      />
    </View>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  theme: any;
}) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.icon }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
  },
});
