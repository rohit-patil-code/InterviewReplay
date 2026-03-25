"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string | null;
    is_verified?: boolean;

    created_at?: string;
}


interface UserContextType {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user only once on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await authApi.getMe();
                // The backend returns { user: ... }
                setUser(response.data.user);
            } catch (error) {
                console.log("Failed to fetch user (might not be logged in)", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const logout = () => {
        // In a real app you'd call an API to clear the cookie too
        setUser(null);
        window.location.href = "/";
    };

    return (
        <UserContext.Provider value={{ user, loading, setUser, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
