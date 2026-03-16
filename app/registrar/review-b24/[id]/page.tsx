"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchB24ById } from "../../../../lib/api";
import { useAuth } from "../../../../contexts/auth-context";

interface B24Data {
  id: number;
  gramaDivision: string;
  registrarDivision: string;
  serialNo: string;
  deathYear: number;
  deathMonth: number;
  deathDay: number;
  placeOfDeath: string;
  fullName: string;
  sex: string;
  race: string;
  age: string;
  profession: string;
  causeOfDeath: string;
  informantName: string;
  informantAddress: string;
  familyNicNo: string;
  assignedRegistrarUsername: string;
  currentStage: string;
  submissionTimestamp: string;
}

export default function ReviewB24Page() {
  const params = useParams();
  const router = useRouter();
  const { currentRole } = useAuth();
  const [b24, setB24] = useState<B24Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formId = Number(params.id);

  useEffect(() => {
    if (currentRole !== "REGISTRAR") {
      router.push("/");
      return;
    }
    fetchB24ById(formId)
      .then(setB24)
      .catch(() => setError("Failed to load B24 form data."))
      .finally(() => setLoading(false));
  }, [formId, currentRole, router]);

  const handleGenerateCR02 = () => {
    // Navigate to CR02 form with B24 ID as query param — does NOT auto-create
    router.push(`/registrar/cr02-form?sourceB24Id=${formId}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    );
  }

  if (error && !b24) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="text-blue-600 underline">
            Go back to dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!b24) return null;

  const fields = [
    { label: "Grama Division", value: b24.gramaDivision },
    { label: "Registrar Division", value: b24.registrarDivision },
    { label: "Serial No", value: b24.serialNo },
    { label: "Date of Death", value: `${b24.deathYear}-${String(b24.deathMonth).padStart(2, "0")}-${String(b24.deathDay).padStart(2, "0")}` },
    { label: "Place of Death", value: b24.placeOfDeath },
    { label: "Full Name of Deceased", value: b24.fullName },
    { label: "Sex", value: b24.sex },
    { label: "Race", value: b24.race },
    { label: "Age", value: b24.age },
    { label: "Profession", value: b24.profession },
    { label: "Cause of Death", value: b24.causeOfDeath },
    { label: "Informant Name", value: b24.informantName },
    { label: "Informant Address", value: b24.informantAddress },
    { label: "Family Member NIC", value: b24.familyNicNo },
    { label: "Assigned To", value: b24.assignedRegistrarUsername },
    { label: "Current Stage", value: b24.currentStage },
    { label: "Submitted At", value: b24.submissionTimestamp ? new Date(b24.submissionTimestamp).toLocaleString("en-LK") : "—" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review B24 Report</h1>
            <p className="text-sm text-gray-500">Form #{b24.id}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-blue-800">B24 — Report of Death by Grama Seva Niladhari</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {fields.map((f) => (
              <div key={f.label} className="flex px-6 py-3">
                <span className="w-1/3 text-sm font-medium text-gray-500">{f.label}</span>
                <span className="w-2/3 text-sm text-gray-900">{f.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerateCR02}
            className="flex-1 px-6 py-3 bg-[#4a7c9f] text-white rounded-md text-sm font-bold hover:bg-[#3b6787] transition-all"
          >
            Fill CR02 Form from this B24 →
          </button>
        </div>
      </div>
    </main>
  );
}
