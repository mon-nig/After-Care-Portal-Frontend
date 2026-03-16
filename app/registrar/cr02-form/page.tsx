"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DeathDeclarationForm } from "../../../components/death-declaration-CR02/death-declaration-form";
import { NotificationBell } from "../../../components/NotificationBell";
import { useAuth } from "../../../contexts/auth-context";
import { useRouter } from "next/navigation";

function CR02FormContent() {
  const searchParams = useSearchParams();
  const sourceB24Id = searchParams.get("sourceB24Id");

  return <DeathDeclarationForm sourceB24Id={sourceB24Id ? Number(sourceB24Id) : undefined} />;
}

function CR02Navbar() {
  const { setCurrentRole } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    setCurrentRole("GUEST");
    router.push("/login");
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CR02FormPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <CR02Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">CR02 — Death Declaration Form</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <Suspense fallback={<div className="text-center py-12">Loading form...</div>}>
            <CR02FormContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
