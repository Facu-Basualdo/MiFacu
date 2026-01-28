import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MOTIVOS_REPORTE } from '../../types/calificaciones';

interface ReportarSheetProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (motivo: string) => Promise<void>;
    theme: any;
}

export function ReportarSheet({
    visible,
    onClose,
    onSubmit,
    theme,
}: ReportarSheetProps) {
    const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Animation values using RN Animated
    const slideAnim = useRef(new Animated.Value(400)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

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
                    toValue: 400,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!selectedMotivo || submitting) return;

        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await onSubmit(selectedMotivo);
            Alert.alert('Reporte enviado', 'Gracias por ayudarnos a mantener la comunidad segura.');
            setSelectedMotivo(null);
            onClose();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Error al enviar el reporte';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedMotivo(null);
        onClose();
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
                                    <Ionicons name="flag" size={24} color={theme.red} />
                                    <Text style={[styles.title, { color: theme.text }]}>Reportar reseña</Text>
                                </View>

                                <Text style={[styles.subtitle, { color: theme.icon }]}>
                                    Selecciona el motivo del reporte
                                </Text>

                                {/* Motivos */}
                                <View style={styles.motivosList}>
                                    {MOTIVOS_REPORTE.map((motivo, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.motivoItem,
                                                { borderColor: theme.separator },
                                                selectedMotivo === motivo && { backgroundColor: theme.tint + '15', borderColor: theme.tint },
                                            ]}
                                            onPress={() => {
                                                setSelectedMotivo(motivo);
                                                Haptics.selectionAsync();
                                            }}
                                        >
                                            <View style={styles.radio}>
                                                {selectedMotivo === motivo ? (
                                                    <View style={[styles.radioSelected, { backgroundColor: theme.tint }]}>
                                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                                    </View>
                                                ) : (
                                                    <View style={[styles.radioEmpty, { borderColor: theme.separator }]} />
                                                )}
                                            </View>
                                            <Text style={[styles.motivoText, { color: theme.text }]}>{motivo}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Submit button */}
                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        { backgroundColor: selectedMotivo ? theme.red : theme.separator },
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={!selectedMotivo || submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitText}>Enviar reporte</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                    <Text style={[styles.cancelText, { color: theme.tint }]}>Cancelar</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </TouchableWithoutFeedback>
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
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        paddingBottom: 34,
    },
    handleBar: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 20,
    },
    motivosList: {
        gap: 10,
        marginBottom: 24,
    },
    motivoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    radio: {
        marginRight: 12,
    },
    radioEmpty: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
    },
    radioSelected: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    motivoText: {
        fontSize: 15,
        flex: 1,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
    },
});
