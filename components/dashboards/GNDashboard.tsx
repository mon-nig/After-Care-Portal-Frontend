"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { buildIssueB24Payload, getCaseDetail, getMyCases, gnAction, issueB24, type CaseDetailResponse, type CaseListItem } from "../../lib/api";
import { caseDetailToPrefill } from "../../lib/mappers/caseDetailToPrefill";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { B24Form } from "../B24-report/b24-form";

export function GNDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [isB24ModalOpen, setIsB24ModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseListItem | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseDetailResponse | null>(null);
  const [b24InitialData, setB24InitialData] = useState<Record<string, string>>({});
  const [b24Loading, setB24Loading] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      setCases((data.content || []).filter((c) => c.status === "PENDING_GN_REVIEW"));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load pending GN cases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void fetchCases();
    }
  }, [token]);

  const handleAction = async (caseId: number, action: "APPROVE" | "REQUEST_MEDICAL") => {
    setActionLoading(caseId);
    try {
      await gnAction(caseId, action, token);
      const label = action === "APPROVE" ? "Approved and forwarded to Registrar" : "Medical confirmation requested";
      toast({ title: "Action Successful", description: `Case #${caseId}: ${label}.` });
      await fetchCases();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message || "Could not perform action.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenB24 = async (caseListItem: CaseListItem) => {
    setSelectedCase(caseListItem);
    setSelectedCaseDetail(null);
    setB24Loading(true);
    setIsB24ModalOpen(true);

    try {
      const detail = await getCaseDetail(caseListItem.caseId, token);
      setSelectedCaseDetail(detail);
      setB24InitialData(caseDetailToPrefill(detail).b24);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load case details for B-24 form.", variant: "destructive" });
      setIsB24ModalOpen(false);
    } finally {
      setB24Loading(false);
    }
  };

  const handleB24Submit = async (formData: Record<string, string>) => {
    if (!selectedCase) return;

    try {
      await issueB24(selectedCase.caseId, buildIssueB24Payload(formData), token);
      toast({
        title: "B-24 Submitted",
        description: `Case #${selectedCase.caseId}: B-24 saved and forwarded to the Registrar.`,
      });

      setIsB24ModalOpen(false);
      setSelectedCase(null);
      setSelectedCaseDetail(null);
      setB24InitialData({});
      await fetchCases();
    } catch (err: any) {
      toast({
        title: "B-24 Submission Failed",
        description: err.message || "Could not save the B-24 form.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="p-4 text-center">Loading pending GN cases...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">GN Case Review</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cases awaiting your decision. Submit the B-24 form to move a natural-death-at-home case to the Registrar, or request medical confirmation when needed.
        </p>
      </div>

      {cases.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-gray-500">
          You have no pending cases awaiting review in your GN division.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {cases.map((caseItem) => {
          const isLoading = actionLoading === caseItem.caseId;
          const hasB12 = Boolean(caseItem.causeOfDeath);

          return (
            <div key={caseItem.caseId} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{caseItem.deceasedFullName}</h3>
                    {hasB12 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        B-12 Received
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    NIC: {caseItem.deceasedNic || "Not provided"} | Reported By: {caseItem.applicantFullName || "N/A"} | Case #{caseItem.caseId}
                  </p>

                  {caseItem.causeOfDeath && (
                    <div className="mt-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
                      <div className="font-semibold text-green-900">Medical Findings</div>
                      <div><strong>Cause:</strong> {caseItem.causeOfDeath} (ICD-10: {caseItem.b12Icd10Code || "N/A"})</div>
                      <div className="text-xs"><strong>Certified By:</strong> {caseItem.b12DoctorName || "Assigned Doctor"} ({caseItem.b12DoctorId || "N/A"})</div>
                    </div>
                  )}

                  {selectedCaseDetail?.caseId === caseItem.caseId && selectedCaseDetail.b12HeaderPrefill && (
                    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
                      B-24 will be prefilled from the canonical family report and doctor-certified cause data.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => void handleOpenB24(caseItem)}
                    disabled={isLoading}
                    className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "Open B-24"}
                  </button>
                  {!hasB12 && (
                    <button
                      onClick={() => void handleAction(caseItem.caseId, "REQUEST_MEDICAL")}
                      disabled={isLoading}
                      className="rounded-md bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Request Medical"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={isB24ModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsB24ModalOpen(false);
            setSelectedCase(null);
            setSelectedCaseDetail(null);
            setB24InitialData({});
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>B-24 - Report of Death by Grama Seva Niladhari</DialogTitle>
            <DialogDescription>
              {selectedCase
                ? `Case #${selectedCase.caseId} - ${selectedCase.deceasedFullName} (${selectedCase.deceasedNic || "No ID"})`
                : "Loading case details..."}
            </DialogDescription>
          </DialogHeader>

          {b24Loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">Loading B-24 form...</div>
          ) : (
            <B24Form
              initialData={b24InitialData}
              isVerificationFlow
              onVerificationSubmit={handleB24Submit}
              onCancel={() => {
                setIsB24ModalOpen(false);
                setSelectedCase(null);
                setSelectedCaseDetail(null);
                setB24InitialData({});
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
