'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCookie, setCookie } from 'cookies-next';
import { User } from '../types/auth';
import { redirect, useRouter } from 'next/navigation';

// Define the context value type
interface UserContextValue {
    user: User | null;
    isLoading: boolean;
    login: (redirectUrl?: string) => Promise<void>;
    logout: (redirectUrl?: string) => Promise<void>;
    refreshUser: (session?: string) => Promise<void>;
    setUserFromSession: (session: string) => Promise<void>;
}

// Create the context
const UserContext = createContext<UserContextValue | undefined>(undefined);

// Custom hook to use the user context
export const useUser = (session: string | null) => {
    const router = useRouter();
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }

    // If session is provided, automatically fetch user data
    useEffect(() => {
        const currentSession = getCookie('fe-chat-session') as string;
        if (session && session !== currentSession) {
            context.setUserFromSession(session);
        }
    }, [session, context]);

    useEffect(() => {
        if (session && !context.isLoading) router.replace('/')
    }, [session, context.isLoading, router]);

    return context;
};

// Provider component props
interface UserProviderProps {
    children: ReactNode;
}

// Provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Function to fetch user data
    const fetchUser = async (sessionToken?: string): Promise<User | null> => {
        try {
            const session = sessionToken || (await getCookie('fe-chat-session')) as string;

            if (!session) {
                return null;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_IAM_URL}/api/account`, {
                headers: { session },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch user');
            }

            const data = await res.json();
            return data.user || null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    };

    // Login function
    const login = async (redirectUrl?: string) => {
        router.push(`${process.env.NEXT_PUBLIC_IAM_URL}/auth/signin?redirectUrl=${redirectUrl || window.location.origin}`)
    };

    // Logout function
    const logout = async (redirectUrl?: string) => {
        setIsLoading(true);
        try {
            const session = await getCookie('fe-chat-session') as string;

            if (session) {
                await fetch(`${process.env.NEXT_PUBLIC_IAM_URL}/api/signout`, {
                    method: 'POST',
                    headers: { session },
                    body: JSON.stringify({ sessionId: 'current' }),
                });
            }

            setUser(null);
            setCookie('fe-chat-session', '', { maxAge: -1 });
            if (redirectUrl) {
                router.replace(redirectUrl || window.location.origin);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh user function
    const refreshUser = async (sessionToken?: string) => {
        setIsLoading(true);
        try {
            const userData = await fetchUser(sessionToken);
            setUser(userData);
        } catch (error) {
            console.error('Refresh user error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Set user from session (similar to login but without redirecting)
    const setUserFromSession = async (session: string) => {
        setIsLoading(true);
        try {
            await setCookie('fe-chat-session', session);
            const userData = await fetchUser(session);
            setUser(userData);
        } catch (error) {
            console.error('Set user from session error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize user on mount
    useEffect(() => {
        const initializeUser = async () => {
            setIsLoading(true);
            try {
                const userData = await fetchUser();
                setUser(userData);
            } catch (error) {
                console.error('Initialize user error:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeUser();
    }, []);

    const contextValue: UserContextValue = {
        user,
        isLoading,
        login,
        logout,
        refreshUser,
        setUserFromSession,
    }; return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;