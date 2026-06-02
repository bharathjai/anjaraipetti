import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/runtime";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("anjaraipetti_customer_token") || null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) {
            setUser(data.user);
            if (data.user.phone) {
              localStorage.setItem("anjaraipetti_customer_phone", data.user.phone);
            }
          } else {
            handleLogoutState();
          }
        } else {
          handleLogoutState();
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        // We do not clear credentials on simple network errors to prevent aggressive logout
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleLogoutState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("anjaraipetti_customer_token");
    localStorage.removeItem("anjaraipetti_customer_phone");
  };

  const loginWithGoogle = async (googleCredential) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: googleCredential })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem("anjaraipetti_customer_token", data.token);
        if (data.user.phone) {
          localStorage.setItem("anjaraipetti_customer_phone", data.user.phone);
        }
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        throw new Error(data.message || "Failed to authenticate with Google");
      }
    } catch (err) {
      console.error("Google login error:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error("Backend logout call error:", err);
    } finally {
      handleLogoutState();
    }
  };

  const updateProfile = async ({ name, phone, addresses }) => {
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, addresses })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setUser(data.user);
        if (data.user.phone) {
          localStorage.setItem("anjaraipetti_customer_phone", data.user.phone);
        } else {
          localStorage.removeItem("anjaraipetti_customer_phone");
        }
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogle,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
