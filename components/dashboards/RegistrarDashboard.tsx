import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { getMyCases, issueCr2, getCaseDetail } from "../../lib/api";
import { DeathDeclarationForm } from "../death-declaration-CR02/death-declaration-form";

export function RegistrarDashboard() {
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
      setCases(caseList.filter((c: any) => c.status === "PENDING_REGISTRAR_REVIEW"));
    } catch (err: any) {
      setError(err.message || "Failed to load Registrar cases.");
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
      const details = await getCaseDetail(caseSummary.caseId, token);
      setActiveCaseDetails(details);
    } catch (err) {
      console.error("Failed to fetch case details", err);
    }
  };

  const handleReviewSubmit = async (_formData: Record<string, string>) => {
    if (!activeCase) return;
    await issueCr2(activeCase.caseId, token);
    setActiveCase(null);
    setActiveCaseDetails(null);
    fetchCases();
  };

  if (loading) return <div className="p-4 text-center">Loading pending Final Reviews...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Final Registrar Review (Pending CR-2)</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      {cases.length === 0 && !activeCase && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          You have no cases awaiting final Death Certificate issuance.
        </div>
      )}

      {!activeCase ? (
        <div className="grid grid-cols-1 gap-4">
          {cases.map((c) => (
            <div key={c.caseId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">{c.deceasedFullName}</h3>
                  <p className="text-sm text-gray-500">NIC: <span className="font-mono">{c.deceasedNic}</span> • Reported By: {c.applicantFullName || "N/A"}</p>
                  {c.causeOfDeath && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full">
                      <span className="font-semibold">Cause of Death:</span> {c.causeOfDeath}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="bg-green-50 border border-green-200 rounded px-2 py-0.5 text-xs text-green-800">✅ B-12 (Doctor)</span>
                    <span className="bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-xs text-blue-800">✅ B-24 (GN)</span>
                    <span className="bg-purple-50 border border-purple-200 rounded px-2 py-0.5 text-xs text-purple-800">✅ B-11 (Family)</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectCase(c)}
                  className="shrink-0 bg-gray-900 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition"
                >
                  Review & Issue CR-2
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-900 text-white p-5">
            <h3 className="font-bold text-lg">Final Review — Death Certificate (CR-2)</h3>
            <p className="text-sm text-gray-300 mt-1">
              Case ID: <span className="font-semibold text-white">#{activeCase.caseId}</span>
              {!activeCaseDetails && <span className="text-xs ml-2 animate-pulse">(Loading full case details...)</span>}
            </p>
          </div>

          <div className="p-1 sm:p-5">
            {activeCaseDetails && (() => {
              // Parse dates
              const dod = activeCaseDetails.dateOfDeath ? new Date(activeCaseDetails.dateOfDeath) : null;
              const dodYear = dod ? String(dod.getFullYear()) : "";
              const dodMonth = dod ? String(dod.getMonth() + 1) : "";
              const dodDay = dod ? String(dod.getDate()) : "";

              const dob = activeCaseDetails.dateOfBirth ? new Date(activeCaseDetails.dateOfBirth) : null;
              let ageY = 0, ageM = 0, ageD = 0;
              if (dob && dod) {
                ageY = dod.getFullYear() - dob.getFullYear();
                ageM = dod.getMonth() - dob.getMonth();
                ageD = dod.getDate() - dob.getDate();
                if (ageD < 0) {
                  ageM--;
                  ageD += new Date(dod.getFullYear(), dod.getMonth(), 0).getDate();
                }
                if (ageM < 0) {
                  ageY--;
                  ageM += 12;
                }
              }
              
              const sex = activeCaseDetails.gender?.toLowerCase() === "male" ? "male" 
                        : activeCaseDetails.gender?.toLowerCase() === "female" ? "female" : "";

              let initialDataToPass: Record<string, string> = {
                // (1) Type of death - natural since it passed B-12
                typeOfDeath: "normal",

                // (2) Date of Death
                deathYear: dodYear,
                deathMonth: dodMonth,
                deathDay: dodDay,

                // (3) Place of Death details
                placeInEnglish: activeCaseDetails.address || "",
                regDivision: activeCaseDetails.sectorName || "",

                // (4) Cause established
                causeEstablished: activeCaseDetails.formB12 ? "yes" : "",

                // (5) Cause of Death
                causeOfDeath: activeCaseDetails.formB12?.primaryCause || "",
                
                // (6) ICD Code
                icdCode: activeCaseDetails.formB12?.icd10Code || "",
                
                // (24) Cause of Death Detail (Nature section)
                causeOfDeathDetail: activeCaseDetails.formB12?.primaryCause || "",
                
                // (25) Nature of death
                isNaturalDeath: activeCaseDetails.formB12?.naturalDeath ? "yes" : "no",

                // ---- Person Departed Section (8-23) ----
                identificationStatus: activeCaseDetails.deceasedNic ? "identified" : "not_identified",
                deceasedNic: activeCaseDetails.deceasedNic || "",
                
                dobYear: dob ? String(dob.getFullYear()) : "",
                dobMonth: dob ? String(dob.getMonth() + 1) : "",
                dobDay: dob ? String(dob.getDate()) : "",
                
                ageYears: String(ageY),
                ageMonths: String(ageM),
                ageDays: String(ageD),
                
                deceasedGender: sex,
                nameEnglish: activeCaseDetails.deceasedFullName || "",
                
                permAddressGn: activeCaseDetails.sectorName || "",
                
                // Informant Section (24-28)
                informantName: activeCaseDetails.applicantName || "",
                informantId: activeCaseDetails.applicantNic || "",
                informantAddress: activeCaseDetails.address || "",
                
                // B-11 relationship if available (legacy support)
                informantCapacity: activeCaseDetails.formB11?.applicantRelationship || "",

                // Declaration section
                informantSignatureName: activeCaseDetails.applicantName || "",
                informantSignatureAddress: activeCaseDetails.address || "",
              };

              // If the family member already filled out the CR-2 data, use their payload perfectly
              if (activeCaseDetails.formCr2FamilyInfo?.cr2FormData) {
                try {
                  const familyData = JSON.parse(activeCaseDetails.formCr2FamilyInfo.cr2FormData);
                  // Merge the base data with the user's overrides
                  initialDataToPass = { ...initialDataToPass, ...familyData };
                } catch (e) {
                  console.error("Failed to parse Family CR-2 JSON payload", e);
                }
              }

              return (
                <DeathDeclarationForm
                  isReviewFlow={true}
                  mode="registrar"
                  initialData={initialDataToPass}
                  onReviewSubmit={handleReviewSubmit}
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
