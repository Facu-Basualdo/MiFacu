import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePremium } from '../src/context/PremiumContext';
import { useTheme } from '../src/context/ThemeContext';
import { Colors, mifacuNavy, mifacuGold } from '../src/constants/theme';

// Intentar importar RevenueCat UI
let RevenueCatUI: any = null;
let revenueCatUIAvailable = false;

try {
    RevenueCatUI = require('react-native-purchases-ui').default;
    revenueCatUIAvailable = true;
} catch (e) {
    console.log('RevenueCatUI not available');
    revenueCatUIAvailable = false;
}

export default function SubscriptionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark, colorScheme } = useTheme();
    const theme = Colors[colorScheme];
    const { isPro, refresh, loading } = usePremium();
    const [presented, setPresented] = useState(false);
    const hasPresented = useRef(false);

    useEffect(() => {
        if (hasPresented.current || loading) return;

        // Si ya es premium, no mostrar paywall
        if (isPro) return;

        // Presentar paywall nativo de RevenueCat
        if (revenueCatUIAvailable && RevenueCatUI) {
            hasPresented.current = true;
            setPresented(true);

            RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: 'premium',
            })
                .then(async (result: any) => {
                    // Refrescar estado premium
                    await refresh();
                    router.back();
                })
                .catch((error: any) => {
                    console.error('Error presenting paywall:', error);
                    router.back();
                });
        }
    }, [loading, isPro]);

    // Ya es premium
    if (isPro) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#050D1A'] : [mifacuNavy, '#0F1D45']}
                    style={styles.headerBackground}
                />
                <View style={[styles.alreadyPremiumContainer, { paddingTop: insets.top + 60 }]}>
                    <View style={styles.alreadyPremiumIcon}>
                        <Ionicons name="checkmark-circle" size={80} color={mifacuGold} />
                    </View>
                    <Text style={styles.alreadyPremiumTitle}>Ya eres Premium!</Text>
                    <Text style={styles.alreadyPremiumSubtitle}>
                        Tienes acceso a todas las funciones de miFACU
                    </Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: mifacuGold }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // RevenueCat UI no disponible (Expo Go) - mostrar mensaje
    if (!revenueCatUIAvailable) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#050D1A'] : [mifacuNavy, '#0F1D45']}
                    style={styles.headerBackground}
                />
                <View style={[styles.fallbackContainer, { paddingTop: insets.top + 60 }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close-circle" size={36} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <Ionicons name="star" size={60} color={mifacuGold} />
                    <Text style={styles.fallbackTitle}>miFACU Premium</Text>
                    <Text style={styles.fallbackSubtitle}>
                        La pasarela de pago no está disponible en este entorno.
                        Usa un build nativo para suscribirte.
                    </Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: mifacuGold, marginTop: 24 }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Loading / mientras se presenta el paywall nativo
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={mifacuGold} style={{ marginTop: insets.top + 100 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 320,
    },
    alreadyPremiumContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    alreadyPremiumIcon: {
        marginBottom: 24,
    },
    alreadyPremiumTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    alreadyPremiumSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 32,
    },
    backButton: {
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 14,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    fallbackContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    fallbackTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 12,
    },
    fallbackSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 22,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
});
