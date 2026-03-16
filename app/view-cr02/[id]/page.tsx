"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchCr02ById } from "../../../lib/api";
import { ArrowLeft, FileText } from "lucide-react";

export default function ViewCr02Page() {
  const params = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cr02, setCr02] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formId = Number(params.id);

  useEffect(() => {
    fetchCr02ById(formId)
      .then(setCr02)
      .catch(() => setError("Failed to load CR02 form data."))
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    );
  }

  if (error || !cr02) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Form not found."}</p>
          <button onClick={() => router.push("/")} className="text-blue-600 underline">
            Go back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const fields = [
    { label: "Type of Death", value: cr02.typeOfDeath },
    { label: "Date of Death", value: cr02.deathYear ? `${cr02.deathYear}-${String(cr02.deathMonth).padStart(2,"0")}-${String(cr02.deathDay).padStart(2,"0")}` : "" },
    { label: "District", value: cr02.district },
    { label: "DS Division", value: cr02.dsDivision },
    { label: "Registration Division", value: cr02.regDivision },
    { label: "Place (Sinhala/Tamil)", value: cr02.placeInSinhalaOrTamil },
    { label: "Place (English)", value: cr02.placeInEnglish },
    { label: "Time of Death", value: cr02.timeOfDeath },
    { label: "Death Location", value: cr02.deathLocation },
    { label: "Cause Established", value: cr02.causeEstablished },
    { label: "Cause of Death", value: cr02.causeOfDeath },
    { label: "ICD Code", value: cr02.icdCode },
    { label: "Burial Place", value: cr02.burialPlace },
    { label: "Informant Capacity", value: cr02.informantCapacity },
    { label: "Informant ID", value: cr02.informantId },
    { label: "Informant Name", value: cr02.informantName },
    { label: "Informant Address", value: cr02.informantAddress },
    { label: "Informant Phone", value: cr02.informantPhone },
    { label: "Informant Email", value: cr02.informantEmail },
    { label: "Deceased Name", value: cr02.deceasedName },
    { label: "Family Member NIC", value: cr02.familyNicNo },
    { label: "Status", value: cr02.currentStage },
    { label: "Submitted At", value: cr02.submissionTimestamp ? new Date(cr02.submissionTimestamp).toLocaleString("en-LK") : "" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="size-6 text-[#4a7c9f]" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CR02 Death Declaration</h1>
              <p className="text-sm text-gray-500">Certificate #{cr02.id}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-emerald-800">CR02 — Declaration of Death (Read Only)</h2>
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
      </div>
    </main>
  );
}
