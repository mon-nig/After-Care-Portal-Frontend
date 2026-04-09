"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { createCase, getMyCases, getCaseDetail, assignDoctor, getCaseCemeteryBooking } from "../../lib/api";
import { DeathDeclarationForm } from "../death-declaration-CR02/death-declaration-form";
import { CemeteryBookingModal } from "./CemeteryBookingModal";
import { useToast } from "../../hooks/use-toast";

// ── Minimal inline CR-2 fields collected upfront ──
const INITIAL_CR2_FIELDS = {
  typeOfDeath: "normal",
  timeOfDeath: "",
  deathLocation: "",
  district: "",
  dsDivision: "",
  regDivision: "",
  placeInEnglish: "",
  placeInSinhalaOrTamil: "",
  causeEstablished: "",
  causeOfDeath: "",
  icdCode: "",
  burialPlace: "",
  informantCapacity: "relative",
  informantPhone: "",
  informantEmail: "",
};

export function FamilyDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bookingCaseProps, setBookingCaseProps] = useState<{id: number, name: string} | null>(null);

  // View CR-2 state (read-only view after CR2_ISSUED_CLOSED)
  const [cr2CaseId, setCr2CaseId] = useState<number | null>(null);
  const [cr2CaseDetails, setCr2CaseDetails] = useState<any>(null);
  const [cr2Loading, setCr2Loading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const [cemeteryBooking, setCemeteryBooking] = useState<any>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);

  // Doctor assignment state per case
  const [doctorIdInputs, setDoctorIdInputs] = useState<Record<number, string>>({});
  const [assigningDoctor, setAssigningDoctor] = useState<number | null>(null);

  // ── Create Case Form State ──
  const [basicData, setBasicData] = useState({
    deceasedFullName: "",
    deceasedNic: "",
    dateOfBirth: "",
    dateOfDeath: "",
    gender: "MALE",
    sectorCode: "KANDY-01",
    address: "",
    doctorId: "",
  });
  const [cr2Fields, setCr2Fields] = useState({ ...INITIAL_CR2_FIELDS });
  const [submittingCase, setSubmittingCase] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getMyCases(token);
      setCases(data.content || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load cases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases();
  }, [token]);

  const fetchBookingStatus = async (caseId: number) => {
    setIsLoadingBooking(true);
    try {
      const booking = await getCaseCemeteryBooking(caseId, token);
      setCemeteryBooking(booking);
    } catch {
      setCemeteryBooking(null);
    } finally {
      setIsLoadingBooking(false);
    }
  };

  useEffect(() => {
    if (cr2CaseId && isViewMode && token) {
      fetchBookingStatus(cr2CaseId);
    } else {
      setCemeteryBooking(null);
    }
  }, [cr2CaseId, isViewMode, token]);

  // ── Create Case with upfront CR-2 data ──
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCase(true);
    try {
      const payload = {
        ...basicData,
        doctorId: basicData.doctorId ? Number(basicData.doctorId) : null,
        // Merge basic info-relevant fields into cr2FormData to help Registrar
        cr2FormData: JSON.stringify({
          ...cr2Fields,
          placeInEnglish: cr2Fields.placeInEnglish || basicData.address,
        }),
      };
      await createCase(payload, token);
      setShowCreateForm(false);
      setBasicData({ deceasedFullName: "", deceasedNic: "", dateOfBirth: "", dateOfDeath: "", gender: "MALE", sectorCode: "KANDY-01", address: "", doctorId: "" });
      setCr2Fields({ ...INITIAL_CR2_FIELDS });
      fetchCases();
      toast({ title: "Case Created", description: "Your death report has been submitted successfully.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Error creating case.", variant: "destructive" });
    } finally {
      setSubmittingCase(false);
    }
  };

  // ── Assign Doctor Fallback ──
  const handleAssignDoctor = async (caseId: number) => {
    const doctorId = Number(doctorIdInputs[caseId]);
    if (!doctorId) {
      toast({ title: "Validation Error", description: "Please enter a valid Doctor ID.", variant: "destructive" });
      return;
    }
    setAssigningDoctor(caseId);
    try {
      await assignDoctor(caseId, doctorId, token);
      toast({ title: "Doctor Assigned", description: "The doctor has been assigned. The case is now pending medical review.", variant: "default" });
      fetchCases();
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message || "Could not assign doctor.", variant: "destructive" });
    } finally {
      setAssigningDoctor(null);
    }
  };

  // ── View completed CR-2 in read mode ──
  const handleOpenCr2View = async (caseId: number) => {
    setCr2Loading(true);
    try {
      const details = await getCaseDetail(caseId, token);
      setCr2CaseId(caseId);
      setCr2CaseDetails(details);
      setIsViewMode(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not load case details.", variant: "destructive" });
    } finally {
      setCr2Loading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading cases...</div>;

  // ── Read-only CR-2 view after issuance ──
  if (cr2CaseId && cr2CaseDetails && isViewMode) {
    const dod = cr2CaseDetails.dateOfDeath ? new Date(cr2CaseDetails.dateOfDeath) : null;
    const dob = cr2CaseDetails.dateOfBirth ? new Date(cr2CaseDetails.dateOfBirth) : null;
    let ageY = 0, ageM = 0, ageD = 0;
    if (dob && dod) {
      ageY = dod.getFullYear() - dob.getFullYear();
      ageM = dod.getMonth() - dob.getMonth();
      ageD = dod.getDate() - dob.getDate();
      if (ageD < 0) { ageM--; ageD += new Date(dod.getFullYear(), dod.getMonth(), 0).getDate(); }
      if (ageM < 0) { ageY--; ageM += 12; }
    }
    const sex = cr2CaseDetails.gender?.toLowerCase() === "male" ? "male" : cr2CaseDetails.gender?.toLowerCase() === "female" ? "female" : "";

    // Parse stored CR-2 family data
    let savedCr2Data: Record<string, string> = {};
    if (cr2CaseDetails.formCr2Family?.cr2FormData) {
      try { savedCr2Data = JSON.parse(cr2CaseDetails.formCr2Family.cr2FormData); } catch {}
    }

    const initialData = {
      typeOfDeath: "normal",
      deathYear: dod ? String(dod.getFullYear()) : "",
      deathMonth: dod ? String(dod.getMonth() + 1) : "",
      deathDay: dod ? String(dod.getDate()) : "",
      placeInEnglish: basicData.address || "",
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
      ageYears: String(ageY), ageMonths: String(ageM), ageDays: String(ageD),
      deceasedGender: sex,
      nameEnglish: cr2CaseDetails.deceasedFullName || "",
      permAddressGn: cr2CaseDetails.sectorName || "",
      informantName: cr2CaseDetails.applicantName || "",
      informantId: cr2CaseDetails.applicantNic || "",
      informantAddress: cr2CaseDetails.address || "",
      informantSignatureName: cr2CaseDetails.applicantName || "",
      informantSignatureAddress: cr2CaseDetails.address || "",
      ...savedCr2Data,
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">View Finalized CR-2 Declaration — Case #{cr2CaseId}</h2>
          <button onClick={() => { setCr2CaseId(null); setCr2CaseDetails(null); setIsViewMode(false); }} className="text-sm text-gray-500 hover:text-gray-700 underline">← Back to Cases</button>
        </div>
        <DeathDeclarationForm
          mode="family"
          isReviewFlow={true}
          initialData={initialData}
          isReadOnly={true}
          onReviewSubmit={async () => {}}
          onCancel={() => { setCr2CaseId(null); setCr2CaseDetails(null); setIsViewMode(false); }}
          onBookCemetery={() => setBookingCaseProps({ id: cr2CaseId!, name: cr2CaseDetails.deceasedFullName })}
          cemeteryBooking={cemeteryBooking}
          isLoadingBooking={isLoadingBooking}
        />
        {bookingCaseProps && (
          <CemeteryBookingModal token={token} caseId={bookingCaseProps.id} deceasedName={bookingCaseProps.name}
            onClose={() => { if (bookingCaseProps) fetchBookingStatus(bookingCaseProps.id); setBookingCaseProps(null); }}
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
          <button onClick={() => setShowCreateForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
            + Report a Death
          </button>
        )}
      </div>

      {/* ── Create Case Form ── */}
      {showCreateForm && (
        <form onSubmit={handleCreateCase} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Initial Death Report</h3>

          {/* Basic Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Deceased Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Deceased Full Name *</label>
                <input type="text" required value={basicData.deceasedFullName} onChange={e => setBasicData({...basicData, deceasedFullName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deceased NIC</label>
                <input type="text" value={basicData.deceasedNic} onChange={e => setBasicData({...basicData, deceasedNic: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={basicData.dateOfBirth} onChange={e => setBasicData({...basicData, dateOfBirth: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Death *</label>
                <input type="date" required value={basicData.dateOfDeath} onChange={e => setBasicData({...basicData, dateOfDeath: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select value={basicData.gender} onChange={e => setBasicData({...basicData, gender: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sector Code *</label>
                <input type="text" required value={basicData.sectorCode} onChange={e => setBasicData({...basicData, sectorCode: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. KANDY-01" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <input type="text" required value={basicData.address} onChange={e => setBasicData({...basicData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
            </div>
          </div>

          {/* CR-02 Declaration Details */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">CR-02 Declaration Details</h4>
            <p className="text-xs text-gray-500 mb-3">This information will pre-fill the Registrar's form. Please complete as accurately as possible.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death (English)</label>
                <input type="text" value={cr2Fields.placeInEnglish} onChange={e => setCr2Fields({...cr2Fields, placeInEnglish: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Hospital / home address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death (Sinhala/Tamil)</label>
                <input type="text" value={cr2Fields.placeInSinhalaOrTamil} onChange={e => setCr2Fields({...cr2Fields, placeInSinhalaOrTamil: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time of Death</label>
                <input type="time" value={cr2Fields.timeOfDeath} onChange={e => setCr2Fields({...cr2Fields, timeOfDeath: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location Type</label>
                <select value={cr2Fields.deathLocation} onChange={e => setCr2Fields({...cr2Fields, deathLocation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option value="">-- Select --</option>
                  <option value="hospital">Hospital</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <input type="text" value={cr2Fields.district} onChange={e => setCr2Fields({...cr2Fields, district: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DS Division</label>
                <input type="text" value={cr2Fields.dsDivision} onChange={e => setCr2Fields({...cr2Fields, dsDivision: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registrar Division</label>
                <input type="text" value={cr2Fields.regDivision} onChange={e => setCr2Fields({...cr2Fields, regDivision: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Burial Place</label>
                <input type="text" value={cr2Fields.burialPlace} onChange={e => setCr2Fields({...cr2Fields, burialPlace: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Informant Capacity</label>
                <input type="text" value={cr2Fields.informantCapacity} onChange={e => setCr2Fields({...cr2Fields, informantCapacity: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. Son, Daughter, Spouse" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Informant Phone</label>
                <input type="tel" value={cr2Fields.informantPhone} onChange={e => setCr2Fields({...cr2Fields, informantPhone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
            </div>
          </div>

          {/* Optional Doctor Assignment */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">Doctor Pre-Assignment (Optional)</h4>
            <p className="text-xs text-gray-500 mb-3">If the GN requests a medical confirmation, this doctor will be automatically notified. You can also provide one later if required.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Doctor ID</label>
              <input type="number" value={basicData.doctorId} onChange={e => setBasicData({...basicData, doctorId: e.target.value})} className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Enter Doctor's system ID" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submittingCase} className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-60">
              {submittingCase ? "Submitting..." : "Submit Report"}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-800 px-5 py-2 rounded font-medium hover:bg-gray-300">Cancel</button>
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

          {/* ── Status: Awaiting GN Review ── */}
          {c.status === "PENDING_GN_REVIEW" && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
              Your case has been submitted and is awaiting review by the Grama Niladhari officer in your sector.
            </div>
          )}

          {/* ── Status: Pending Doctor Assignment (Family must provide doctor) ── */}
          {c.status === "PENDING_DOCTOR_ASSIGNMENT" && (
            <div className="mt-4 p-4 border border-amber-300 bg-amber-50 rounded-md">
              <h4 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">⚕️ Action Required: Provide a Doctor</h4>
              <p className="text-sm text-amber-800 mb-3">
                The Grama Niladhari has requested a medical confirmation for this case, but no doctor was assigned during case creation.
                Please provide the Doctor&apos;s system ID below.
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Doctor ID"
                  value={doctorIdInputs[c.caseId] || ""}
                  onChange={e => setDoctorIdInputs(prev => ({ ...prev, [c.caseId]: e.target.value }))}
                  className="block rounded-md border border-amber-300 shadow-sm p-2 text-sm w-40 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  onClick={() => handleAssignDoctor(c.caseId)}
                  disabled={assigningDoctor === c.caseId}
                  className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {assigningDoctor === c.caseId ? "Assigning..." : "Assign Doctor"}
                </button>
              </div>
            </div>
          )}

          {/* ── Status: Pending B-12 Medical ── */}
          {c.status === "PENDING_B12_MEDICAL" && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Awaiting Medical Certification (B-12) from the assigned doctor. You will be notified once completed.
            </div>
          )}

          {/* ── Status: Pending Registrar Review ── */}
          {c.status === "PENDING_REGISTRAR_REVIEW" && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
              All verifications are complete. Your case is now with the Registrar for final CR-2 certificate issuance.
            </div>
          )}

          {/* ── Status: Rejected Unnatural Death ── */}
          {c.status === "REJECTED_UNNATURAL_DEATH" && (
            <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md shadow-sm">
              <h4 className="font-bold text-red-900 text-lg flex items-center gap-2">⚠️ Case Rejected: Unnatural Death</h4>
              <p className="text-sm text-red-800 mt-2 font-medium">
                The certifying Medical Officer has officially logged this case as an unnatural death.
                The standard death registration process cannot continue.
                <br /><br />
                <strong>REQUIRED ACTION:</strong> Please report this immediately to your local Police Station for further investigation.
              </p>
            </div>
          )}

          {/* ── Status: CR-2 Issued ── */}
          {c.status === "CR2_ISSUED_CLOSED" && (
            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md text-green-800 space-y-3">
              <div>
                <p className="font-bold flex items-center gap-2 text-lg">✅ Final Death Certificate (CR-2) Issued!</p>
                <p className="text-sm mt-1">Status: <span className="font-mono bg-white px-2 py-0.5 rounded border border-green-300">COMPLETED &amp; VERIFIED</span></p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-green-200">
                <button
                  onClick={() => handleOpenCr2View(c.caseId)}
                  disabled={cr2Loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 shadow-sm"
                >
                  {cr2Loading ? "Loading..." : "View / Download CR-02"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {bookingCaseProps && (
        <CemeteryBookingModal token={token} caseId={bookingCaseProps.id} deceasedName={bookingCaseProps.name}
          onClose={() => { if (bookingCaseProps) fetchBookingStatus(bookingCaseProps.id); setBookingCaseProps(null); }}
        />
      )}
    </div>
  );
}
