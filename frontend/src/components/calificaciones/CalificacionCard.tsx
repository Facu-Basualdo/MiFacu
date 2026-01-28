import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StarRating } from './StarRating';
import {
    CalificacionCatedra,
    TipoVoto,
    DIFICULTAD_LABELS,
    DIFICULTAD_COLORS,
} from '../../types/calificaciones';

// Simple relative time function
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} dias`;
    if (diffWeeks === 1) return 'hace 1 semana';
    if (diffWeeks < 4) return `hace ${diffWeeks} semanas`;
    if (diffMonths === 1) return 'hace 1 mes';
    if (diffMonths < 12) return `hace ${diffMonths} meses`;
    return `hace mas de 1 ano`;
};

interface CalificacionCardProps {
    calificacion: CalificacionCatedra;
    theme: any;
    index?: number;
    onVotar: (id: number, tipo: TipoVoto) => void;
    onReportar: (id: number) => void;
    onPress?: () => void;
    isOwner?: boolean;
}

const getRatingColor = (rating: number, theme: any): string => {
    if (rating >= 4.5) return theme.green || '#34C759';
    if (rating >= 3.5) return '#34C759';
    if (rating >= 2.5) return theme.orange || '#FF9500';
    if (rating >= 1.5) return '#FF9500';
    return theme.red || '#FF3B30';
};

export function CalificacionCard({
    calificacion,
    theme,
    index = 0,
    onVotar,
    onReportar,
    onPress,
    isOwner = false,
}: CalificacionCardProps) {
    const ratingColor = getRatingColor(Number(calificacion.rating) || 0, theme);
    const dificultadLabel = DIFICULTAD_LABELS[calificacion.dificultad];
    const dificultadColor = DIFICULTAD_COLORS[calificacion.dificultad];

    const fechaRelativa = formatRelativeTime(calificacion.createdAt);

    const handleVotar = (tipo: TipoVoto) => {
        if (isOwner) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onVotar(calificacion.id, tipo);
    };

    const handleReportar = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onReportar(calificacion.id);
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}
                onPress={onPress}
                activeOpacity={onPress ? 0.7 : 1}
                disabled={!onPress}
            >
                {/* Left strip color based on rating */}
                <View style={[styles.leftStrip, { backgroundColor: ratingColor }]} />

                <View style={styles.content}>
                    {/* Header row */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            {calificacion.esVerificado && (
                                <View style={[styles.verifiedBadge, { backgroundColor: theme.tint + '15' }]}>
                                    <Ionicons name="checkmark-circle" size={12} color={theme.tint} />
                                    <Text style={[styles.verifiedText, { color: theme.tint }]}>Verificado</Text>
                                </View>
                            )}
                            <View style={[styles.dificultadBadge, { backgroundColor: dificultadColor + '15' }]}>
                                <Text style={[styles.dificultadText, { color: dificultadColor }]}>
                                    {dificultadLabel}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.fecha, { color: theme.icon }]}>{fechaRelativa}</Text>
                    </View>

                    {/* Materia + Profesor */}
                    <Text style={[styles.materiaNombre, { color: theme.text }]} numberOfLines={1}>
                        {calificacion.materia.nombre}
                    </Text>
                    <View style={styles.profesorRow}>
                        <Ionicons name="person-outline" size={14} color={theme.icon} />
                        <Text style={[styles.profesorNombre, { color: theme.icon }]} numberOfLines={1}>
                            {calificacion.profesorNombre}
                        </Text>
                    </View>

                    {/* Rating stars */}
                    <View style={styles.ratingRow}>
                        <StarRating value={calificacion.rating || 0} readonly size={18} color={ratingColor} />
                        <Text style={[styles.ratingNumber, { color: ratingColor }]}>
                            {(Number(calificacion.rating) || 0).toFixed(1)}
                        </Text>
                    </View>

                    {/* Comentario */}
                    <Text style={[styles.comentario, { color: theme.text }]} numberOfLines={3}>
                        {calificacion.comentario}
                    </Text>

                    {/* Actions row */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                calificacion.miVoto === TipoVoto.Util && { backgroundColor: theme.green + '15' },
                            ]}
                            onPress={() => handleVotar(TipoVoto.Util)}
                            disabled={isOwner}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={calificacion.miVoto === TipoVoto.Util ? 'thumbs-up' : 'thumbs-up-outline'}
                                size={16}
                                color={calificacion.miVoto === TipoVoto.Util ? theme.green : theme.icon}
                            />
                            <Text
                                style={[
                                    styles.actionText,
                                    { color: calificacion.miVoto === TipoVoto.Util ? theme.green : theme.icon },
                                ]}
                            >
                                {calificacion.votosUtiles}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                calificacion.miVoto === TipoVoto.NoUtil && { backgroundColor: theme.red + '15' },
                            ]}
                            onPress={() => handleVotar(TipoVoto.NoUtil)}
                            disabled={isOwner}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={calificacion.miVoto === TipoVoto.NoUtil ? 'thumbs-down' : 'thumbs-down-outline'}
                                size={16}
                                color={calificacion.miVoto === TipoVoto.NoUtil ? theme.red : theme.icon}
                            />
                            <Text
                                style={[
                                    styles.actionText,
                                    { color: calificacion.miVoto === TipoVoto.NoUtil ? theme.red : theme.icon },
                                ]}
                            >
                                {calificacion.votosNoUtiles}
                            </Text>
                        </TouchableOpacity>

                        {!isOwner && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleReportar}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="flag-outline" size={16} color={theme.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        flexDirection: 'row',
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    leftStrip: {
        width: 6,
        height: '100%',
    },
    content: {
        flex: 1,
        padding: 14,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '600',
    },
    dificultadBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dificultadText: {
        fontSize: 11,
        fontWeight: '600',
    },
    fecha: {
        fontSize: 12,
    },
    materiaNombre: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    profesorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    profesorNombre: {
        fontSize: 14,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    ratingNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    comentario: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
