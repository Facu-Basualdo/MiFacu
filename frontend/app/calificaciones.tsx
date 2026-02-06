import React, { useState, useCallback } from 'react';
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
import { useCalificaciones } from '../src/hooks/useCalificaciones';
import { CalificacionCatedra, TipoVoto, CreateCalificacionDTO } from '../src/types/calificaciones';
import { CalificacionCard } from '../src/components/calificaciones/CalificacionCard';
import { AgregarCalificacionSheet } from '../src/components/calificaciones/AgregarCalificacionSheet';
import { ReportarSheet } from '../src/components/calificaciones/ReportarSheet';
import { PremiumGate } from '../src/components/premium';

function CalificacionesContent() {
    const router = useRouter();
    const { materiaId, materiaNombre } = useLocalSearchParams<{ materiaId?: string; materiaNombre?: string }>();
    const { colorScheme, isDark } = useTheme();
    const { user } = useAuth();
    const theme = Colors[colorScheme];

    // Parsear materiaId si viene como string
    const materiaIdNumber = materiaId ? parseInt(materiaId, 10) : undefined;

    const {
        calificaciones,
        loading,
        refreshing,
        isLoggedIn,
        crearCalificacion,
        votar,
        reportar,
        eliminarCalificacion,
        refetch,
    } = useCalificaciones(materiaIdNumber);

    // Estado para los modales
    const [showAgregarSheet, setShowAgregarSheet] = useState(false);
    const [showReportarSheet, setShowReportarSheet] = useState(false);
    const [calificacionAReportar, setCalificacionAReportar] = useState<number | null>(null);

    // Handlers
    const handleVotar = useCallback((id: number, tipo: TipoVoto) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        votar(id, tipo);
    }, [votar]);

    const handleEliminar = useCallback((id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        eliminarCalificacion(id);
    }, [eliminarCalificacion]);

    const handleReportar = useCallback((id: number) => {
        setCalificacionAReportar(id);
        setShowReportarSheet(true);
    }, []);

    const handleSubmitReporte = useCallback(async (motivo: string) => {
        if (calificacionAReportar) {
            await reportar(calificacionAReportar, motivo);
            setCalificacionAReportar(null);
        }
    }, [calificacionAReportar, reportar]);

    const handleCrearCalificacion = useCallback(async (data: CreateCalificacionDTO) => {
        await crearCalificacion(data);
    }, [crearCalificacion]);

    const handleOpenAgregar = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowAgregarSheet(true);
    }, []);

    // Render item para FlatList
    const renderItem = useCallback(({ item, index }: { item: CalificacionCatedra; index: number }) => (
        <CalificacionCard
            calificacion={item}
            theme={theme}
            index={index}
            onVotar={handleVotar}
            onReportar={handleReportar}
            onEliminar={handleEliminar}
            isOwner={item.userId === user?.id}
        />
    ), [theme, handleVotar, handleReportar, handleEliminar, user?.id]);

    const keyExtractor = useCallback((item: CalificacionCatedra) => item.id.toString(), []);

    // Pantalla de login requerido
    if (!isLoggedIn) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <SafeAreaView style={styles.authContainer}>
                    <View style={styles.authContent}>
                        <View style={[styles.authIconContainer, { backgroundColor: theme.tint + '15' }]}>
                            <Ionicons name="star" size={48} color={theme.tint} />
                        </View>
                        <Text style={[styles.authTitle, { color: theme.text }]}>
                            Reseñas de Cátedras
                        </Text>
                        <Text style={[styles.authSubtitle, { color: theme.icon }]}>
                            Inicia sesión para ver y compartir reseñas de profesores y materias
                        </Text>
                        <TouchableOpacity
                            style={[styles.authButton, { backgroundColor: theme.tint }]}
                            onPress={() => router.push('/(auth)/login' as any)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.authButtonText}>Iniciar sesión</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Componente de estado vacío
    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.tint + '10' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Aún no hay reseñas
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
                ¡Sé el primero en compartir tu experiencia con una cátedra!
            </Text>
            <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.tint }]}
                onPress={handleOpenAgregar}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Escribir reseña</Text>
            </TouchableOpacity>
        </View>
    );

    // Header del listado
    const ListHeader = () => (
        <View style={styles.listHeader}>
            <Text style={[styles.listHeaderTitle, { color: theme.text }]}>
                {calificaciones.length} {calificaciones.length === 1 ? 'reseña' : 'reseñas'}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                            {materiaNombre || 'Reseñas'}
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

            {/* Lista de calificaciones */}
            <FlatList
                data={calificaciones}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={[
                    styles.listContent,
                    calificaciones.length === 0 && styles.listContentEmpty,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                ListHeaderComponent={calificaciones.length > 0 ? ListHeader : null}
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

            {/* FAB para agregar (alternativo al botón del header) */}
            {calificaciones.length > 3 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.tint }]}
                    onPress={handleOpenAgregar}
                    activeOpacity={0.9}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Modal para agregar calificación */}
            <AgregarCalificacionSheet
                visible={showAgregarSheet}
                onClose={() => setShowAgregarSheet(false)}
                onSubmit={handleCrearCalificacion}
                theme={theme}
                materiaIdInicial={materiaIdNumber}
                materiaNombreInicial={materiaNombre}
            />

            {/* Modal para reportar */}
            <ReportarSheet
                visible={showReportarSheet}
                onClose={() => {
                    setShowReportarSheet(false);
                    setCalificacionAReportar(null);
                }}
                onSubmit={handleSubmitReporte}
                theme={theme}
            />
        </KeyboardAvoidingView>
    );
}

export default function CalificacionesScreen() {
    return (
        <PremiumGate featureName="Reseñas de Cátedras">
            <CalificacionesContent />
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
    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    inlineLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    // Header styles
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
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // List styles
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
    // Empty state styles
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
    // FAB styles
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
