import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isGuest: boolean;
    loading: boolean;
    signInAsGuest: () => void;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isGuest: false,
    loading: true,
    signInAsGuest: () => { },
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (!session) {
                // If no session found initially, we might be in guest mode or just not logged in.
                // We'll let the Login screen handle the decision to go Guest or Login.
                // But if we clearly want to persist "Guest" state, we could use AsyncStorage.
                // For now, "No Session" AND "isGuest = true" means Guest.
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session) {
                setIsGuest(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInAsGuest = () => {
        setIsGuest(true);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setIsGuest(false);
    };

    return (
        <AuthContext.Provider value={{ session, user, isGuest, loading, signInAsGuest, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
