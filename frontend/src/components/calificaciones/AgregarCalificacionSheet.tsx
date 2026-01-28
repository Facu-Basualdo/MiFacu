import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Switch,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StarRating } from './StarRating';
import { useMateriasSelector } from '../../hooks/useCalificaciones';
import { calificacionesApi } from '../../services/api';
import {
    Dificultad,
    CreateCalificacionDTO,
    DIFICULTAD_LABELS,
} from '../../types/calificaciones';

interface AgregarCalificacionSheetProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCalificacionDTO) => Promise<void>;
    theme: any;
    materiaIdInicial?: number;
    materiaNombreInicial?: string;
}

export function AgregarCalificacionSheet({
    visible,
    onClose,
    onSubmit,
    theme,
    materiaIdInicial,
    materiaNombreInicial,
}: AgregarCalificacionSheetProps) {
    const { materias, loading: loadingMaterias } = useMateriasSelector();

    const [materiaId, setMateriaId] = useState<number | null>(materiaIdInicial || null);
    const [profesorNombre, setProfesorNombre] = useState('');
    const [profesoresSugeridos, setProfesoresSugeridos] = useState<string[]>([]);
    const [showProfesoresList, setShowProfesoresList] = useState(false);
    const [rating, setRating] = useState(0);
    const [dificultad, setDificultad] = useState<Dificultad | null>(null);
    const [comentario, setComentario] = useState('');
    const [esAnonimo, setEsAnonimo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showMateriasList, setShowMateriasList] = useState(false);

    // Animation values using RN Animated
    const slideAnim = useRef(new Animated.Value(500)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    const materiaSeleccionada = materias.find(m => m.id === materiaId);

    // Sincronizar materia inicial cuando se abre el sheet
    useEffect(() => {
        if (visible && materiaIdInicial) {
            setMateriaId(materiaIdInicial);
        }
    }, [visible, materiaIdInicial]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 500,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    // Cargar profesores sugeridos cuando cambia la materia
    useEffect(() => {
        if (materiaId) {
            calificacionesApi.getProfesoresSugeridos(materiaId)
                .then(setProfesoresSugeridos)
                .catch(() => setProfesoresSugeridos([]));
        } else {
            setProfesoresSugeridos([]);
        }
    }, [materiaId]);

    const resetForm = () => {
        // Mantener la materia inicial si existe
        setMateriaId(materiaIdInicial || null);
        setProfesorNombre('');
        setRating(0);
        setDificultad(null);
        setComentario('');
        setEsAnonimo(false);
        setShowMateriasList(false);
        setShowProfesoresList(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValid = materiaId && profesorNombre.trim() && rating > 0 && dificultad && comentario.trim();

    const handleSubmit = async () => {
        if (!isValid || submitting) return;

        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await onSubmit({
                materiaId: materiaId!,
                profesorNombre: profesorNombre.trim(),
                rating,
                dificultad: dificultad!,
                comentario: comentario.trim(),
                esAnonimo,
            });
            resetForm();
            onClose();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Error al publicar la resena';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectProfesor = (nombre: string) => {
        setProfesorNombre(nombre);
        setShowProfesoresList(false);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={StyleSheet.absoluteFill}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <Animated.View style={[styles.overlay, { opacity: backdropAnim }]}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={styles.keyboardView}
                        >
                            <TouchableWithoutFeedback>
                                <Animated.View
                                    style={[
                                        styles.container,
                                        { backgroundColor: theme.backgroundSecondary },
                                        { transform: [{ translateY: slideAnim }] }
                                    ]}
                                >
                                    {/* Handle bar */}
                                    <View style={styles.handleBar}>
                                        <View style={[styles.handle, { backgroundColor: theme.icon + '40' }]} />
                                    </View>

                                    {/* Header */}
                                    <View style={styles.header}>
                                        <TouchableOpacity onPress={handleClose}>
                                            <Text style={[styles.cancelButton, { color: theme.tint }]}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.title, { color: theme.text }]}>Nueva Reseña</Text>
                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={!isValid || submitting}
                                        >
                                            {submitting ? (
                                                <ActivityIndicator size="small" color={theme.tint} />
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.submitButton,
                                                        { color: isValid ? theme.tint : theme.icon },
                                                    ]}
                                                >
                                                    Publicar
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                        {/* Selector de materia */}
                                        <View style={styles.field}>
                                            <Text style={[styles.label, { color: theme.text }]}>Materia</Text>
                                            <TouchableOpacity
                                                style={[styles.selector, { backgroundColor: theme.background, borderColor: theme.separator }]}
                                                onPress={() => setShowMateriasList(!showMateriasList)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.selectorText,
                                                        { color: materiaSeleccionada ? theme.text : theme.icon },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {materiaSeleccionada?.nombre || 'Seleccionar materia'}
                                                </Text>
                                                <Ionicons
                                                    name={showMateriasList ? 'chevron-up' : 'chevron-down'}
                                                    size={20}
                                                    color={theme.icon}
                                                />
                                            </TouchableOpacity>

                                            {showMateriasList && (
                                                <View style={[styles.list, { backgroundColor: theme.background, borderColor: theme.separator }]}>
                                                    {loadingMaterias ? (
                                                        <ActivityIndicator style={styles.listLoading} />
                                                    ) : (
                                                        <ScrollView style={styles.listScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                                            {materias.map(materia => (
                                                                <TouchableOpacity
                                                                    key={materia.id}
                                                                    style={[
                                                                        styles.listItem,
                                                                        materia.id === materiaId && { backgroundColor: theme.tint + '15' },
                                                                    ]}
                                                                    onPress={() => {
                                                                        setMateriaId(materia.id);
                                                                        setShowMateriasList(false);
                                                                        Haptics.selectionAsync();
                                                                    }}
                                                                >
                                                                    <Text style={[styles.listItemText, { color: theme.text }]} numberOfLines={1}>
                                                                        {materia.nombre}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    )}
                                                </View>
                                            )}
                                        </View>

                                        {/* Profesor */}
                                        <View style={styles.field}>
                                            <Text style={[styles.label, { color: theme.text }]}>Profesor/a</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.separator }]}
                                                value={profesorNombre}
                                                onChangeText={setProfesorNombre}
                                                placeholder="Nombre del profesor"
                                                placeholderTextColor={theme.icon}
                                                onFocus={() => setShowProfesoresList(true)}
                                            />
                                            {showProfesoresList && profesoresSugeridos.length > 0 && profesorNombre.length > 0 && (
                                                <View style={[styles.suggestions, { backgroundColor: theme.background, borderColor: theme.separator }]}>
                                                    {profesoresSugeridos
                                                        .filter(p => p.toLowerCase().includes(profesorNombre.toLowerCase()))
                                                        .slice(0, 5)
                                                        .map((prof, idx) => (
                                                            <TouchableOpacity
                                                                key={idx}
                                                                style={styles.suggestionItem}
                                                                onPress={() => handleSelectProfesor(prof)}
                                                            >
                                                                <Text style={[styles.suggestionText, { color: theme.text }]}>{prof}</Text>
                                                            </TouchableOpacity>
                                                        ))
                                                    }
                                                </View>
                                            )}
                                        </View>

                                        {/* Rating */}
                                        <View style={styles.field}>
                                            <Text style={[styles.label, { color: theme.text }]}>Calificación</Text>
                                            <View style={styles.ratingContainer}>
                                                <StarRating value={rating} onChange={setRating} size={36} />
                                                {rating > 0 && (
                                                    <Text style={[styles.ratingText, { color: theme.text }]}>{rating}/5</Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Dificultad */}
                                        <View style={styles.field}>
                                            <Text style={[styles.label, { color: theme.text }]}>Dificultad</Text>
                                            <View style={styles.dificultadRow}>
                                                {Object.values(Dificultad).map(d => (
                                                    <TouchableOpacity
                                                        key={d}
                                                        style={[
                                                            styles.dificultadButton,
                                                            { borderColor: theme.separator },
                                                            dificultad === d && { backgroundColor: theme.tint, borderColor: theme.tint },
                                                        ]}
                                                        onPress={() => {
                                                            setDificultad(d);
                                                            Haptics.selectionAsync();
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.dificultadText,
                                                                { color: dificultad === d ? '#fff' : theme.text },
                                                            ]}
                                                        >
                                                            {DIFICULTAD_LABELS[d]}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Comentario */}
                                        <View style={styles.field}>
                                            <Text style={[styles.label, { color: theme.text }]}>Comentario</Text>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    styles.textArea,
                                                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.separator },
                                                ]}
                                                value={comentario}
                                                onChangeText={setComentario}
                                                placeholder="Comparte tu experiencia con esta cátedra..."
                                                placeholderTextColor={theme.icon}
                                                multiline
                                                numberOfLines={4}
                                                textAlignVertical="top"
                                            />
                                        </View>

                                        {/* Anonimo switch */}
                                        <View style={[styles.switchRow, { borderColor: theme.separator }]}>
                                            <View style={styles.switchInfo}>
                                                <Text style={[styles.switchLabel, { color: theme.text }]}>Publicar como anónimo</Text>
                                                <Text style={[styles.switchHint, { color: theme.icon }]}>
                                                    Tu nombre no será visible en la reseña
                                                </Text>
                                            </View>
                                            <Switch
                                                value={esAnonimo}
                                                onValueChange={setEsAnonimo}
                                                trackColor={{ false: theme.separator, true: theme.tint + '80' }}
                                                thumbColor={esAnonimo ? theme.tint : '#f4f3f4'}
                                            />
                                        </View>

                                        <View style={{ height: 40 }} />
                                    </ScrollView>
                                </Animated.View>
                            </TouchableWithoutFeedback>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </TouchableWithoutFeedback>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    handleBar: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 5,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    cancelButton: {
        fontSize: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
    },
    submitButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    selectorText: {
        fontSize: 16,
        flex: 1,
    },
    list: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    listScroll: {
        maxHeight: 200,
    },
    listLoading: {
        padding: 20,
    },
    listItem: {
        padding: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    listItemText: {
        fontSize: 15,
    },
    input: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    suggestions: {
        marginTop: 4,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    suggestionText: {
        fontSize: 14,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
    },
    dificultadRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dificultadButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    dificultadText: {
        fontSize: 14,
        fontWeight: '600',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    switchInfo: {
        flex: 1,
        marginRight: 16,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    switchHint: {
        fontSize: 13,
        marginTop: 2,
    },
});
