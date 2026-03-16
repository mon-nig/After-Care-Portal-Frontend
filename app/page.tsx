"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { DeathDeclarationForm } from "../components/death-declaration-CR02/death-declaration-form";
import { B24Form } from "../components/B24-report/b24-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { NotificationBell } from "../components/NotificationBell";
import { FormTracker } from "../components/FormTracker";
import { RecordHistoryModal } from "../components/RecordHistoryModal";
import { History } from "lucide-react";

export default function Page() {
  const { currentRole, setCurrentRole, currentUsername } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // GN/GRAMA_NILADHARI can ONLY see B24 (no CR02)
  const canViewB24 = ["GN", "GRAMA_NILADHARI"].includes(currentRole);
  // REGISTRAR can see CR02 (and uses notifications for B24 review)
  const canViewCR2 = ["REGISTRAR"].includes(currentRole);

  useEffect(() => {
    setIsMounted(true);
    if (currentRole === "GUEST") {
      router.push("/login");
    }
  }, [currentRole, router]);

  if (!isMounted || currentRole === "GUEST") return null;

  const defaultTab = canViewB24 ? "b24" : (canViewCR2 ? "death-declaration" : "");

  // Logout function
  const handleLogout = () => {
    setCurrentRole("GUEST");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        
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
            {(canViewB24 || canViewCR2) && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-[#4a7c9f] transition-colors"
              >
                <History className="size-4" />
                History
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {currentRole === "FAMILY" ? (
            <FormTracker />
          ) : !canViewCR2 && !canViewB24 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900">Welcome to the Portal</h2>
              <p className="mt-2 text-sm text-gray-500">There are no forms assigned to your role at this time.</p>
            </div>
          ) : (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="w-full mb-6 flex-wrap h-auto gap-1 p-1">
                {canViewB24 && (
                  <TabsTrigger value="b24" className="flex-1 text-xs sm:text-sm">
                    B24 &mdash; GN Death Report
                  </TabsTrigger>
                )}
                {canViewCR2 && (
                  <TabsTrigger value="death-declaration" className="flex-1 text-xs sm:text-sm">
                    CR2 &mdash; Death (Normal/Sudden)
                  </TabsTrigger>
                )}
              </TabsList>

              {canViewB24 && (
                <TabsContent value="b24">
                  <B24Form />
                </TabsContent>
              )}

              {canViewCR2 && (
                <TabsContent value="death-declaration">
                  <DeathDeclarationForm />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>

      </div>

      {/* Record History Modal */}
      {(canViewB24 || canViewCR2) && (
        <RecordHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          role={canViewB24 ? "GN" : "REGISTRAR"}
          username={currentUsername || ""}
        />
      )}
    </main>
  );
}