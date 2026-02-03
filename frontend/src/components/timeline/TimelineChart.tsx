import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TimelineEvent } from '../../hooks/useTimelineData';

interface TimelineChartProps {
  events: TimelineEvent[];
  eventsByDate: Map<string, TimelineEvent[]>;
  monthsRange: { start: Date; end: Date };
  theme: any;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const EVENT_COLORS: Record<string, string> = {
  Parcial: '#F59E0B',
  Final: '#EF4444',
  Entrega: '#3B82F6',
};

const EVENT_BADGE_LABELS: Record<string, string> = {
  Parcial: 'Parcial',
  Final: 'Final',
  Entrega: 'Entrega',
};

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface DayCell {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  dateKey: string;
}

function generateMonthGrid(year: number, month: number): DayCell[] {
  const cells: DayCell[] = [];
  const firstDay = new Date(year, month, 1);
  // Monday=0 offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6; // Sunday becomes 6

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    cells.push({
      date,
      day: d,
      isCurrentMonth: false,
      dateKey: formatDateKey(date),
    });
  }

  // Days of current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({
      date,
      day: d,
      isCurrentMonth: true,
      dateKey: formatDateKey(date),
    });
  }

  // Fill remaining to complete 6 rows (42 cells)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    cells.push({
      date,
      day: d,
      isCurrentMonth: false,
      dateKey: formatDateKey(date),
    });
  }

  return cells;
}

export default function TimelineChart({
  events,
  eventsByDate,
  monthsRange,
  theme,
}: TimelineChartProps) {
  const today = useMemo(() => new Date(), []);

  // Clamp initial month to range
  const initialMonth = useMemo(() => {
    const now = new Date();
    const start = monthsRange.start;
    const end = monthsRange.end;
    if (now < start) return new Date(start.getFullYear(), start.getMonth(), 1);
    if (now > end) return new Date(end.getFullYear(), end.getMonth(), 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [monthsRange]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const canGoBack = useMemo(() => {
    const prev = new Date(year, month - 1, 1);
    return prev >= new Date(monthsRange.start.getFullYear(), monthsRange.start.getMonth(), 1);
  }, [year, month, monthsRange]);

  const canGoForward = useMemo(() => {
    const next = new Date(year, month + 1, 1);
    return next <= new Date(monthsRange.end.getFullYear(), monthsRange.end.getMonth(), 1);
  }, [year, month, monthsRange]);

  const goBack = useCallback(() => {
    if (canGoBack) setCurrentMonth(new Date(year, month - 1, 1));
  }, [canGoBack, year, month]);

  const goForward = useCallback(() => {
    if (canGoForward) setCurrentMonth(new Date(year, month + 1, 1));
  }, [canGoForward, year, month]);

  const grid = useMemo(() => generateMonthGrid(year, month), [year, month]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate) || [];
  }, [selectedDate, eventsByDate]);

  const handleDayPress = useCallback(
    (cell: DayCell) => {
      if (!cell.isCurrentMonth) return;
      const key = cell.dateKey;
      if (selectedDate === key) {
        setSelectedDate(null);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        setSelectedDate(key);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    },
    [selectedDate, fadeAnim]
  );

  // Get unique event types for a day (for dots)
  const getEventTypes = useCallback(
    (dateKey: string): string[] => {
      const dayEvents = eventsByDate.get(dateKey);
      if (!dayEvents) return [];
      const types = new Set<string>();
      dayEvents.forEach((ev) => types.add(ev.tipo));
      return Array.from(types);
    },
    [eventsByDate]
  );

  const isDark = theme.background === '#000000';

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {/* Month Navigation Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={goBack}
          disabled={!canGoBack}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={canGoBack ? theme.tint : theme.separator}
          />
        </TouchableOpacity>

        <Text style={[styles.monthTitle, { color: theme.text }]}>
          {MONTH_NAMES[month]} {year}
        </Text>

        <TouchableOpacity
          onPress={goForward}
          disabled={!canGoForward}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoForward ? theme.tint : theme.separator}
          />
        </TouchableOpacity>
      </View>

      {/* Day of week headers */}
      <View style={styles.dayNamesRow}>
        {DAY_NAMES.map((name) => (
          <View key={name} style={styles.dayNameCell}>
            <Text style={[styles.dayNameText, { color: theme.icon }]}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 6 }, (_, rowIdx) => (
          <View key={rowIdx} style={styles.weekRow}>
            {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell) => {
              const isToday = isSameDay(cell.date, today) && cell.isCurrentMonth;
              const isSelected = selectedDate === cell.dateKey && cell.isCurrentMonth;
              const eventTypes = cell.isCurrentMonth ? getEventTypes(cell.dateKey) : [];

              return (
                <TouchableOpacity
                  key={cell.dateKey}
                  style={styles.dayCell}
                  onPress={() => handleDayPress(cell)}
                  activeOpacity={cell.isCurrentMonth ? 0.6 : 1}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && styles.todayCircle,
                      isSelected && !isToday && [
                        styles.selectedCircle,
                        { backgroundColor: isDark ? '#333' : '#E5E7EB' },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: theme.text },
                        !cell.isCurrentMonth && {
                          color: isDark ? '#444' : '#CBD5E1',
                        },
                        isToday && styles.todayText,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>

                  {/* Event dots */}
                  <View style={styles.dotsContainer}>
                    {eventTypes.map((tipo) => (
                      <View
                        key={tipo}
                        style={[
                          styles.dot,
                          { backgroundColor: EVENT_COLORS[tipo] || '#6B7280' },
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected Day Events */}
      {selectedDate && (
        <Animated.View style={[styles.eventsSection, { opacity: fadeAnim }]}>
          <View style={[styles.eventsDivider, { backgroundColor: theme.separator }]} />
          {selectedEvents.length > 0 ? (
            selectedEvents.map((ev) => (
              <View
                key={ev.id}
                style={[
                  styles.eventCard,
                  { backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF' },
                ]}
              >
                <View
                  style={[
                    styles.eventStripe,
                    { backgroundColor: EVENT_COLORS[ev.tipo] || '#6B7280' },
                  ]}
                />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventName, { color: theme.text }]} numberOfLines={1}>
                    {ev.nombre}
                  </Text>
                  <Text style={[styles.eventMateria, { color: theme.icon }]} numberOfLines={1}>
                    {ev.materiaNombre}
                  </Text>
                </View>
                <View
                  style={[
                    styles.eventTypeBadge,
                    { backgroundColor: (EVENT_COLORS[ev.tipo] || '#6B7280') + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventTypeText,
                      { color: EVENT_COLORS[ev.tipo] || '#6B7280' },
                    ]}
                  >
                    {EVENT_BADGE_LABELS[ev.tipo] || ev.tipo}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noEventsText, { color: theme.icon }]}>
              Sin eventos este día
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  navButton: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  dayNamesRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    minHeight: 48,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: '#3B82F6',
  },
  selectedCircle: {
    borderRadius: 16,
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  eventsSection: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  eventsDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  eventStripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  eventInfo: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventMateria: {
    fontSize: 12,
    marginTop: 2,
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noEventsText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
