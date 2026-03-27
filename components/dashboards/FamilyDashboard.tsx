import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { createCase, getMyCases, getCaseDetail, submitCr2Family } from "../../lib/api";
import { DeathDeclarationForm } from "../death-declaration-CR02/death-declaration-form";
import { CemeteryBookingModal } from "./CemeteryBookingModal";

export function FamilyDashboard() {
  const { token } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bookingCaseProps, setBookingCaseProps] = useState<{id: number, name: string} | null>(null);

  // CR-2 Form state
  const [cr2CaseId, setCr2CaseId] = useState<number | null>(null);
  const [cr2CaseDetails, setCr2CaseDetails] = useState<any>(null);
  const [cr2Loading, setCr2Loading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    deceasedFullName: "",
    deceasedNic: "",
    dateOfBirth: "",
    dateOfDeath: "",
    gender: "MALE",
    sectorCode: "KANDY-01",
    address: ""
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      setCases(data.content || []);
    } catch (err: any) {
      setError(err.message || "Failed to load cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases();
  }, [token]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCase(formData, token);
      setShowCreateForm(false);
      setFormData({
        deceasedFullName: "",
        deceasedNic: "",
        dateOfBirth: "",
        dateOfDeath: "",
        gender: "MALE",
        sectorCode: "KANDY-01",
        address: ""
      });
      fetchCases();
    } catch (err: any) {
      alert("Error creating case: " + err.message);
    }
  };

  const handleOpenCr2Form = async (caseId: number, isView: boolean = false) => {
    setCr2Loading(true);
    try {
      const details = await getCaseDetail(caseId, token);
      setCr2CaseId(caseId);
      setCr2CaseDetails(details);
      setIsViewMode(isView);
    } catch (err: any) {
      alert("Error loading case details: " + err.message);
    } finally {
      setCr2Loading(false);
    }
  };

  const handleCr2Submit = async (formPayload: Record<string, string>) => {
    if (!cr2CaseId) return;
    await submitCr2Family(cr2CaseId, formPayload, token);
    setCr2CaseId(null);
    setCr2CaseDetails(null);
    fetchCases();
  };

  if (loading) return <div className="p-4 text-center">Loading cases...</div>;

  // If a CR-2 form is open, show the full form
  if (cr2CaseId && cr2CaseDetails) {
    const dod = cr2CaseDetails.dateOfDeath ? new Date(cr2CaseDetails.dateOfDeath) : null;
    const dob = cr2CaseDetails.dateOfBirth ? new Date(cr2CaseDetails.dateOfBirth) : null;
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
    const sex = cr2CaseDetails.gender?.toLowerCase() === "male" ? "male"
              : cr2CaseDetails.gender?.toLowerCase() === "female" ? "female" : "";

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {isViewMode ? `View Finalized CR-2 Declaration — Case #${cr2CaseId}` : `Fill CR-2 Declaration — Case #${cr2CaseId}`}
          </h2>
          <button
            onClick={() => { setCr2CaseId(null); setCr2CaseDetails(null); setIsViewMode(false); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Back to Cases
          </button>
        </div>
        {!isViewMode && (
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded">
            Please fill out all sections of the Death Declaration form below. The <strong>Officer Section</strong> will be filled by the Registrar after you submit.
          </p>
        )}
        <DeathDeclarationForm
          mode="family"
          isReviewFlow={true}
          initialData={{
            typeOfDeath: "normal",
            deathYear: dod ? String(dod.getFullYear()) : "",
            deathMonth: dod ? String(dod.getMonth() + 1) : "",
            deathDay: dod ? String(dod.getDate()) : "",
            placeInEnglish: cr2CaseDetails.address || "",
            regDivision: cr2CaseDetails.sectorName || "",
            causeEstablished: cr2CaseDetails.formB12 ? "yes" : "",
            causeOfDeath: cr2CaseDetails.formB12?.primaryCause || "",
            icdCode: cr2CaseDetails.formB12?.icd10Code || "",
            causeOfDeathDetail: cr2CaseDetails.formB12?.primaryCause || "",
            isNaturalDeath: cr2CaseDetails.formB12?.naturalDeath ? "yes" : "no",
            identificationStatus: cr2CaseDetails.deceasedNic ? "identified" : "not_identified",
            deceasedNic: cr2CaseDetails.deceasedNic || "",
            dobYear: dob ? String(dob.getFullYear()) : "",
            dobMonth: dob ? String(dob.getMonth() + 1) : "",
            dobDay: dob ? String(dob.getDate()) : "",
            ageYears: String(ageY),
            ageMonths: String(ageM),
            ageDays: String(ageD),
            deceasedGender: sex,
            nameEnglish: cr2CaseDetails.deceasedFullName || "",
            permAddressGn: cr2CaseDetails.sectorName || "",
            informantName: cr2CaseDetails.applicantName || "",
            informantId: cr2CaseDetails.applicantNic || "",
            informantAddress: cr2CaseDetails.address || "",
            informantSignatureName: cr2CaseDetails.applicantName || "",
            informantSignatureAddress: cr2CaseDetails.address || "",
          }}
          isReadOnly={isViewMode}
          onReviewSubmit={handleCr2Submit}
          onCancel={() => { setCr2CaseId(null); setCr2CaseDetails(null); setIsViewMode(false); }}
          onBookCemetery={isViewMode ? () => setBookingCaseProps({ id: cr2CaseId!, name: cr2CaseDetails.deceasedFullName }) : undefined}
        />
        {/* Render Cemetery Booking Modal inside the View mode too */}
        {bookingCaseProps && (
          <CemeteryBookingModal 
            token={token} 
            caseId={bookingCaseProps.id} 
            deceasedName={bookingCaseProps.name} 
            onClose={() => setBookingCaseProps(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">My Death Registration Cases</h2>
        {!showCreateForm && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            + Report a Death
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleCreateCase} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Initial Death Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Deceased Full Name</label>
              <input type="text" required value={formData.deceasedFullName} onChange={(e) => setFormData({...formData, deceasedFullName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deceased NIC</label>
              <input type="text" required value={formData.deceasedNic} onChange={(e) => setFormData({...formData, deceasedNic: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" required value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Death</label>
              <input type="date" required value={formData.dateOfDeath} onChange={(e) => setFormData({...formData, dateOfDeath: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sector Code</label>
              <input type="text" required value={formData.sectorCode} onChange={(e) => setFormData({...formData, sectorCode: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. KANDY-01" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">Submit Report</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </form>
      )}

      {!showCreateForm && cases.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          No active cases found. Click &quot;Report a Death&quot; to start the process.
        </div>
      )}

      {!showCreateForm && cases.map(c => (
        <div key={c.caseId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{c.deceasedFullName}</h3>
              <p className="text-sm text-gray-500">NIC: {c.deceasedNic} • Case #{c.caseId}</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {c.status.replace(/_/g, " ")}
            </span>
          </div>

          {c.status === "PENDING_CR2_FAMILY" && (
            <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800 mb-3 font-medium">
                The Grama Niladhari has verified this case. Please fill out the CR-2 Death Declaration form to proceed to the Registrar.
              </p>
              <button 
                onClick={() => handleOpenCr2Form(c.caseId)}
                disabled={cr2Loading}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {cr2Loading ? "Loading Form..." : "Fill CR-2 Declaration Form"}
              </button>
            </div>
          )}

          {c.status === "REJECTED_UNNATURAL_DEATH" && (
            <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md shadow-sm">
              <h4 className="font-bold text-red-900 text-lg flex items-center gap-2">
                ⚠️ Case Rejected: Medical Officer Review
              </h4>
              <p className="text-sm text-red-800 mt-2 font-medium">
                The certifying Medical Officer has officially logged this case as an unnatural death. 
                The standard death registration process cannot continue. 
                <br /><br />
                <strong>REQUIRED ACTION:</strong> Please report this immediately to your local Police Station for further investigation.
              </p>
            </div>
          )}
          
          {c.status === "CR2_ISSUED_CLOSED" && (
            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md text-green-800 space-y-3">
              <div>
                <p className="font-bold flex items-center gap-2 text-lg">
                  ✅ Final Death Certificate (CR-2) Issued!
                </p>
                <p className="text-sm mt-1">Status: <span className="font-mono bg-white px-2 py-0.5 rounded border border-green-300">COMPLETED & VERIFIED</span></p>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-2 border-t border-green-200">
                <button 
                  onClick={() => handleOpenCr2Form(c.caseId, true)}
                  disabled={cr2Loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  {cr2Loading ? "Loading Form..." : "Download CR02 Form"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Cemetery Booking Modal */}
      {bookingCaseProps && (
        <CemeteryBookingModal 
          token={token} 
          caseId={bookingCaseProps.id} 
          deceasedName={bookingCaseProps.name} 
          onClose={() => setBookingCaseProps(null)} 
        />
      )}
    </div>
  );
}
