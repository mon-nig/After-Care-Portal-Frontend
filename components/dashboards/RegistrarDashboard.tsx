"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getCaseDetail, getMyCases, issueCr2, type CaseDetailResponse, type CaseListItem } from "../../lib/api";
import { caseDetailToPrefill } from "../../lib/mappers/caseDetailToPrefill";
import { DeathDeclarationForm } from "../death-declaration-CR02/death-declaration-form";
import { useToast } from "../../hooks/use-toast";

export function RegistrarDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<CaseListItem | null>(null);
  const [activeCaseDetails, setActiveCaseDetails] = useState<CaseDetailResponse | null>(null);
  const [issuing, setIssuing] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      setCases((data.content || []).filter((c) => c.status === "PENDING_REGISTRAR_REVIEW"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load Registrar cases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void fetchCases();
    }
  }, [token]);

  const handleSelectCase = async (caseSummary: CaseListItem) => {
    setActiveCase(caseSummary);
    try {
      const details = await getCaseDetail(caseSummary.caseId, token);
      setActiveCaseDetails(details);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load case details.", variant: "destructive" });
    }
  };

  const handleReviewSubmit = async () => {
    if (!activeCase) return;
    setIssuing(true);
    try {
      await issueCr2(activeCase.caseId, token);
      toast({ title: "CR-2 Issued", description: `Death certificate issued for Case #${activeCase.caseId}.` });
      setActiveCase(null);
      setActiveCaseDetails(null);
      await fetchCases();
    } catch (err: any) {
      toast({ title: "Issuance Failed", description: err.message || "Could not issue CR-2.", variant: "destructive" });
    } finally {
      setIssuing(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading pending final reviews...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Final Registrar Review (Pending CR-2)</h2>

      {cases.length === 0 && !activeCase && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-gray-500">
          You have no cases awaiting final Death Certificate issuance.
        </div>
      )}

      {!activeCase ? (
        <div className="grid grid-cols-1 gap-4">
          {cases.map((caseItem) => (
            <div key={caseItem.caseId} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">{caseItem.deceasedFullName}</h3>
                  <p className="text-sm text-gray-500">
                    NIC: <span className="font-mono">{caseItem.deceasedNic || "Not provided"}</span> | Reported By: {caseItem.applicantFullName || "N/A"} | Case #{caseItem.caseId}
                  </p>
                  {caseItem.causeOfDeath && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                      <span className="font-semibold">Cause of Death:</span> {caseItem.causeOfDeath}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800">Canonical family report available</span>
                    {caseItem.causeOfDeath && (
                      <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-800">B-12 cause data available</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => void handleSelectCase(caseItem)}
                  className="shrink-0 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Review and Issue CR-2
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="bg-gray-900 p-5 text-white">
            <h3 className="text-lg font-bold">Final Review - Death Certificate (CR-2)</h3>
            <p className="mt-1 text-sm text-gray-300">
              Case ID: <span className="font-semibold text-white">#{activeCase.caseId}</span>
              {!activeCaseDetails && <span className="ml-2 text-xs">(Loading full case details...)</span>}
            </p>
            {activeCaseDetails && (
              <p className="mt-1 text-xs text-green-300">
                Prefill is coming from the backend-mapped CR-2 object, not from generic address shortcuts.
                {issuing && <span className="ml-2">Issuing certificate...</span>}
              </p>
            )}
          </div>

          <div className="p-1 sm:p-5">
            {activeCaseDetails && (
              <DeathDeclarationForm
                isReviewFlow
                mode="registrar"
                initialData={caseDetailToPrefill(activeCaseDetails).cr2}
                onReviewSubmit={handleReviewSubmit}
                onCancel={() => {
                  setActiveCase(null);
                  setActiveCaseDetails(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
