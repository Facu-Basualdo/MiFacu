import React, { useState, memo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DataRepository } from '../../services/dataRepository';
import type { ThemeColors, Recordatorio } from '../../types';
import { mifacuNavy } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const formatTaskDate = (fechaStr: string): string => {
  const fecha = new Date(fechaStr + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Hoy';
  if (diff === -1) return 'Ayer';
  if (diff === 1) return 'Mañana';

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
};

interface TaskItemProps {
  task: Recordatorio;
  onDelete: () => void;
  theme: ThemeColors;
  separatorColor: string;
}

/**
 * Individual task item with edit and complete functionality
 * Attio-inspired design with date badges
 */
export const TaskItem = memo<TaskItemProps>(function TaskItem({
  task,
  onDelete,
  theme,
  separatorColor,
}) {
  const { isDark: isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(task.nombre);
  const [description, setDescription] = useState(task.descripcion || '');

  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handleSave = useCallback(async () => {
    setIsEditing(false);
    const trimmedText = text.trim();
    const trimmedDesc = description.trim() || undefined;

    if (trimmedText !== task.nombre || trimmedDesc !== task.descripcion) {
      try {
        await DataRepository.updateRecordatorio(task.id, {
          nombre: trimmedText,
          descripcion: trimmedDesc,
        });
      } catch (e) {
        console.error('Error updating task', e);
      }
    }
  }, [text, description, task.nombre, task.descripcion, task.id]);

  const handleComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      onDelete();
    });
  }, [opacity, scale, onDelete]);

  const dateLabel = task.fecha ? formatTaskDate(task.fecha) : null;
  const isOverdue = task.fecha ? new Date(task.fecha + 'T00:00:00') < new Date(new Date().toDateString()) : false;

  return (
    <Animated.View
      style={[
        styles.taskItem,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleComplete}
        style={styles.taskCheckbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={[styles.checkboxCircle, { borderColor: theme.separator, backgroundColor: isDarkMode ? 'transparent' : 'white' }]} />
      </TouchableOpacity>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.taskInputEdit, { color: theme.text }]}
            value={text}
            onChangeText={setText}
            autoFocus
            returnKeyType="next"
            accessibilityLabel="Editar nombre de tarea"
            placeholder="Título"
            placeholderTextColor={theme.separator}
          />
          <TextInput
            style={[styles.descriptionInputEdit, { color: theme.icon }]}
            value={description}
            onChangeText={setDescription}
            onBlur={handleSave}
            onSubmitEditing={handleSave}
            returnKeyType="done"
            accessibilityLabel="Editar descripción de tarea"
            placeholder="Descripción (opcional)"
            placeholderTextColor={theme.separator}
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={styles.textContainer}
          accessibilityLabel={`Tarea: ${text}. Toca para editar`}
          accessibilityRole="button"
        >
          <Text style={[styles.taskText, { color: theme.text }]} numberOfLines={2}>{text}</Text>
          {task.descripcion && (
            <Text style={[styles.taskDescription, { color: theme.icon }]}>{task.descripcion}</Text>
          )}
          {dateLabel && (
            <View style={[
              styles.dateBadge,
              {
                backgroundColor: isOverdue
                  ? (isDarkMode ? 'rgba(220,38,38,0.15)' : '#FEE2E2')
                  : (isDarkMode ? 'rgba(99,102,241,0.15)' : '#EEF2FF'),
              },
            ]}>
              <Ionicons
                name="calendar-outline"
                size={11}
                color={isOverdue ? '#DC2626' : (isDarkMode ? '#818CF8' : '#6366F1')}
              />
              <Text style={[
                styles.dateBadgeText,
                {
                  color: isOverdue ? '#DC2626' : (isDarkMode ? '#818CF8' : '#6366F1'),
                },
              ]}>
                {dateLabel}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  textContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  taskDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  editContainer: {
    flex: 1,
  },
  taskInputEdit: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  descriptionInputEdit: {
    fontSize: 13,
    padding: 0,
    marginTop: 4,
  },
});
