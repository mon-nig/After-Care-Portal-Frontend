"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getMyCases, issueB12 } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

export function DoctorDashboard() {
  const { token, currentDoctorId } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<any>(null);

  const [naturalDeath, setNaturalDeath] = useState(true);
  const [icd10Code, setIcd10Code] = useState("");
  const [primaryCause, setPrimaryCause] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      const caseList = data.content || [];
      // Backend now scopes PENDING_B12_MEDICAL only to assigned doctor
      setCases(caseList.filter((c: any) => c.status === "PENDING_B12_MEDICAL"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load pending cases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases();
  }, [token]);

  const handleSubmitB12 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    setSubmitting(true);
    try {
      await issueB12(activeCase.caseId, { naturalDeath, icd10Code, primaryCause }, token);
      const outcomeMsg = naturalDeath
        ? "Case classified as Natural Death. It has been returned to the GN for final forwarding to the Registrar."
        : "Case classified as Unnatural Death. The case has been closed and reported.";
      toast({ title: "B-12 Issued Successfully", description: outcomeMsg, variant: "default" });
      setActiveCase(null);
      setPrimaryCause("");
      setIcd10Code("");
      setNaturalDeath(true);
      fetchCases();
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Error issuing B-12.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading pending cases...</div>;

  return (
    <div className="space-y-6">
      {/* ── Doctor ID Banner ── */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">⚕</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Your Doctor ID</p>
            {currentDoctorId ? (
              <p className="text-xl font-mono font-bold text-blue-900 tracking-widest">{currentDoctorId}</p>
            ) : (
              <p className="text-sm text-blue-400 italic">No Doctor ID assigned — please contact the administrator.</p>
            )}
          </div>
        </div>
        <div className="text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2 max-w-xs">
          Share this ID with family members so they can route medical confirmation cases directly to you.
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800">Pending Medical Certifications (B-12)</h2>
        <p className="text-sm text-gray-500 mt-1">Cases assigned to you requiring medical certification.</p>
      </div>

      {cases.length === 0 && !activeCase && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          You have no pending cases assigned to you for medical certification.
        </div>
      )}

      {!activeCase ? (
        <div className="grid grid-cols-1 gap-4">
          {cases.map((c) => (
            <div key={c.caseId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{c.deceasedFullName}</h3>
                <p className="text-sm text-gray-500">NIC: {c.deceasedNic} • Case #{c.caseId}</p>
              </div>
              <button
                onClick={() => setActiveCase(c)}
                className="mt-4 sm:mt-0 bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition"
              >
                Review &amp; Issue B-12
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3">Issuing Medical Certificate (B-12)</h3>
            <div className="bg-white rounded-md border border-blue-200 p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Deceased Name</p>
                <p className="text-base font-bold text-gray-800">{activeCase.deceasedFullName}</p>
              </div>
              <div className="md:text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Deceased NIC / ID</p>
                <p className="text-base font-mono font-medium text-gray-700">{activeCase.deceasedNic || "N/A"}</p>
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-2 font-medium">Case #{activeCase.caseId}</p>
          </div>

          <form onSubmit={handleSubmitB12} className="p-5 space-y-4">
            {/* Death Classification */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <input
                type="checkbox"
                id="naturalDeath"
                checked={naturalDeath}
                onChange={(e) => setNaturalDeath(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <label htmlFor="naturalDeath" className="font-medium text-gray-800 cursor-pointer">
                Declare as Natural Death
              </label>
            </div>

            {/* Outcome preview */}
            <div className={`text-sm p-3 rounded border ${naturalDeath ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {naturalDeath
                ? "✅ If submitted: Case will return to the GN for final forwarding to the Registrar."
                : "⚠️ If submitted: Case will be closed as an unnatural death and cannot proceed to registration."}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ICD-10 Code *</label>
                <input
                  type="text"
                  required
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="e.g. I21.9"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Primary Cause of Death *</label>
                <input
                  type="text"
                  required
                  value={primaryCause}
                  onChange={(e) => setPrimaryCause(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Acute myocardial infarction"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`text-white px-5 py-2.5 rounded-md font-medium border transition disabled:opacity-50 ${
                  naturalDeath ? "bg-green-600 hover:bg-green-700 border-green-700" : "bg-red-600 hover:bg-red-700 border-red-700"
                }`}
              >
                {submitting ? "Submitting..." : naturalDeath ? "Issue B-12 (Natural)" : "Reject as Unnatural Death"}
              </button>
              <button
                type="button"
                onClick={() => setActiveCase(null)}
                className="bg-white text-gray-700 px-5 py-2.5 rounded-md font-medium hover:bg-gray-50 border border-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
