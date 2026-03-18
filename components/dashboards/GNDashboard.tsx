import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getMyCases, issueB24, getCaseDetail } from "../../lib/api";
import { B24Form } from "../B24-report/b24-form";

export function GNDashboard() {
  const { token } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCase, setActiveCase] = useState<any>(null);

  const [activeCaseDetails, setActiveCaseDetails] = useState<any>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      const caseList = data.content || [];
      setCases(caseList.filter((c: any) => c.status === "PENDING_B24_GN"));
    } catch (err: any) {
      setError(err.message || "Failed to load pending GN cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases();
  }, [token]);

  const handleSelectCase = async (caseSummary: any) => {
    setActiveCase(caseSummary);
    try {
      // Fetch the FULL case details to populate the B-24 form
      const details = await getCaseDetail(caseSummary.caseId, token);
      setActiveCaseDetails(details);
    } catch (err) {
      console.error("Failed to fetch case details", err);
    }
  };

  const handleSubmitB24 = async (formData: Record<string, string>) => {
    if (!activeCase) return;
    try {
      // In the new unified flow, the B24 Form submission implies verification
      const verified = formData.b24Confirmed === "true";
      await issueB24(activeCase.caseId, { 
        identityVerified: verified, 
        residenceVerified: verified 
      }, token);
      
      setActiveCase(null);
      setActiveCaseDetails(null);
      fetchCases();
    } catch (err: any) {
      alert("Error issuing GN Verification: " + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading pending verifications...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Pending GN Verifications (B-24 Phase)</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      {cases.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          You have no pending cases awaiting verification in your GN division.
        </div>
      )}

      {!activeCase ? (
        <div className="grid grid-cols-1 gap-4">
          {cases.map((c) => (
            <div key={c.caseId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">{c.deceasedFullName}</h3>
                  <p className="text-sm text-gray-500">NIC: {c.deceasedNic} • Reported By: {c.applicantFullName || "N/A"}</p>
                  {c.causeOfDeath && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full">
                      <span className="font-semibold">Cause of Death:</span> {c.causeOfDeath}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleSelectCase(c)}
                  className="shrink-0 bg-indigo-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Complete B-24 Report
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
          <div className="bg-indigo-50 border-b border-indigo-100 p-4">
            <h3 className="font-bold text-indigo-900">Mandatory GN Verification Report (B-24)</h3>
            <p className="text-sm text-indigo-700 mt-1 flex items-center gap-2">
              Reviewing Case ID: <span className="font-semibold">#{activeCase.caseId}</span>
              {!activeCaseDetails && <span className="text-xs ml-2 animate-pulse">(Loading full case details...)</span>}
            </p>
          </div>
          
          <div className="p-1 sm:p-5">
            {activeCaseDetails && (() => {
              // Parse dateOfDeath into year/month/day for the B24 form fields
              const dod = activeCaseDetails.dateOfDeath ? new Date(activeCaseDetails.dateOfDeath) : null;
              const dodYear = dod ? String(dod.getFullYear()) : "";
              const dodMonth = dod ? String(dod.getMonth() + 1) : "";
              const dodDay = dod ? String(dod.getDate()) : "";
              const sex = activeCaseDetails.gender?.toLowerCase() === "male" ? "male" 
                        : activeCaseDetails.gender?.toLowerCase() === "female" ? "female" : "";

              return (
                <B24Form 
                  isVerificationFlow={true}
                  initialData={{
                    // B24 Form Header fields
                    b24GramaDivision: activeCaseDetails.sectorName || "",
                    b24RegistrarDivision: activeCaseDetails.sectorName || "",
                    
                    // (1) Date and Place of Death
                    b24DeathYear: dodYear,
                    b24DeathMonth: dodMonth,
                    b24DeathDay: dodDay,
                    b24PlaceOfDeath: activeCaseDetails.address || "",
                    
                    // (2) Full Name
                    b24FullName: activeCaseDetails.deceasedFullName || "",
                    
                    // (3) Sex
                    b24Sex: sex,
                    
                    // (6) Cause of Death
                    b24CauseOfDeath: activeCaseDetails.formB12?.primaryCause || "",
                    
                    // (7) Informant details
                    b24InformantName: activeCaseDetails.applicantName || "",
                    b24InformantAddress: activeCaseDetails.address || "",
                  }}
                  onVerificationSubmit={handleSubmitB24}
                  onCancel={() => {
                    setActiveCase(null);
                    setActiveCaseDetails(null);
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
