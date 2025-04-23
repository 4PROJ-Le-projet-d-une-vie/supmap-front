// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
    email: string;
    username: string;
    token?: string;
};

type AuthContextType = {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => {},
    logout: () => {},
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (user: User) => setUser(user);
    const logout = () => setUser(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
