"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getCaseDetail, getMyCases, issueB12, type CaseDetailResponse, type CaseListItem, type IssueB12Payload } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

function emptyB12Payload(): IssueB12Payload {
  return {
    naturalDeath: true,
    icd10Code: "",
    immediateCause: "",
    antecedentCauses: [""],
    contributoryCauses: [""],
    doctorViewedBodyAt: "",
    doctorDesignation: "",
    slmcRegistrationNo: "",
  };
}

export function DoctorDashboard() {
  const { token, currentDoctorId } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<CaseListItem | null>(null);
  const [activeCaseDetail, setActiveCaseDetail] = useState<CaseDetailResponse | null>(null);
  const [formData, setFormData] = useState<IssueB12Payload>(emptyB12Payload());
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      setCases((data.content || []).filter((c) => c.status === "PENDING_B12_MEDICAL"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load pending cases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void fetchCases();
    }
  }, [token]);

  const openCase = async (caseSummary: CaseListItem) => {
    setActiveCase(caseSummary);
    setActiveCaseDetail(null);
    setFormData(emptyB12Payload());
    setLoadingDetail(true);
    try {
      const detail = await getCaseDetail(caseSummary.caseId, token);
      setActiveCaseDetail(detail);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load case details.", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleListChange = (key: "antecedentCauses" | "contributoryCauses", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addCauseRow = (key: "antecedentCauses" | "contributoryCauses") => {
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const handleSubmitB12 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    setSubmitting(true);

    try {
      await issueB12(
        activeCase.caseId,
        {
          ...formData,
          antecedentCauses: formData.antecedentCauses.filter(Boolean),
          contributoryCauses: formData.contributoryCauses.filter(Boolean),
        },
        token,
      );

      toast({
        title: "B-12 Issued Successfully",
        description: formData.naturalDeath
          ? "Case returned to the GN with the certified cause chain."
          : "Case marked as suspicious or non-natural and removed from the current workflow.",
      });

      setActiveCase(null);
      setActiveCaseDetail(null);
      setFormData(emptyB12Payload());
      await fetchCases();
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Error issuing B-12.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading pending cases...</div>;

  const header = activeCaseDetail?.b12HeaderPrefill as Record<string, string> | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            D
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Your Doctor ID</p>
            {currentDoctorId ? (
              <p className="text-xl font-mono font-bold tracking-widest text-blue-900">{currentDoctorId}</p>
            ) : (
              <p className="text-sm italic text-blue-400">No Doctor ID assigned - please contact the administrator.</p>
            )}
          </div>
        </div>
        <div className="max-w-xs rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-700">
          Share this ID with family members so they can preassign medical confirmation requests to you.
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800">Pending Medical Certifications (B-12)</h2>
        <p className="mt-1 text-sm text-gray-500">Cases assigned to you for medical confirmation.</p>
      </div>

      {cases.length === 0 && !activeCase && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-gray-500">
          You have no pending cases assigned to you for medical certification.
        </div>
      )}

      {!activeCase ? (
        <div className="grid grid-cols-1 gap-4">
          {cases.map((caseItem) => (
            <div key={caseItem.caseId} className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{caseItem.deceasedFullName}</h3>
                <p className="text-sm text-gray-500">NIC: {caseItem.deceasedNic || "Not provided"} | Case #{caseItem.caseId}</p>
              </div>
              <button
                onClick={() => void openCase(caseItem)}
                className="mt-4 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:mt-0"
              >
                Review and Issue B-12
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="border-b border-blue-100 bg-blue-50 p-4">
            <h3 className="mb-3 font-bold text-blue-900">Issuing Medical Certificate (B-12)</h3>
            <div className="flex flex-col justify-between gap-2 rounded-md border border-blue-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Deceased Name</p>
                <p className="text-base font-bold text-gray-800">{activeCase.deceasedFullName}</p>
              </div>
              <div className="md:text-right">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Deceased NIC / ID</p>
                <p className="text-base font-mono font-medium text-gray-700">{activeCase.deceasedNic || "N/A"}</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-blue-500">Case #{activeCase.caseId}</p>
          </div>

          {loadingDetail ? (
            <div className="p-6 text-sm text-gray-500">Loading case detail...</div>
          ) : (
            <form onSubmit={handleSubmitB12} className="space-y-5 p-5">
              {header && (
                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Identity Status</p>
                    <p className="text-sm text-slate-900">{header.identificationStatus || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Name</p>
                    <p className="text-sm text-slate-900">{header.fullNameOfficialLanguage || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date of Birth</p>
                    <p className="text-sm text-slate-900">{header.dateOfBirth || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Age at Death</p>
                    <p className="text-sm text-slate-900">{header.age || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Permanent Address</p>
                    <p className="text-sm text-slate-900">{header.permanentAddressFullText || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Place of Death</p>
                    <p className="text-sm text-slate-900">{header.placeOfDeath || "-"}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded border bg-gray-50 p-3">
                <input
                  type="checkbox"
                  id="naturalDeath"
                  checked={formData.naturalDeath}
                  onChange={(e) => setFormData((prev) => ({ ...prev, naturalDeath: e.target.checked }))}
                  className="h-5 w-5 rounded text-blue-600"
                />
                <label htmlFor="naturalDeath" className="cursor-pointer font-medium text-gray-800">
                  Declare as Natural Death
                </label>
              </div>

              <div className={`rounded border p-3 text-sm ${formData.naturalDeath ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                {formData.naturalDeath
                  ? "If submitted: the case returns to the GN with your certified medical cause data."
                  : "If submitted: the case is rejected from the current workflow as suspicious or non-natural."}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ICD-10 Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.icd10Code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icd10Code: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    placeholder="e.g. I21.9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Viewed Body At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.doctorViewedBodyAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, doctorViewedBodyAt: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Immediate Cause *</label>
                  <input
                    type="text"
                    required
                    value={formData.immediateCause}
                    onChange={(e) => setFormData((prev) => ({ ...prev, immediateCause: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Doctor Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.doctorDesignation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, doctorDesignation: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SLMC Registration No *</label>
                  <input
                    type="text"
                    required
                    value={formData.slmcRegistrationNo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slmcRegistrationNo: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Antecedent Causes</label>
                  <button type="button" onClick={() => addCauseRow("antecedentCauses")} className="text-sm text-blue-600 underline">
                    Add row
                  </button>
                </div>
                {formData.antecedentCauses.map((cause, index) => (
                  <input
                    key={`antecedent-${index}`}
                    type="text"
                    value={cause}
                    onChange={(e) => handleListChange("antecedentCauses", index, e.target.value)}
                    className="block w-full rounded-md border border-gray-300 p-2"
                    placeholder={`Antecedent cause ${index + 1}`}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Contributory Causes</label>
                  <button type="button" onClick={() => addCauseRow("contributoryCauses")} className="text-sm text-blue-600 underline">
                    Add row
                  </button>
                </div>
                {formData.contributoryCauses.map((cause, index) => (
                  <input
                    key={`contributory-${index}`}
                    type="text"
                    value={cause}
                    onChange={(e) => handleListChange("contributoryCauses", index, e.target.value)}
                    className="block w-full rounded-md border border-gray-300 p-2"
                    placeholder={`Contributory cause ${index + 1}`}
                  />
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-md border px-5 py-2.5 font-medium text-white transition disabled:opacity-50 ${
                    formData.naturalDeath
                      ? "border-green-700 bg-green-600 hover:bg-green-700"
                      : "border-red-700 bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {submitting ? "Submitting..." : formData.naturalDeath ? "Issue B-12 (Natural)" : "Reject as Non-Natural"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCase(null);
                    setActiveCaseDetail(null);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
