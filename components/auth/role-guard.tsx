"use client";

import { useAuth, Role } from "@/contexts/auth-context";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[]; // An array of roles allowed to see this
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { currentRole } = useAuth();

  // If the current role is not in the allowed list, block them
  if (!allowedRoles.includes(currentRole)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 border border-red-200 rounded-lg text-red-600 mt-8">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to view this section.</p>
        <p className="mt-2 text-sm opacity-80">Your current role: <strong>{currentRole}</strong></p>
      </div>
    );
  }

  // If they are allowed, show the content (like your B-24 form)
  return <>{children}</>;
}