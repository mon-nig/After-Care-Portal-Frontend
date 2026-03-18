"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "GUEST" | "FAMILY" | "GN" | "GRAMA_NILADHARI" | "CITIZEN" | "DOCTOR" | "REGISTRAR" | "POLICE" | "CEMETERY";

interface AuthContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentUserId: number | null;
  setCurrentUserId: (id: number | null) => void;
  currentNicNo: string | null;
  setCurrentNicNo: (nicNo: string | null) => void;
  currentUsername: string | null;
  setCurrentUsername: (username: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<Role>("GUEST");
  const [currentUserId, setCurrentUserIdState] = useState<number | null>(null);
  const [currentNicNo, setCurrentNicNoState] = useState<string | null>(null);
  const [currentUsername, setCurrentUsernameState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("currentRole") as Role | null;
    const savedUserId = localStorage.getItem("currentUserId");
    const savedNicNo = localStorage.getItem("currentNicNo");
    const savedUsername = localStorage.getItem("currentUsername");
    if (savedRole) setCurrentRoleState(savedRole);
    if (savedUserId) setCurrentUserIdState(Number(savedUserId));
    if (savedNicNo) setCurrentNicNoState(savedNicNo);
    if (savedUsername) setCurrentUsernameState(savedUsername);
    setLoaded(true);
  }, []);

  const setCurrentRole = (role: Role) => {
    setCurrentRoleState(role);
    localStorage.setItem("currentRole", role);
    if (role === "GUEST") {
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentNicNo");
      localStorage.removeItem("currentUsername");
      setCurrentUserIdState(null);
      setCurrentNicNoState(null);
      setCurrentUsernameState(null);
    }
  };

  const setCurrentUserId = (id: number | null) => {
    setCurrentUserIdState(id);
    if (id) localStorage.setItem("currentUserId", String(id));
    else localStorage.removeItem("currentUserId");
  };

  const setCurrentNicNo = (nicNo: string | null) => {
    setCurrentNicNoState(nicNo);
    if (nicNo) localStorage.setItem("currentNicNo", nicNo);
    else localStorage.removeItem("currentNicNo");
  };

  const setCurrentUsername = (username: string | null) => {
    setCurrentUsernameState(username);
    if (username) localStorage.setItem("currentUsername", username);
    else localStorage.removeItem("currentUsername");
  };

  if (!loaded) return null;

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUserId,
        setCurrentUserId,
        currentNicNo,
        setCurrentNicNo,
        currentUsername,
        setCurrentUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}