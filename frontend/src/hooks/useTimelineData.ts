import { useState, useEffect, useCallback } from 'react';
import { DataRepository } from '../services/dataRepository';
import { useAuth } from '../context/AuthContext';

// --- Types ---

export type StressLevel = 'green' | 'yellow' | 'red';

export interface TimelineEvent {
  id: string;
  tipo: 'Parcial' | 'Final' | 'Entrega';
  nombre: string;
  materiaId?: number;
  materiaNombre: string;
  fecha: Date;
}

export interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  events: TimelineEvent[];
  stressLevel: StressLevel;
  isCurrentWeek: boolean;
}

export interface MateriaRow {
  materiaId: number | null;
  materiaNombre: string;
  events: TimelineEvent[];
}

export interface TimelineData {
  weeks: WeekData[];
  materiaRows: MateriaRow[];
  semesterLabel: string;
  currentWeekIndex: number;
  totalEvents: number;
  hellWeeks: number;
  eventsByDate: Map<string, TimelineEvent[]>;
  monthsRange: { start: Date; end: Date };
}

// --- Helpers ---

function getSemesterRange(year: number): { start: Date; end: Date; label: string } {
  const month = new Date().getMonth() + 1; // 1-12
  // Feb-Jul → 1er cuatrimestre (incluye febrero como periodo de preparacion)
  if (month >= 2 && month <= 7) {
    return {
      start: new Date(year, 1, 1),   // 1 Feb
      end: new Date(year, 6, 31),    // 31 Jul
      label: `1er Cuatrimestre ${year}`,
    };
  }
  // Ago-Ene → 2do cuatrimestre
  if (month >= 8) {
    return {
      start: new Date(year, 7, 1),     // 1 Ago
      end: new Date(year, 11, 31),     // 31 Dic
      label: `2do Cuatrimestre ${year}`,
    };
  }
  // Enero → mostrar 2do cuatrimestre del año anterior (cierre)
  return {
    start: new Date(year - 1, 7, 1),   // 1 Ago año anterior
    end: new Date(year, 1, 28),        // 28 Feb año actual
    label: `2do Cuatrimestre ${year - 1}`,
  };
}

function getStressLevel(eventCount: number): StressLevel {
  if (eventCount >= 3) return 'red';
  if (eventCount >= 2) return 'yellow';
  return 'green';
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(str: string): Date {
  // Handles "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss..."
  const parts = str.split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// --- Hook ---

export function useTimelineData() {
  const { user, isGuest } = useAuth();
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const userId = user?.id;

      // Fetch all 3 data sources in parallel
      const [recordatorios, finales, misMaterias] = await Promise.all([
        DataRepository.getRecordatorios(isGuest).catch(() => []),
        DataRepository.getFinales(isGuest).catch(() => []),
        userId ? DataRepository.getMisMaterias(userId).catch(() => []) : Promise.resolve([]),
      ]);

      const now = new Date();
      const year = now.getFullYear();
      const { start, end, label } = getSemesterRange(year);

      // Build events from recordatorios (Parcial / Entrega)
      const events: TimelineEvent[] = [];

      for (const r of recordatorios) {
        const tipo = r.tipo as string;
        if (tipo !== 'Parcial' && tipo !== 'Entrega') continue;
        if (!r.fecha) continue;
        const fecha = parseISODate(r.fecha);
        if (fecha < start || fecha > end) continue;

        events.push({
          id: `rec-${r.id}`,
          tipo: tipo as 'Parcial' | 'Entrega',
          nombre: r.nombre,
          materiaId: r.materiaId ?? r.materia?.id ?? undefined,
          materiaNombre: r.materia?.nombre || 'Sin materia',
          fecha,
        });
      }

      // Build events from finales
      for (const f of finales) {
        const fechaStr = f.fecha?.toString() || '';
        const fecha = parseISODate(fechaStr);
        if (fecha < start || fecha > end) continue;

        const materiaNombre = f.materia?.nombre || f.materiaNombre || 'Desconocida';
        events.push({
          id: `fin-${f.id}`,
          tipo: 'Final',
          nombre: materiaNombre,
          materiaId: f.materiaId ?? f.materia?.id ?? undefined,
          materiaNombre,
          fecha,
        });
      }

      // Calcular cantidad de semanas segun el rango del cuatrimestre
      const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weeks: WeekData[] = [];
      const today = startOfDay(now);
      let currentWeekIndex = -1;

      for (let i = 0; i < totalWeeks; i++) {
        const weekStart = addDays(start, i * 7);
        const weekEnd = addDays(weekStart, 6);

        const weekEvents = events.filter((e) => {
          const d = startOfDay(e.fecha);
          return d >= weekStart && d <= weekEnd;
        });

        const isCurrentWeek = today >= weekStart && today <= weekEnd;
        if (isCurrentWeek) currentWeekIndex = i;

        weeks.push({
          weekNumber: i + 1,
          startDate: weekStart,
          endDate: weekEnd,
          events: weekEvents,
          stressLevel: getStressLevel(weekEvents.length),
          isCurrentWeek,
        });
      }

      // If current week wasn't found (we're before/after semester), find closest
      if (currentWeekIndex === -1) {
        let minDist = Infinity;
        weeks.forEach((w, i) => {
          const dist = Math.abs(today.getTime() - w.startDate.getTime());
          if (dist < minDist) {
            minDist = dist;
            currentWeekIndex = i;
          }
        });
      }

      // Build materia rows from misMaterias with estado 'cursado'
      const cursando = (misMaterias as any[]).filter(
        (um) => um.estado === 'cursado'
      );

      const materiaMap = new Map<number, MateriaRow>();
      for (const um of cursando) {
        const mId = um.materiaId ?? um.materia?.id;
        const mNombre = um.materia?.nombre || 'Sin nombre';
        if (mId && !materiaMap.has(mId)) {
          materiaMap.set(mId, {
            materiaId: mId,
            materiaNombre: mNombre,
            events: [],
          });
        }
      }

      // Distribute events into materia rows
      const otrosEvents: TimelineEvent[] = [];
      for (const ev of events) {
        if (ev.materiaId && materiaMap.has(ev.materiaId)) {
          materiaMap.get(ev.materiaId)!.events.push(ev);
        } else {
          otrosEvents.push(ev);
        }
      }

      const materiaRows: MateriaRow[] = [...materiaMap.values()];

      // Add "Otros" row if there are unmatched events
      if (otrosEvents.length > 0) {
        materiaRows.push({
          materiaId: null,
          materiaNombre: 'Otros',
          events: otrosEvents,
        });
      }

      const hellWeeks = weeks.filter((w) => w.stressLevel === 'red').length;

      // Build eventsByDate map
      const eventsByDate = new Map<string, TimelineEvent[]>();
      for (const ev of events) {
        const key = formatDateKey(ev.fecha);
        if (!eventsByDate.has(key)) {
          eventsByDate.set(key, []);
        }
        eventsByDate.get(key)!.push(ev);
      }

      // monthsRange: first and last month of the semester
      const monthsRange = { start, end };

      setData({
        weeks,
        materiaRows,
        semesterLabel: label,
        currentWeekIndex: Math.max(currentWeekIndex, 0),
        totalEvents: events.length,
        hellWeeks,
        eventsByDate,
        monthsRange,
      });
    } catch (error) {
      console.error('Error loading timeline data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refresh: load };
}
