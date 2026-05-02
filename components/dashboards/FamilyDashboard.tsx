"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";
import { assignDoctor, createCase, getCaseDetail, getMyCases, type CaseDetailResponse, type CaseListItem } from "../../lib/api";
import { canonicalFamilyReportSchema, computeAgeAtDeath, createInitialFamilyReport, type CanonicalFamilyReport } from "../../lib/death-report-schema";
import { caseDetailToPrefill } from "../../lib/mappers/caseDetailToPrefill";
import { DeathDeclarationForm } from "../death-declaration-CR02/death-declaration-form";
import { useToast } from "../../hooks/use-toast";

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

function numberOrNull(value: string) {
  return value.trim() === "" ? null : Number(value);
}

export function FamilyDashboard() {
  const { token, currentUsername } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [familyReport, setFamilyReport] = useState<CanonicalFamilyReport>(createInitialFamilyReport());
  const [submittingCase, setSubmittingCase] = useState(false);

  const [cr2CaseId, setCr2CaseId] = useState<number | null>(null);
  const [cr2CaseDetails, setCr2CaseDetails] = useState<CaseDetailResponse | null>(null);
  const [cr2LoadingCaseId, setCr2LoadingCaseId] = useState<number | null>(null);

  const [doctorIdInputs, setDoctorIdInputs] = useState<Record<number, string>>({});
  const [assigningDoctor, setAssigningDoctor] = useState<number | null>(null);
  const [nicLookupStatus, setNicLookupStatus] = useState<"idle" | "loading" | "found" | "not-found">("idle");
  const [otpStep, setOtpStep] = useState(false);
  const [submissionOtp, setSubmissionOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devSubmissionOtp, setDevSubmissionOtp] = useState<string | null>(null);
  const [showDevSubmissionOtp, setShowDevSubmissionOtp] = useState(false);

  const completedCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "CR2_ISSUED_CLOSED"),
    [cases],
  );
  const pendingCases = useMemo(
    () => cases.filter((caseItem) => !["CR2_ISSUED_CLOSED", "REJECTED_UNNATURAL_DEATH"].includes(caseItem.status)),
    [cases],
  );
  const doctorActionCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "PENDING_DOCTOR_ASSIGNMENT"),
    [cases],
  );

  const derivedAge =
    computeAgeAtDeath(familyReport.deceased.dateOfBirth, familyReport.death.date) ?? {
      years: familyReport.deceased.ageYears ?? 0,
      months: familyReport.deceased.ageMonths ?? 0,
      days: familyReport.deceased.ageDays ?? 0,
    };
  const showMaternal = familyReport.deceased.gender === "FEMALE" && derivedAge.years < 49;

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

  const buildParsed = () =>
    canonicalFamilyReportSchema.safeParse({
      ...familyReport,
      doctorId: familyReport.doctorId?.trim() || null,
      deceased: {
        ...familyReport.deceased,
        nic: familyReport.deceased.nic?.trim() || null,
        passportCountry: familyReport.deceased.passportCountry?.trim() || null,
        passportNumber: familyReport.deceased.passportNumber?.trim() || null,
        fullNameOfficialLanguage: familyReport.deceased.fullNameOfficialLanguage?.trim() || null,
        race: familyReport.deceased.race?.trim() || null,
        profession: familyReport.deceased.profession?.trim() || null,
        fatherNic: familyReport.deceased.fatherNic?.trim() || null,
        fatherName: familyReport.deceased.fatherName?.trim() || null,
        motherNic: familyReport.deceased.motherNic?.trim() || null,
        motherName: familyReport.deceased.motherName?.trim() || null,
      },
      death: {
        ...familyReport.death,
        time: familyReport.death.time?.trim() || null,
        placeOfficialLanguage: familyReport.death.placeOfficialLanguage?.trim() || null,
        familyNarrative: familyReport.death.familyNarrative?.trim() || null,
        burialOrCremationPlace: familyReport.death.burialOrCremationPlace?.trim() || null,
      },
      maternal: { ...familyReport.maternal },
      informant: {
        ...familyReport.informant,
        otherCapacityText: familyReport.informant.otherCapacityText?.trim() || null,
        landline: familyReport.informant.landline?.trim() || null,
        email: familyReport.informant.email?.trim() || null,
      },
    });

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = buildParsed();
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast({
        title: "Validation Error",
        description: issue?.message || "Please complete the required fields.",
        variant: "destructive",
      });
      return;
    }

    // Phase 1: validate form → send OTP → show OTP input
    if (!otpStep) {
      setSendingOtp(true);
      try {
        await fetch("http://localhost:8080/api/v1/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUsername }),
        });
        setOtpStep(true);
        setShowDevSubmissionOtp(false);
        setDevSubmissionOtp(null);
        toast({ title: "OTP Sent", description: "A verification code has been sent to your registered phone number." });
      } catch {
        toast({ title: "Error", description: "Failed to send OTP. Please try again.", variant: "destructive" });
      } finally {
        setSendingOtp(false);
      }
      return;
    }

    // Phase 2: submit with OTP
    setSubmittingCase(true);
    try {
      await createCase({ familyReport: parsed.data, submissionOtp }, token);
      setShowCreateForm(false);
      setFamilyReport(createInitialFamilyReport());
      setOtpStep(false);
      setSubmissionOtp("");
      await fetchCases();
      toast({ title: "Case Created", description: "Your death report has been submitted successfully." });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Error creating case.", variant: "destructive" });
    } finally {
      setSubmittingCase(false);
    }
  };

  const handleAssignDoctor = async (caseId: number) => {
    const doctorId = doctorIdInputs[caseId]?.trim();

    if (!doctorId) {
      toast({
        title: "Validation Error",
        description: "Please enter a Doctor ID (for example, DOC-A1B2C3).",
        variant: "destructive",
      });
      return;
    }

    setAssigningDoctor(caseId);

    try {
      await assignDoctor(caseId, doctorId, token);
      toast({
        title: "Doctor Assigned",
        description: "The case is now pending medical review.",
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

  const handleNicBlur = async (nic: string) => {
    if (!nic || nic.trim().length < 9) return;
    setNicLookupStatus("loading");
    try {
      const res = await fetch(`http://localhost:8080/api/v1/citizens/${nic.trim()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setNicLookupStatus("not-found"); return; }
      const c = await res.json();
      if (c.fullNameSinhala)   updateDeceased("fullNameOfficialLanguage", c.fullNameSinhala);
      if (c.fullName)          updateDeceased("fullNameEnglish", c.fullName);
      if (c.dateOfBirth)       updateDeceased("dateOfBirth", c.dateOfBirth);
      if (c.ageYears != null)  updateDeceased("ageYears", c.ageYears);
      if (c.ageMonths != null) updateDeceased("ageMonths", c.ageMonths);
      if (c.ageDays != null)   updateDeceased("ageDays", c.ageDays);
      if (c.nationality)       updateDeceased("nationality", c.nationality);
      if (c.gender)            updateDeceased("gender", c.gender.toUpperCase() as "MALE" | "FEMALE");
      if (c.ethnicity)         updateDeceased("race", c.ethnicity);
      if (c.occupation)        updateDeceased("profession", c.occupation);
      if (c.address)           updatePermanentAddress("fullText", c.address);
      if (c.addressDistrict)   updatePermanentAddress("district", c.addressDistrict);
      if (c.addressDivision)   updatePermanentAddress("dsDivision", c.addressDivision);
      if (c.addressGnDivision) updatePermanentAddress("gnDivision", c.addressGnDivision);
      setNicLookupStatus("found");
    } catch {
      setNicLookupStatus("not-found");
    }
  };

  const updateReport = <K extends keyof CanonicalFamilyReport>(key: K, value: CanonicalFamilyReport[K]) => {
    setFamilyReport((prev) => ({ ...prev, [key]: value }));
  };

  const updateDeceased = <K extends keyof CanonicalFamilyReport["deceased"]>(
    key: K,
    value: CanonicalFamilyReport["deceased"][K],
  ) => {
    setFamilyReport((prev) => ({ ...prev, deceased: { ...prev.deceased, [key]: value } }));
  };

  const updatePermanentAddress = <K extends keyof CanonicalFamilyReport["deceased"]["permanentAddress"]>(
    key: K,
    value: CanonicalFamilyReport["deceased"]["permanentAddress"][K],
  ) => {
    setFamilyReport((prev) => ({
      ...prev,
      deceased: {
        ...prev.deceased,
        permanentAddress: { ...prev.deceased.permanentAddress, [key]: value },
      },
    }));
  };

  const updateDeath = <K extends keyof CanonicalFamilyReport["death"]>(
    key: K,
    value: CanonicalFamilyReport["death"][K],
  ) => {
    setFamilyReport((prev) => ({ ...prev, death: { ...prev.death, [key]: value } }));
  };

  const updateMaternal = <K extends keyof CanonicalFamilyReport["maternal"]>(
    key: K,
    value: CanonicalFamilyReport["maternal"][K],
  ) => {
    setFamilyReport((prev) => ({ ...prev, maternal: { ...prev.maternal, [key]: value } }));
  };

  const updateInformant = <K extends keyof CanonicalFamilyReport["informant"]>(
    key: K,
    value: CanonicalFamilyReport["informant"][K],
  ) => {
    setFamilyReport((prev) => ({ ...prev, informant: { ...prev.informant, [key]: value } }));
  };

  if (loading) {
    return <div className="p-4 text-center">Loading cases...</div>;
  }

  if (cr2CaseId && cr2CaseDetails) {
    const initialData = caseDetailToPrefill(cr2CaseDetails).cr2;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">View Finalized CR-2 Declaration - Case #{cr2CaseId}</h2>
          <button
            onClick={() => {
              setCr2CaseId(null);
              setCr2CaseDetails(null);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to Cases
          </button>
        </div>

        <DeathDeclarationForm
          mode="family"
          isReviewFlow
          initialData={initialData}
          isReadOnly
          onReviewSubmit={async () => {}}
          onCancel={() => {
            setCr2CaseId(null);
            setCr2CaseDetails(null);
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
                    Track active cases, review finalized CR-2 declarations, and keep the doctor-assignment step moving when medical confirmation is needed.
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
              <p className="mt-1 text-sm text-emerald-800">Finalized certificates ready for viewing and burial planning.</p>
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
        <form onSubmit={handleCreateCase} className="space-y-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Initial Death Report</h3>
              <p className="text-sm text-gray-500">This report becomes the canonical source for B-24, CR-2, and the B-12 header.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Back to Dashboard
            </button>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Workflow</h4>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">Natural Death at Home</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sector Code *</label>
                <input
                  type="text"
                  value={familyReport.sectorCode}
                  onChange={(e) => updateReport("sectorCode", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor ID (Optional)</label>
                <input
                  type="text"
                  value={familyReport.doctorId || ""}
                  onChange={(e) => updateReport("doctorId", e.target.value || null)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  placeholder="e.g. DOC-A1B2C3"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Deceased Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Identification Status *</label>
                <select
                  value={familyReport.deceased.identificationStatus}
                  onChange={(e) => updateDeceased("identificationStatus", e.target.value as CanonicalFamilyReport["deceased"]["identificationStatus"])}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="IDENTIFIED_SRI_LANKAN">Identified Sri Lankan</option>
                  <option value="IDENTIFIED_FOREIGNER">Identified Foreigner</option>
                  <option value="NOT_IDENTIFIED">Not Identified</option>
                </select>
              </div>
              {familyReport.deceased.identificationStatus === "IDENTIFIED_SRI_LANKAN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIC *</label>
                  <input
                    type="text"
                    value={familyReport.deceased.nic || ""}
                    onChange={(e) => { updateDeceased("nic", e.target.value); setNicLookupStatus("idle"); }}
                    onBlur={(e) => void handleNicBlur(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                  {nicLookupStatus === "loading" && <p className="mt-1 text-xs text-blue-500">Looking up citizen registry...</p>}
                  {nicLookupStatus === "found" && <p className="mt-1 text-xs text-green-600">✓ Details filled from national registry. Review and correct if needed.</p>}
                  {nicLookupStatus === "not-found" && <p className="mt-1 text-xs text-amber-600">NIC not found in registry — please fill in details manually.</p>}
                </div>
              )}
              {familyReport.deceased.identificationStatus === "IDENTIFIED_FOREIGNER" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Passport Country *</label>
                    <input
                      type="text"
                      value={familyReport.deceased.passportCountry || ""}
                      onChange={(e) => updateDeceased("passportCountry", e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Passport Number *</label>
                    <input
                      type="text"
                      value={familyReport.deceased.passportNumber || ""}
                      onChange={(e) => updateDeceased("passportNumber", e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name (Official Language)</label>
                <input
                  type="text"
                  value={familyReport.deceased.fullNameOfficialLanguage || ""}
                  onChange={(e) => updateDeceased("fullNameOfficialLanguage", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name (English) *</label>
                <input
                  type="text"
                  value={familyReport.deceased.fullNameEnglish}
                  onChange={(e) => updateDeceased("fullNameEnglish", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  value={familyReport.deceased.dateOfBirth || ""}
                  onChange={(e) => updateDeceased("dateOfBirth", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Years</label>
                  <input
                    type="number"
                    min={0}
                    value={familyReport.deceased.ageYears ?? ""}
                    onChange={(e) => updateDeceased("ageYears", numberOrNull(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Months</label>
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={familyReport.deceased.ageMonths ?? ""}
                    onChange={(e) => updateDeceased("ageMonths", numberOrNull(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Days</label>
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={familyReport.deceased.ageDays ?? ""}
                    onChange={(e) => updateDeceased("ageDays", numberOrNull(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nationality *</label>
                <input
                  type="text"
                  value={familyReport.deceased.nationality}
                  onChange={(e) => updateDeceased("nationality", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select
                  value={familyReport.deceased.gender}
                  onChange={(e) => updateDeceased("gender", e.target.value as CanonicalFamilyReport["deceased"]["gender"])}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Race</label>
                <input
                  type="text"
                  value={familyReport.deceased.race || ""}
                  onChange={(e) => updateDeceased("race", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profession</label>
                <input
                  type="text"
                  value={familyReport.deceased.profession || ""}
                  onChange={(e) => updateDeceased("profession", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pension Status</label>
                <select
                  value={familyReport.deceased.pensionStatus == null ? "" : familyReport.deceased.pensionStatus ? "yes" : "no"}
                  onChange={(e) =>
                    updateDeceased(
                      "pensionStatus",
                      e.target.value === "" ? null : e.target.value === "yes",
                    )
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">Select</option>
                  <option value="yes">Pensioner</option>
                  <option value="no">Not a pensioner</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Permanent Address *</label>
                <textarea
                  value={familyReport.deceased.permanentAddress.fullText}
                  onChange={(e) => updatePermanentAddress("fullText", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permanent District *</label>
                <input
                  type="text"
                  value={familyReport.deceased.permanentAddress.district}
                  onChange={(e) => updatePermanentAddress("district", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permanent DS Division *</label>
                <input
                  type="text"
                  value={familyReport.deceased.permanentAddress.dsDivision}
                  onChange={(e) => updatePermanentAddress("dsDivision", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permanent GN Division *</label>
                <input
                  type="text"
                  value={familyReport.deceased.permanentAddress.gnDivision}
                  onChange={(e) => updatePermanentAddress("gnDivision", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Father NIC</label>
                <input
                  type="text"
                  value={familyReport.deceased.fatherNic || ""}
                  onChange={(e) => updateDeceased("fatherNic", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Father Name</label>
                <input
                  type="text"
                  value={familyReport.deceased.fatherName || ""}
                  onChange={(e) => updateDeceased("fatherName", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mother NIC</label>
                <input
                  type="text"
                  value={familyReport.deceased.motherNic || ""}
                  onChange={(e) => updateDeceased("motherNic", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mother Name</label>
                <input
                  type="text"
                  value={familyReport.deceased.motherName || ""}
                  onChange={(e) => updateDeceased("motherName", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Death Details</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Death *</label>
                <input
                  type="date"
                  value={familyReport.death.date}
                  onChange={(e) => updateDeath("date", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time of Death</label>
                <input
                  type="time"
                  value={familyReport.death.time || ""}
                  onChange={(e) => updateDeath("time", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death (Official Language)</label>
                <input
                  type="text"
                  value={familyReport.death.placeOfficialLanguage || ""}
                  onChange={(e) => updateDeath("placeOfficialLanguage", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Death (English) *</label>
                <input
                  type="text"
                  value={familyReport.death.placeEnglish}
                  onChange={(e) => updateDeath("placeEnglish", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place District *</label>
                <input
                  type="text"
                  value={familyReport.death.placeDistrict}
                  onChange={(e) => updateDeath("placeDistrict", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place DS Division *</label>
                <input
                  type="text"
                  value={familyReport.death.placeDsDivision}
                  onChange={(e) => updateDeath("placeDsDivision", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Division *</label>
                <input
                  type="text"
                  value={familyReport.death.registrationDivision}
                  onChange={(e) => updateDeath("registrationDivision", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cause Known by Family</label>
                <select
                  value={familyReport.death.causeKnownByFamily == null ? "" : familyReport.death.causeKnownByFamily ? "yes" : "no"}
                  onChange={(e) => updateDeath("causeKnownByFamily", e.target.value === "" ? null : e.target.value === "yes")}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Family Narrative</label>
                <textarea
                  value={familyReport.death.familyNarrative || ""}
                  onChange={(e) => updateDeath("familyNarrative", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Burial or Cremation Place</label>
                <input
                  type="text"
                  value={familyReport.death.burialOrCremationPlace || ""}
                  onChange={(e) => updateDeath("burialOrCremationPlace", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  placeholder="Optional and non-blocking"
                />
              </div>
            </div>
          </section>

          {showMaternal && (
            <section className="space-y-4 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Maternal Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pregnant at Death</label>
                  <select
                    value={familyReport.maternal.wasPregnantAtDeath == null ? "" : familyReport.maternal.wasPregnantAtDeath ? "yes" : "no"}
                    onChange={(e) => updateMaternal("wasPregnantAtDeath", e.target.value === "" ? null : e.target.value === "yes")}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gave Birth Within 42 Days</label>
                  <select
                    value={familyReport.maternal.gaveBirthWithin42Days == null ? "" : familyReport.maternal.gaveBirthWithin42Days ? "yes" : "no"}
                    onChange={(e) => updateMaternal("gaveBirthWithin42Days", e.target.value === "" ? null : e.target.value === "yes")}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Had Abortion</label>
                  <select
                    value={familyReport.maternal.hadAbortion == null ? "" : familyReport.maternal.hadAbortion ? "yes" : "no"}
                    onChange={(e) => updateMaternal("hadAbortion", e.target.value === "" ? null : e.target.value === "yes")}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Days Since Birth or Abortion</label>
                  <input
                    type="number"
                    min={0}
                    value={familyReport.maternal.daysSinceBirthOrAbortion ?? ""}
                    onChange={(e) => updateMaternal("daysSinceBirthOrAbortion", numberOrNull(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Informant Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship *</label>
                <select
                  value={familyReport.informant.capacity}
                  onChange={(e) => updateInformant("capacity", e.target.value as CanonicalFamilyReport["informant"]["capacity"])}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="HUSBAND_WIFE">Husband / Wife</option>
                  <option value="FATHER_MOTHER">Father / Mother</option>
                  <option value="SON_DAUGHTER">Son / Daughter</option>
                  <option value="BROTHER_SISTER">Brother / Sister</option>
                  <option value="RELATIVE">Relative</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {familyReport.informant.capacity === "OTHER" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Describe Relationship *</label>
                  <input
                    type="text"
                    value={familyReport.informant.otherCapacityText || ""}
                    onChange={(e) => updateInformant("otherCapacityText", e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Informant NIC or Passport *</label>
                <input
                  type="text"
                  value={familyReport.informant.nicOrPassport}
                  onChange={(e) => updateInformant("nicOrPassport", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Informant Full Name *</label>
                <input
                  type="text"
                  value={familyReport.informant.fullName}
                  onChange={(e) => updateInformant("fullName", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Postal Address *</label>
                <textarea
                  value={familyReport.informant.postalAddress}
                  onChange={(e) => updateInformant("postalAddress", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile *</label>
                <input
                  type="tel"
                  value={familyReport.informant.mobile}
                  onChange={(e) => updateInformant("mobile", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Landline</label>
                <input
                  type="tel"
                  value={familyReport.informant.landline || ""}
                  onChange={(e) => updateInformant("landline", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={familyReport.informant.email || ""}
                  onChange={(e) => updateInformant("email", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={familyReport.declarationConfirmed}
                onChange={(e) => updateReport("declarationConfirmed", e.target.checked)}
                className="mt-1"
              />
              <span>I confirm that this information is true and will be used as the canonical source for the later registration workflow.</span>
            </label>
          </section>

          {/* ── OTP verification step ── */}
          {otpStep && (
            <section className="space-y-4 border-t border-blue-200 pt-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Verify your identity to submit</p>
                  <p className="text-sm text-blue-700 mt-1">A 6-digit code has been sent to your registered phone. Enter it below to confirm this death report.</p>
                </div>

                {/* Dev OTP reveal */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">🛠 Development Mode — SMS not yet wired</p>
                  {!showDevSubmissionOtp ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setShowDevSubmissionOtp(true);
                        try {
                          const res = await fetch(`http://localhost:8080/api/v1/auth/dev/otp/${currentUsername}`);
                          const data = await res.json();
                          setDevSubmissionOtp(data.otp || null);
                        } catch {
                          setDevSubmissionOtp(null);
                        }
                      }}
                      className="text-xs font-bold text-amber-800 underline hover:text-amber-900"
                    >
                      Show OTP from server
                    </button>
                  ) : (
                    <p className="text-sm font-mono font-bold text-amber-900 tracking-widest">
                      {devSubmissionOtp ?? "Loading..."}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    value={submissionOtp}
                    onChange={(e) => setSubmissionOtp(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    className="block w-40 rounded-md border border-gray-300 p-2 text-center text-lg font-mono tracking-widest"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await fetch("http://localhost:8080/api/v1/auth/send-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username: currentUsername }),
                    });
                    setShowDevSubmissionOtp(false);
                    setDevSubmissionOtp(null);
                    toast({ title: "OTP Resent", description: "A new code has been sent to your phone." });
                  }}
                  className="text-xs text-blue-600 underline hover:text-blue-800"
                >
                  Resend OTP
                </button>
              </div>
            </section>
          )}

          <div className="flex gap-3">
            {!otpStep ? (
              <button type="submit" disabled={sendingOtp} className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {sendingOtp ? "Sending OTP..." : "Submit Report"}
              </button>
            ) : (
              <button type="submit" disabled={submittingCase} className="rounded bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60">
                {submittingCase ? "Submitting..." : "Verify & Submit"}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setOtpStep(false); setSubmissionOtp(""); }}
              className="rounded bg-gray-200 px-5 py-2 font-medium text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showCreateForm && cases.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500">
          No active cases found. Click "Report a Death" to start the process.
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
                  <p className="text-sm text-gray-500">NIC: {caseItem.deceasedNic || "Not provided"} | Case #{caseItem.caseId}</p>
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
                    The certifying Medical Officer has logged this case as an unnatural death. The standard death registration process cannot continue.
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
