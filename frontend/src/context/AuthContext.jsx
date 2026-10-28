import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { AuthContext } from "./authContextDef";
import { getCurrentUser, loginUser, registerUser } from "../api/auth";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setUser(null);
            return null;
        }

        try {
            const data = await getCurrentUser();
            setUser(data);
            return data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("access_token");
                setUser(null);
            }

            throw error;
        }
    }, []);

    const login = useCallback(
        async (email, password) => {
            const data = await loginUser(email, password);

            localStorage.setItem("access_token", data.access_token);

            try {
                const currentUser = await refreshUser();
                return currentUser;
            } catch (error) {
                localStorage.removeItem("access_token");
                setUser(null);
                throw error;
            }
        },
        [refreshUser],
    );

    const register = useCallback(async (userData) => {
        const data = await registerUser(userData);
        return data;
    }, []);

    useEffect(() => {
        let active = true;

        async function initializeAuth() {
            try {
                const token = localStorage.getItem("access_token");

                if (token) {
                    const data = await getCurrentUser();

                    if (active) {
                        setUser(data);
                    }
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("access_token");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        initializeAuth();

        return () => {
            active = false;
        };
    }, []);

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
