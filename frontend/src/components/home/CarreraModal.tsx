import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
    Animated,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { mifacuNavy, mifacuGold } from '../../constants/theme';
import type { ThemeColors } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Datos Mockup (Arquitectura escalable)
const UNIVERSIDADES = [
    {
        id: 'utn_frre',
        nombre: 'UTN - Facultad Regional Resistencia',
        logo: 'school',
        carreras: [
            { id: 'isi', nombre: 'Ingeniería en Sistemas de Información' },
        ],
    },
];

interface CarreraModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (carrera: string) => void;
    theme: ThemeColors;
    isDarkMode: boolean;
}

export const CarreraModal = ({
    visible,
    onClose,
    onSelect,
    theme,
    isDarkMode,
}: CarreraModalProps) => {
    const [step, setStep] = useState<'universidad' | 'carrera'>('universidad');
    const [selectedUni, setSelectedUni] = useState<string | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (visible) {
            setStep('universidad');
            setSelectedUni(null);
        }
    }, [visible]);

    const handleSelectUni = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedUni(id);
        setStep('carrera');
    };

    const handleSelectCarrera = (nombre: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSelect(nombre);
    };

    const renderUniversidad = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Seleccioná tu Universidad</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
                Para ofrecerte los horarios y materias correctos
            </Text>

            {UNIVERSIDADES.map((uni) => (
                <TouchableOpacity
                    key={uni.id}
                    style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.separator }]}
                    onPress={() => handleSelectUni(uni.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconBox, { backgroundColor: mifacuNavy }]}>
                        <Ionicons name="school" size={24} color={mifacuGold} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{uni.nombre}</Text>
                        <Text style={[styles.cardSubtitle, { color: theme.icon }]}>Chaco, Argentina</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.separator} />
                </TouchableOpacity>
            ))}

            <View style={styles.futureNotice}>
                <Ionicons name="information-circle-outline" size={16} color={theme.icon} />
                <Text style={[styles.futureNoticeText, { color: theme.icon }]}>
                    Próximamente más universidades disponibles
                </Text>
            </View>
        </View>
    );

    const renderCarrera = () => {
        const uni = UNIVERSIDADES.find((u) => u.id === selectedUni);
        return (
            <View style={styles.stepContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep('universidad')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.tint} />
                    <Text style={[styles.backText, { color: theme.tint }]}>Volver</Text>
                </TouchableOpacity>

                <Text style={[styles.title, { color: theme.text }]}>Elegí tu Carrera</Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {uni?.nombre}
                </Text>

                {uni?.carreras.map((carrera) => (
                    <TouchableOpacity
                        key={carrera.id}
                        style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.separator }]}
                        onPress={() => handleSelectCarrera(carrera.nombre)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: mifacuGold }]}>
                            <Ionicons name="code-slash" size={24} color={mifacuNavy} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{carrera.nombre}</Text>
                        </View>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.tint} />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                <View style={[styles.sheet, { backgroundColor: theme.background }]}>
                    <View style={[styles.handle, { backgroundColor: theme.separator }]} />

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {step === 'universidad' ? renderUniversidad() : renderCarrera()}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.icon }]}>
                            Identidad Académica miFACU 🏛️
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        height: SCREEN_HEIGHT * 0.75,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    stepContainer: {
        flex: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 32,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
    },
    futureNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    futureNoticeText: {
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 10,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
