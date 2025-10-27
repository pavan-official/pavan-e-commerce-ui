"use client";

import { CustomUser } from "@/lib/custom-auth";
import { useCallback, useEffect, useState } from "react";

interface UseCustomAuthReturn {
  user: CustomUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
  retrySession: () => void;
}

export function useCustomAuth(): UseCustomAuthReturn {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Add a small delay to ensure server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await fetch("/api/auth/custom-session/", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Auth hook - session check successful:", data.user);
        setUser(data.user);
        setError(null);
      } else {
        console.log("Auth hook - session check failed:", response.status);
        setUser(null);
        setError(null);
      }
    } catch (err) {
      console.error("Session check error:", err);
      setUser(null);
      setError(null); // Don't show error on session check failure
    } finally {
      setLoading(false);
    }
  }, []);

  // Simple session check on mount with delay to ensure server is ready
  useEffect(() => {
    // Clear any cached error state immediately
    setError(null);

    const timer = setTimeout(() => {
      checkSession();
    }, 100);

    // Fallback: set loading to false after 3 seconds if session check doesn't complete
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []); // Remove checkSession from dependencies to prevent infinite loops

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/auth/custom-login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        console.log("Login successful, setting user:", data.user);
        setUser(data.user);
        setError(null);
        setLoading(false);
        return true;
      } else {
        console.log("Login failed:", data.error);
        setError(data.error || "Login failed");
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
      setLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      await fetch("/api/auth/custom-logout/", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      setError(null);
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    error,
    retrySession: checkSession,
  };
}
