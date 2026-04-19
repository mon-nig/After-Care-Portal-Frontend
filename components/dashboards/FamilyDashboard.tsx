"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";
import { createCase, getMyCases, getCaseDetail, assignDoctor } from "../../lib/api";
import { DeathDeclarationForm } from "../death-declaration-CR02/death-declaration-form";
import { useToast } from "../../hooks/use-toast";

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

function buildCr02FileName(deceasedName: string | undefined, caseId: number) {
  const safeName = (deceasedName || `case-${caseId}`)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${safeName || `case-${caseId}`}-cr02.pdf`;
}

function getStatusTone(status: string) {
  if (status === "CR2_ISSUED_CLOSED") return "bg-green-100 text-green-800 border-green-200";
  if (status === "PENDING_DOCTOR_ASSIGNMENT") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "REJECTED_UNNATURAL_DEATH") return "bg-red-100 text-red-800 border-red-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}

export function FamilyDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [cr2CaseId, setCr2CaseId] = useState<number | null>(null);
  const [cr2CaseDetails, setCr2CaseDetails] = useState<any>(null);
  const [cr2LoadingCaseId, setCr2LoadingCaseId] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [doctorIdInputs, setDoctorIdInputs] = useState<Record<number, string>>({});
  const [assigningDoctor, setAssigningDoctor] = useState<number | null>(null);

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

  const completedCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "CR2_ISSUED_CLOSED"),
    [cases]
  );
  const pendingCases = useMemo(
    () => cases.filter((caseItem) => !["CR2_ISSUED_CLOSED", "REJECTED_UNNATURAL_DEATH"].includes(caseItem.status)),
    [cases]
  );
  const doctorActionCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "PENDING_DOCTOR_ASSIGNMENT"),
    [cases]
  );

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
    if (token) {
      void fetchCases();
    }
  }, [token]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCase(true);

    try {
      const payload = {
        ...basicData,
        doctorId: basicData.doctorId.trim() || null,
        cr2FormData: JSON.stringify({
          ...cr2Fields,
          placeInEnglish: cr2Fields.placeInEnglish || basicData.address,
        }),
      };

      await createCase(payload, token);
      setShowCreateForm(false);
      setBasicData({
        deceasedFullName: "",
        deceasedNic: "",
        dateOfBirth: "",
        dateOfDeath: "",
        gender: "MALE",
        sectorCode: "KANDY-01",
        address: "",
        doctorId: "",
      });
      setCr2Fields({ ...INITIAL_CR2_FIELDS });
      await fetchCases();

      toast({
        title: "Case Created",
        description: "Your death report has been submitted successfully.",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Error creating case.",
        variant: "destructive",
      });
    } finally {
      setSubmittingCase(false);
    }
  };

  const handleAssignDoctor = async (caseId: number) => {
    const doctorId = doctorIdInputs[caseId]?.trim();

    if (!doctorId) {
      toast({
        title: "Validation Error",
        description: "Please enter a Doctor ID (e.g. DOC-A1B2C3).",
        variant: "destructive",
      });
      return;
    }

    setAssigningDoctor(caseId);

    try {
      await assignDoctor(caseId, doctorId as any, token);
      toast({
        title: "Doctor Assigned",
        description: "The doctor has been assigned. The case is now pending medical review.",
        variant: "default",
      });
      await fetchCases();
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.message || "Could not assign doctor.",
        variant: "destructive",
      });
    } finally {
      setAssigningDoctor(null);
    }
  };

  const handleOpenCr2View = async (caseId: number) => {
    setCr2LoadingCaseId(caseId);

    try {
      const details = await getCaseDetail(caseId, token);
      setCr2CaseId(caseId);
      setCr2CaseDetails(details);
      setIsViewMode(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not load case details.",
        variant: "destructive",
      });
    } finally {
      setCr2LoadingCaseId(null);
    }
  };

  const goToCemeteryBooking = (caseId?: number) => {
    const target = caseId ? `/family/cemetery-booking?caseId=${caseId}` : "/family/cemetery-booking";
    router.push(target);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading cases...</div>;
  }

  if (cr2CaseId && cr2CaseDetails && isViewMode) {
    const dod = cr2CaseDetails.dateOfDeath ? new Date(cr2CaseDetails.dateOfDeath) : null;
    const dob = cr2CaseDetails.dateOfBirth ? new Date(cr2CaseDetails.dateOfBirth) : null;

    let ageY = 0;
    let ageM = 0;
    let ageD = 0;

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

    const sex =
      cr2CaseDetails.gender?.toLowerCase() === "male"
        ? "male"
        : cr2CaseDetails.gender?.toLowerCase() === "female"
          ? "female"
          : "";

    let savedCr2Data: Record<string, string> = {};
    if (cr2CaseDetails.formCr2Family?.cr2FormData) {
      try {
        savedCr2Data = JSON.parse(cr2CaseDetails.formCr2Family.cr2FormData);
      } catch {
        savedCr2Data = {};
      }
    }

    const initialData = {
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
      ...savedCr2Data,
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">View Finalized CR-2 Declaration - Case #{cr2CaseId}</h2>
          <button
            onClick={() => {
              setCr2CaseId(null);
              setCr2CaseDetails(null);
              setIsViewMode(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to Cases
          </button>
        </div>

        <DeathDeclarationForm
          mode="family"
          isReviewFlow={true}
          initialData={initialData}
          isReadOnly={true}
          onReviewSubmit={async () => {}}
          onCancel={() => {
            setCr2CaseId(null);
            setCr2CaseDetails(null);
            setIsViewMode(false);
          }}
          pdfFileName={buildCr02FileName(cr2CaseDetails.deceasedFullName, cr2CaseId)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showCreateForm && (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 p-6 text-white shadow-sm">
            <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.2em] uppercase">
                  Family Member Dashboard
                </span>
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Manage death registration and cemetery booking in one place</h2>
                  <p className="mt-2 text-sm text-blue-100 sm:text-base">
                    Track active cases, open finalized CR-02 forms, and move directly to the cemetery booking process from a cleaner dashboard.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                >
                  Report a Death
                </button>
                <button
                  onClick={() => goToCemeteryBooking()}
                  className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Go to Cemetery Booking
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">Active Cases</p>
              <p className="mt-2 text-3xl font-bold text-blue-950">{pendingCases.length}</p>
              <p className="mt-1 text-sm text-blue-800">Cases still moving through GN, doctor, or registrar review.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">Completed CR-02</p>
              <p className="mt-2 text-3xl font-bold text-emerald-950">{completedCases.length}</p>
              <p className="mt-1 text-sm text-emerald-800">Finalized certificates ready for viewing, download, and burial planning.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Action Needed</p>
              <p className="mt-2 text-3xl font-bold text-amber-950">{doctorActionCases.length}</p>
              <p className="mt-1 text-sm text-amber-800">Cases waiting for you to provide a doctor for medical confirmation.</p>
            </div>
          </section>
        </>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateCase} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Initial Death Report</h3>
              <p className="text-sm text-gray-500">Start a new death registration case and pre-fill the future CR-02 declaration.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Back to Dashboard
            </button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Deceased Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Deceased Full Name *</label>
                <input type="text" required value={basicData.deceasedFullName} onChange={(e) => setBasicData({ ...basicData, deceasedFullName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deceased NIC</label>
                <input type="text" value={basicData.deceasedNic} onChange={(e) => setBasicData({ ...basicData, deceasedNic: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={basicData.dateOfBirth} onChange={(e) => setBasicData({ ...basicData, dateOfBirth: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Death *</label>
                <input type="date" required value={basicData.dateOfDeath} onChange={(e) => setBasicData({ ...basicData, dateOfDeath: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select value={basicData.gender} onChange={(e) => setBasicData({ ...basicData, gender: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sector Code *</label>
                <input type="text" required value={basicData.sectorCode} onChange={(e) => setBasicData({ ...basicData, sectorCode: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. KANDY-01" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <input type="text" required value={basicData.address} onChange={(e) => setBasicData({ ...basicData, address: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">CR-02 Declaration Details</h4>
            <p className="text-xs text-gray-500 mb-3">This information will pre-fill the Registrar&apos;s form. Please complete as accurately as possible.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death (English)</label>
                <input type="text" value={cr2Fields.placeInEnglish} onChange={(e) => setCr2Fields({ ...cr2Fields, placeInEnglish: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Hospital / home address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death (Sinhala/Tamil)</label>
                <input type="text" value={cr2Fields.placeInSinhalaOrTamil} onChange={(e) => setCr2Fields({ ...cr2Fields, placeInSinhalaOrTamil: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time of Death</label>
                <input type="time" value={cr2Fields.timeOfDeath} onChange={(e) => setCr2Fields({ ...cr2Fields, timeOfDeath: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location Type</label>
                <select value={cr2Fields.deathLocation} onChange={(e) => setCr2Fields({ ...cr2Fields, deathLocation: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option value="">-- Select --</option>
                  <option value="hospital">Hospital</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <input type="text" value={cr2Fields.district} onChange={(e) => setCr2Fields({ ...cr2Fields, district: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DS Division</label>
                <input type="text" value={cr2Fields.dsDivision} onChange={(e) => setCr2Fields({ ...cr2Fields, dsDivision: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registrar Division</label>
                <input type="text" value={cr2Fields.regDivision} onChange={(e) => setCr2Fields({ ...cr2Fields, regDivision: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Burial Place</label>
                <input type="text" value={cr2Fields.burialPlace} onChange={(e) => setCr2Fields({ ...cr2Fields, burialPlace: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Informant Capacity</label>
                <input type="text" value={cr2Fields.informantCapacity} onChange={(e) => setCr2Fields({ ...cr2Fields, informantCapacity: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. Son, Daughter, Spouse" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Informant Phone</label>
                <input type="tel" value={cr2Fields.informantPhone} onChange={(e) => setCr2Fields({ ...cr2Fields, informantPhone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">Doctor Pre-Assignment (Optional)</h4>
            <p className="text-xs text-gray-500 mb-3">If the GN requests a medical confirmation, this doctor will be automatically notified. You can also provide one later if required.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Doctor ID</label>
              <input type="text" value={basicData.doctorId} onChange={(e) => setBasicData({ ...basicData, doctorId: e.target.value })} className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. DOC-A1B2C3" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submittingCase} className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-60">
              {submittingCase ? "Submitting..." : "Submit Report"}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-800 px-5 py-2 rounded font-medium hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showCreateForm && cases.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
          No active cases found. Click &quot;Report a Death&quot; to start the process.
        </div>
      )}

      {!showCreateForm && (
        <section className="space-y-4">
          {cases.map((caseItem) => (
            <div key={caseItem.caseId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{caseItem.deceasedFullName}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusTone(caseItem.status)}`}>
                      {caseItem.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">NIC: {caseItem.deceasedNic || "Not provided"} • Case #{caseItem.caseId}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {caseItem.status === "CR2_ISSUED_CLOSED" && (
                    <>
                      <button
                        onClick={() => void handleOpenCr2View(caseItem.caseId)}
                        disabled={cr2LoadingCaseId === caseItem.caseId}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                      >
                        {cr2LoadingCaseId === caseItem.caseId ? "Loading..." : "View CR-02"}
                      </button>
                      <button
                        onClick={() => goToCemeteryBooking(caseItem.caseId)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                      >
                        Cemetery Booking
                      </button>
                    </>
                  )}
                </div>
              </div>

              {caseItem.status === "PENDING_GN_REVIEW" && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Your case has been submitted and is awaiting review by the Grama Niladhari officer in your sector.
                </div>
              )}

              {caseItem.status === "PENDING_DOCTOR_ASSIGNMENT" && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <h4 className="font-semibold text-amber-900">Action Required: Provide a Doctor</h4>
                  <p className="mt-2 text-sm text-amber-800">
                    The Grama Niladhari has requested a medical confirmation for this case, but no doctor was assigned during case creation.
                    Please provide the doctor&apos;s system ID below.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="e.g. DOC-A1B2C3"
                      value={doctorIdInputs[caseItem.caseId] || ""}
                      onChange={(e) => setDoctorIdInputs((prev) => ({ ...prev, [caseItem.caseId]: e.target.value }))}
                      className="block rounded-md border border-amber-300 bg-white p-2 text-sm font-mono shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:w-56"
                    />
                    <button
                      onClick={() => void handleAssignDoctor(caseItem.caseId)}
                      disabled={assigningDoctor === caseItem.caseId}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      {assigningDoctor === caseItem.caseId ? "Assigning..." : "Assign Doctor"}
                    </button>
                  </div>
                </div>
              )}

              {caseItem.status === "PENDING_B12_MEDICAL" && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Awaiting medical confirmation from the assigned doctor.
                </div>
              )}

              {caseItem.status === "PENDING_REGISTRAR_REVIEW" && (
                <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
                  All verifications are complete. Your case is now with the Registrar for final CR-2 certificate issuance.
                </div>
              )}

              {caseItem.status === "REJECTED_UNNATURAL_DEATH" && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm">
                  <h4 className="text-lg font-bold text-red-900">Case Rejected: Unnatural Death</h4>
                  <p className="mt-2 text-sm font-medium text-red-800">
                    The certifying Medical Officer has officially logged this case as an unnatural death. The standard death registration process cannot continue.
                    <br />
                    <br />
                    <strong>Required action:</strong> Please report this immediately to your local police station for further investigation.
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
