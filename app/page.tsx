"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { DeathDeclarationForm } from "../components/death-declaration-CR02/death-declaration-form";
import { B24Form } from "../components/B24-report/b24-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { NotificationBell } from "../components/NotificationBell";
import { FormTracker } from "../components/FormTracker";
import { CemeteryDashboard } from "../components/CemeteryDashboard";

import { FamilyDashboard } from "../components/dashboards/FamilyDashboard";
import { DoctorDashboard } from "../components/dashboards/DoctorDashboard";
import { GNDashboard } from "../components/dashboards/GNDashboard";
import { RegistrarDashboard } from "../components/dashboards/RegistrarDashboard";

export default function Page() {
  const { currentRole, setCurrentRole, currentUsername } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (currentRole === "GUEST") {
      router.push("/login");
    }
  }, [currentRole, router]);

  if (!isMounted || currentRole === "GUEST") return null;

  // Logout function
  const handleLogout = () => {
    setCurrentRole("GUEST");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        
        {/* Header with Logout Button */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">After-Care Portal</h1>
            <p className="text-sm text-gray-500">
              Logged in as: <span className="font-semibold text-blue-600">{currentUsername || currentRole}</span>
              {" "}<span className="text-xs text-gray-400">({currentRole})</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {currentRole === "FAMILY" && (
            <Tabs defaultValue="cases" className="w-full">
              <TabsList className="w-full mb-6 flex h-auto gap-1 p-1 bg-gray-100/80">
                <TabsTrigger value="cases" className="flex-1">Death Registration Cases</TabsTrigger>
                <TabsTrigger value="tracker" className="flex-1">Standalone Form Tracker</TabsTrigger>
              </TabsList>
              <TabsContent value="cases"><FamilyDashboard /></TabsContent>
              <TabsContent value="tracker"><FormTracker /></TabsContent>
            </Tabs>
          )}

          {currentRole === "DOCTOR" && (
            <DoctorDashboard />
          )}

          {(currentRole === "GN" || currentRole === "GRAMA_NILADHARI") && (
            <Tabs defaultValue="cases" className="w-full">
              <TabsList className="w-full mb-6 flex h-auto gap-1 p-1 bg-gray-100/80">
                <TabsTrigger value="cases" className="flex-1">Pending Verifications (B-24 Phase)</TabsTrigger>
                <TabsTrigger value="standalone" className="flex-1">Create Standalone B-24 Report</TabsTrigger>
              </TabsList>
              <TabsContent value="cases"><GNDashboard /></TabsContent>
              <TabsContent value="standalone"><B24Form /></TabsContent>
            </Tabs>
          )}

          {currentRole === "REGISTRAR" && (
            <Tabs defaultValue="cases" className="w-full">
              <TabsList className="w-full mb-6 flex flex-wrap h-auto gap-1 p-1 bg-gray-100/80">
                <TabsTrigger value="cases" className="flex-1">Final Issuance (B-2 Phase)</TabsTrigger>
                <TabsTrigger value="standalone" className="flex-1">Standalone CR02 Review</TabsTrigger>
              </TabsList>
              <TabsContent value="cases"><RegistrarDashboard /></TabsContent>
              <TabsContent value="standalone"><DeathDeclarationForm /></TabsContent>
            </Tabs>
          )}

          {currentRole === "CEMETERY" && (
            <CemeteryDashboard />
          )}

          {/* Fallback for unknown edge-case roles */}
          {!["FAMILY", "DOCTOR", "GN", "GRAMA_NILADHARI", "REGISTRAR", "CEMETERY"].includes(currentRole) && (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900">Welcome to the Portal</h2>
              <p className="mt-2 text-sm text-gray-500">There are no forms assigned to your role at this time.</p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}