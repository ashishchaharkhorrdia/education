import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const bootstrapAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                const parsedUser = JSON.parse(storedUser);

                if (!parsedUser?.token) {
                    localStorage.removeItem('user');
                    if (isMounted) setUser(null);
                    return;
                }

                if (isMounted) setUser(parsedUser);

                try {
                    const response = await fetch(`${API_BASE}/api/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${parsedUser.token}`,
                        },
                    });

                    if (response.ok) {
                        const profile = await response.json();
                        const syncedUser = { ...parsedUser, ...profile, token: parsedUser.token };
                        localStorage.setItem('user', JSON.stringify(syncedUser));
                        if (isMounted) setUser(syncedUser);
                    } else if (response.status === 401) {
                        localStorage.removeItem('user');
                        if (isMounted) setUser(null);
                    }
                } catch (error) {
                    console.warn('Could not refresh auth session:', error);
                }
            } catch (error) {
                console.error("Failed to parse user data:", error);
                localStorage.removeItem('user');
                if (isMounted) setUser(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        bootstrapAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.role === 'admin') navigate('/admin-dashboard');
        else if (userData.role === 'teacher') navigate('/teacher-dashboard');
        else navigate('/dashboard');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        navigate('/');
    };

    const register = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.role === 'admin') navigate('/admin-dashboard');
        else if (userData.role === 'teacher') navigate('/teacher-dashboard');
        else navigate('/dashboard');
    };

    const updateUserSession = (userData) => {
        setUser((prev) => {
            const updated = { ...prev, ...userData };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateUserSession, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
