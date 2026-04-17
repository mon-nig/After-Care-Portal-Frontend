"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getMyCases, gnAction, getCaseDetail } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { B24Form } from "../B24-report/b24-form";

export function GNDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ── B-24 Modal state ──
  const [isB24ModalOpen, setIsB24ModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [b24InitialData, setB24InitialData] = useState<Record<string, string>>({});
  const [b24Loading, setB24Loading] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      const caseList = data.content || [];
      // GN sees PENDING_GN_REVIEW — both new cases and cases returned after Doctor B-12
      setCases(caseList.filter((c: any) => c.status === "PENDING_GN_REVIEW"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load pending GN cases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases();
  }, [token]);

  const handleAction = async (caseId: number, action: "APPROVE" | "REQUEST_MEDICAL") => {
    setActionLoading(caseId);
    try {
      await gnAction(caseId, action, token);
      const label = action === "APPROVE" ? "Approved & forwarded to Registrar" : "Medical confirmation requested";
      toast({ title: "Action Successful", description: `Case #${caseId}: ${label}.`, variant: "default" });
      fetchCases();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message || "Could not perform action.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Open B-24 modal: fetch full case detail and pre-fill the form ──
  const handleOpenB24 = async (caseListItem: any) => {
    setSelectedCase(caseListItem);
    setB24Loading(true);
    setIsB24ModalOpen(true);

    try {
      const detail = await getCaseDetail(caseListItem.caseId, token);

      // Parse dateOfDeath into year/month/day for the B24 form fields
      let deathYear = "";
      let deathMonth = "";
      let deathDay = "";
      if (detail.dateOfDeath) {
        const parts = String(detail.dateOfDeath).split("-");
        if (parts.length === 3) {
          deathYear = parts[0];
          deathMonth = String(parseInt(parts[1], 10)); // remove leading zero
          deathDay = String(parseInt(parts[2], 10));
        }
      }

      // Map case data → B24 form field names
      const prefilled: Record<string, string> = {
        // Death details (Section 1)
        b24DeathYear: deathYear,
        b24DeathMonth: deathMonth,
        b24DeathDay: deathDay,

        // Full name (Section 2)
        b24FullName: detail.deceasedFullName || "",

        // Sex (Section 3) — map MALE/FEMALE to lowercase for RadioGroup
        b24Sex: detail.gender ? detail.gender.toLowerCase() : "",

        // Cause of Death (Section 6) — from B12 if available
        b24CauseOfDeath: detail.formB12?.primaryCause || caseListItem.causeOfDeath || "",

        // Informant / person bound to give info (Section 7)
        b24InformantName: detail.applicantName || "",
      };

      setB24InitialData(prefilled);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load case details for B-24 form.", variant: "destructive" });
      setIsB24ModalOpen(false);
    } finally {
      setB24Loading(false);
    }
  };

  // ── Submit B-24 form & forward to Registrar ──
  const handleB24Submit = async (formData: Record<string, string>) => {
    if (!selectedCase) return;

    // 1. Call the existing GN Approve endpoint to forward to Registrar
    await gnAction(selectedCase.caseId, "APPROVE", token);

    toast({
      title: "B-24 Submitted",
      description: `Case #${selectedCase.caseId}: B-24 form saved and forwarded to Registrar.`,
      variant: "default",
    });

    setIsB24ModalOpen(false);
    setSelectedCase(null);
    setB24InitialData({});
    fetchCases();
  };

  if (loading) return <div className="p-4 text-center">Loading pending GN cases...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">GN Case Review</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cases awaiting your decision. Fill out the B-24 form to forward to the Registrar, or request medical confirmation from a doctor.
        </p>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          You have no pending cases awaiting review in your GN division.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {cases.map((c) => {
          const isLoading = actionLoading === c.caseId;
          const hasB12 = !!c.causeOfDeath; // causeOfDeath is populated from formB12.primaryCause in mapToListResponse

          return (
            <div key={c.caseId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{c.deceasedFullName}</h3>
                    {hasB12 && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        ✅ B-12 Received
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">NIC: {c.deceasedNic} • Reported By: {c.applicantFullName || "N/A"} • Case #{c.caseId}</p>

                  {c.causeOfDeath && (
                    <div className="mt-2 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2 flex flex-col rounded-md shadow-sm">
                      <span className="font-semibold text-green-900 border-b border-green-200 pb-1 mb-1">Medical Findings</span>
                      <span className="mb-0.5"><strong>Cause:</strong> {c.causeOfDeath} (ICD-10: {c.b12Icd10Code || "N/A"})</span>
                      <span className="text-xs"><strong>Certified By:</strong> {c.b12DoctorName || "Assigned Doctor"} <span className="font-mono text-green-700">({c.b12DoctorId || "N/A"})</span></span>
                    </div>
                  )}

                  {hasB12 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Doctor has classified this as a natural death. You may now forward to the Registrar.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenB24(c)}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {isLoading ? "Processing..." : "📋 B-24"}
                  </button>
                  {!hasB12 && (
                    <button
                      onClick={() => handleAction(c.caseId, "REQUEST_MEDICAL")}
                      disabled={isLoading}
                      className="bg-amber-500 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {isLoading ? "Processing..." : "⚕ Request Medical"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── B-24 Form Modal ── */}
      <Dialog open={isB24ModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsB24ModalOpen(false);
          setSelectedCase(null);
          setB24InitialData({});
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>B-24 — Report of Death by Grama Seva Niladhari</DialogTitle>
            <DialogDescription>
              {selectedCase
                ? `Case #${selectedCase.caseId} — ${selectedCase.deceasedFullName} (NIC: ${selectedCase.deceasedNic})`
                : "Loading case details..."}
            </DialogDescription>
          </DialogHeader>

          {b24Loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <svg className="animate-spin h-6 w-6 mr-3 text-green-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading B-24 form...
            </div>
          ) : (
            <B24Form
              initialData={b24InitialData}
              isVerificationFlow={true}
              onVerificationSubmit={handleB24Submit}
              onCancel={() => {
                setIsB24ModalOpen(false);
                setSelectedCase(null);
                setB24InitialData({});
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
