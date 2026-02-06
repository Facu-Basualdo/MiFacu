import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Platform,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useTemasFinales } from '../src/hooks/useTemasFinales';
import { TemaFinal, TipoVoto, CreateTemaFinalDTO, EstadisticaTema } from '../src/types/temas-finales';
import { TemaFinalCard } from '../src/components/temas-finales/TemaFinalCard';
import { AgregarTemaSheet } from '../src/components/temas-finales/AgregarTemaSheet';
import { ReportarSheet } from '../src/components/calificaciones/ReportarSheet';
import { PremiumGate } from '../src/components/premium';

function TemasFinalesContent() {
    const router = useRouter();
    const { materiaId, materiaNombre } = useLocalSearchParams<{ materiaId?: string; materiaNombre?: string }>();
    const { colorScheme, isDark } = useTheme();
    const { user } = useAuth();
    const theme = Colors[colorScheme];

    const materiaIdNumber = materiaId ? parseInt(materiaId, 10) : undefined;

    const {
        temas,
        loading,
        refreshing,
        isLoggedIn,
        crearTema,
        votar,
        reportar,
        eliminarTema,
        getEstadisticas,
        refetch,
    } = useTemasFinales(materiaIdNumber);

    const [showAgregarSheet, setShowAgregarSheet] = useState(false);
    const [showReportarSheet, setShowReportarSheet] = useState(false);
    const [temaAReportar, setTemaAReportar] = useState<number | null>(null);
    const [estadisticas, setEstadisticas] = useState<EstadisticaTema[]>([]);
    const [showAllStats, setShowAllStats] = useState(false);

    // Cargar estadisticas
    useEffect(() => {
        if (materiaIdNumber && isLoggedIn) {
            getEstadisticas(materiaIdNumber)
                .then(setEstadisticas)
                .catch(() => setEstadisticas([]));
        }
    }, [materiaIdNumber, isLoggedIn, temas.length]);

    const handleVotar = useCallback((id: number, tipo: TipoVoto) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        votar(id, tipo);
    }, [votar]);

    const handleEliminar = useCallback((id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        eliminarTema(id);
    }, [eliminarTema]);

    const handleReportar = useCallback((id: number) => {
        setTemaAReportar(id);
        setShowReportarSheet(true);
    }, []);

    const handleSubmitReporte = useCallback(async (motivo: string) => {
        if (temaAReportar) {
            await reportar(temaAReportar, motivo);
            setTemaAReportar(null);
        }
    }, [temaAReportar, reportar]);

    const handleCrearTema = useCallback(async (data: CreateTemaFinalDTO) => {
        await crearTema(data);
    }, [crearTema]);

    const handleOpenAgregar = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowAgregarSheet(true);
    }, []);

    const renderItem = useCallback(({ item, index }: { item: TemaFinal; index: number }) => (
        <TemaFinalCard
            tema={item}
            theme={theme}
            index={index}
            onVotar={handleVotar}
            onReportar={handleReportar}
            onEliminar={handleEliminar}
            isOwner={item.userId === user?.id}
        />
    ), [theme, handleVotar, handleReportar, handleEliminar, user?.id]);

    const keyExtractor = useCallback((item: TemaFinal) => item.id.toString(), []);

    // Login required
    if (!isLoggedIn) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <SafeAreaView style={styles.authContainer}>
                    <View style={styles.authContent}>
                        <View style={[styles.authIconContainer, { backgroundColor: (theme.orange || '#FF9500') + '15' }]}>
                            <Ionicons name="bulb" size={48} color={theme.orange || '#FF9500'} />
                        </View>
                        <Text style={[styles.authTitle, { color: theme.text }]}>
                            Temas de Finales
                        </Text>
                        <Text style={[styles.authSubtitle, { color: theme.icon }]}>
                            Inicia sesion para ver y compartir temas frecuentes de finales
                        </Text>
                        <TouchableOpacity
                            style={[styles.authButton, { backgroundColor: theme.tint }]}
                            onPress={() => router.push('/(auth)/login' as any)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.authButtonText}>Iniciar sesion</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Stats component with expand/collapse
    const StatsHeader = () => {
        if (estadisticas.length === 0) return null;

        const visibleStats = showAllStats ? estadisticas : estadisticas.slice(0, 3);
        const totalReportes = estadisticas.reduce((sum, e) => sum + e.veces, 0);
        const medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];

        return (
            <View style={[styles.statsContainer, { backgroundColor: isDark ? '#1F2937' : '#FFF7ED' }]}>
                <View style={styles.statsHeader}>
                    <Ionicons name="trending-up" size={18} color={theme.orange || '#FF9500'} />
                    <Text style={[styles.statsTitle, { color: theme.text }]}>Temas mas frecuentes</Text>
                </View>
                {visibleStats.map((stat, idx) => {
                    const porcentaje = totalReportes > 0 ? Math.round((stat.veces / totalReportes) * 100) : 0;
                    const isTop3 = idx < 3;
                    return (
                        <View key={idx} style={styles.statRow}>
                            {isTop3 ? (
                                <Text style={styles.statMedal}>{medals[idx]}</Text>
                            ) : (
                                <Text style={[styles.statPosition, { color: theme.icon }]}>{idx + 1}.</Text>
                            )}
                            <View style={styles.statInfo}>
                                <Text style={[styles.statTema, { color: theme.text }]} numberOfLines={1}>
                                    {stat.tema}
                                </Text>
                                <View style={styles.statBarContainer}>
                                    <View
                                        style={[
                                            styles.statBar,
                                            {
                                                width: `${Math.max(porcentaje, 5)}%`,
                                                backgroundColor: (theme.orange || '#FF9500') + (idx === 0 ? 'CC' : idx === 1 ? '99' : idx === 2 ? '66' : '50'),
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text style={[styles.statCount, { color: theme.icon }]}>
                                {stat.veces}x ({porcentaje}%)
                            </Text>
                        </View>
                    );
                })}
                {estadisticas.length > 3 && (
                    <TouchableOpacity
                        style={styles.showAllButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowAllStats(!showAllStats);
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.showAllText, { color: theme.tint }]}>
                            {showAllStats ? 'Ver menos' : `Ver todos (${estadisticas.length})`}
                        </Text>
                        <Ionicons
                            name={showAllStats ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={theme.tint}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Empty state
    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: (theme.orange || '#FF9500') + '10' }]}>
                <Ionicons name="bulb-outline" size={64} color={theme.orange || '#FF9500'} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Aun no hay temas reportados
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
                Se el primero en compartir que temas te tomaron en el final!
            </Text>
            <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.tint }]}
                onPress={handleOpenAgregar}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Agregar tema</Text>
            </TouchableOpacity>
        </View>
    );

    // List header
    const ListHeader = () => (
        <View>
            <StatsHeader />
            <View style={styles.listHeader}>
                <Text style={[styles.listHeaderTitle, { color: theme.text }]}>
                    {temas.length} {temas.length === 1 ? 'tema reportado' : 'temas reportados'}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header con blur */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <BlurView
                    intensity={isDark ? 40 : 80}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.headerBlur}
                >
                    <View style={[styles.header, { borderBottomColor: theme.separator }]}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chevron-back" size={28} color={theme.tint} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                            {materiaNombre || 'Temas de Finales'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.tint }]}
                            onPress={handleOpenAgregar}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </SafeAreaView>

            {/* Lista de temas */}
            <FlatList
                data={temas}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={[
                    styles.listContent,
                    temas.length === 0 && styles.listContentEmpty,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                ListHeaderComponent={temas.length > 0 ? ListHeader : null}
                ListEmptyComponent={() => (
                    loading && !refreshing ? (
                        <View style={styles.inlineLoadingContainer}>
                            <ActivityIndicator size="large" color={theme.tint} />
                        </View>
                    ) : (
                        <EmptyState />
                    )
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refetch}
                        tintColor={theme.tint}
                        colors={[theme.tint]}
                    />
                }
            />

            {/* FAB */}
            {temas.length > 3 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.tint }]}
                    onPress={handleOpenAgregar}
                    activeOpacity={0.9}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Modal para agregar tema */}
            <AgregarTemaSheet
                visible={showAgregarSheet}
                onClose={() => setShowAgregarSheet(false)}
                onSubmit={handleCrearTema}
                theme={theme}
                materiaIdInicial={materiaIdNumber}
                materiaNombreInicial={materiaNombre}
            />

            {/* Modal para reportar */}
            <ReportarSheet
                visible={showReportarSheet}
                onClose={() => {
                    setShowReportarSheet(false);
                    setTemaAReportar(null);
                }}
                onSubmit={handleSubmitReporte}
                theme={theme}
            />
        </KeyboardAvoidingView>
    );
}

export default function TemasFinalesScreen() {
    return (
        <PremiumGate featureName="Temas de Finales">
            <TemasFinalesContent />
        </PremiumGate>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Auth styles
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    authContent: {
        alignItems: 'center',
    },
    authIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    authTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    authSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    authButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    authButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Loading
    inlineLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    // Header
    headerSafeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerBlur: {
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Stats
    statsContainer: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statsTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statMedal: {
        fontSize: 18,
        width: 24,
    },
    statPosition: {
        fontSize: 14,
        fontWeight: '600',
        width: 24,
        textAlign: 'center',
    },
    statInfo: {
        flex: 1,
    },
    statTema: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statBarContainer: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    statBar: {
        height: '100%',
        borderRadius: 3,
    },
    statCount: {
        fontSize: 12,
        fontWeight: '500',
        minWidth: 70,
        textAlign: 'right',
    },
    showAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 4,
        paddingVertical: 8,
    },
    showAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // List
    listContent: {
        paddingTop: Platform.OS === 'ios' ? 110 : 100,
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    listContentEmpty: {
        flex: 1,
    },
    listHeader: {
        marginBottom: 16,
    },
    listHeaderTitle: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.7,
    },
    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
