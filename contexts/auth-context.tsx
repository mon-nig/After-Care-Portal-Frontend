"use client";

import React, { createContext, useContext, useState } from "react";

// Added POLICE to the allowed roles
export type Role = "GUEST" | "FAMILY" | "GN" | "DOCTOR" | "REGISTRAR" | "POLICE";

interface AuthContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentUserId: number | null;
  setCurrentUserId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("GUEST");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  return (
    <AuthContext.Provider value={{ currentRole, setCurrentRole, currentUserId, setCurrentUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}