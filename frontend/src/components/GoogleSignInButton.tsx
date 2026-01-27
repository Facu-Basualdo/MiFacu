import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import { supabase } from '../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton() {
    const [isLoading, setIsLoading] = useState(false);

    const onSignIn = async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Generar redirect URL consistente según el entorno
            const redirectUrl = Linking.createURL('/');
            console.log('Google OAuth redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error('No se pudo obtener la URL de autenticación');

            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
            console.log('WebBrowser result type:', result.type);

            if (result.type === 'success' && result.url) {
                console.log('OAuth callback URL received');
                const hash = result.url.split('#')[1];
                if (hash) {
                    const params = new URLSearchParams(hash);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token
                        });
                        if (sessionError) throw sessionError;
                        console.log('Session establecida correctamente');
                    } else {
                        // Verificar si hay error en los params
                        const error = params.get('error');
                        const errorDescription = params.get('error_description');
                        if (error) {
                            throw new Error(errorDescription || error);
                        }
                        throw new Error('No se recibieron tokens de autenticación');
                    }
                } else {
                    throw new Error('Respuesta de autenticación incompleta');
                }
            } else if (result.type === 'cancel') {
                console.log('Usuario canceló el login');
                // No mostrar error si el usuario canceló
                return;
            } else if (result.type === 'dismiss') {
                console.log('Browser dismissed');
                return;
            }
        } catch (error: any) {
            console.error('Error en login de Google:', error);
            Alert.alert(
                "Error de autenticación",
                error.message || "No se pudo iniciar sesión con Google. Verifica tu conexión e intenta de nuevo."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={onSignIn}
            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            activeOpacity={0.8}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
            ) : (
                <>
                    <View style={styles.iconContainer}>
                        <FontAwesome name="google" size={20} color="#000" />
                    </View>
                    <Text style={styles.googleText}>Continuar con Google</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    googleButton: {
        backgroundColor: '#fff',
        height: 58,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    googleButtonDisabled: {
        opacity: 0.7,
    },
    iconContainer: {
        marginRight: 12,
    },
    googleText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 17,
        letterSpacing: -0.3,
    },
});
