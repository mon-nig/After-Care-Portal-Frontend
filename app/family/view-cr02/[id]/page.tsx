"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  fetchCr02ById, 
  fetchCemeteries, 
  submitCemeteryRequest, 
  fetchFamilyCemeteryRequests,
  fetchCemeterySchedules,
  fetchBookedSlots
} from "../../../../lib/api";
import { useAuth } from "../../../../contexts/auth-context";

interface CR02Data {
  id: number;
  typeOfDeath: string;
  deathYear: number;
  deathMonth: number;
  deathDay: number;
  district: string;
  dsDivision: string;
  regDivision: string;
  placeInSinhalaOrTamil: string;
  placeInEnglish: string;
  timeOfDeath: string;
  deathLocation: string;
  causeEstablished: string;
  causeOfDeath: string;
  icdCode: string;
  burialPlace: string;
  informantCapacity: string;
  informantId: string;
  informantName: string;
  informantAddress: string;
  informantPhone: string;
  informantEmail: string;
  cr02FamilyNicNo: string;
  deceasedName: string;
  submittedByUsername: string;
  currentStage: string;
  submissionTimestamp: string;
}

interface CemeteryUser {
  username: string;
  fullName: string;
}

interface CemeteryRequest {
  id: number;
  cr02FormId: number;
  cemeteryUsername: string;
  requestedDate: string;
  status: string;
  timeSlot?: string;
}

interface ScheduleSlot {
  id: number;
  timeSlot: string;
}

export default function ViewCR02Page() {
  const params = useParams();
  const router = useRouter();
  const { currentRole, currentNicNo } = useAuth();
  const [cr02, setCr02] = useState<CR02Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [cemeteries, setCemeteries] = useState<CemeteryUser[]>([]);
  const [cemeteryRequest, setCemeteryRequest] = useState<CemeteryRequest | null>(null);
  const [selectedCemetery, setSelectedCemetery] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  
  const [masterSlots, setMasterSlots] = useState<ScheduleSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const formId = Number(params.id);

  useEffect(() => {
    if (currentRole !== "FAMILY" && currentRole !== "REGISTRAR") {
      router.push("/");
      return;
    }
    fetchCr02ById(formId)
      .then(setCr02)
      .catch(() => setError("Failed to load CR02 form data."))
      .finally(() => setLoading(false));

    if (currentRole === "FAMILY") {
      fetchCemeteries().then(setCemeteries).catch(console.error);
      if (currentNicNo) {
        fetchFamilyCemeteryRequests(currentNicNo)
          .then((reqs: CemeteryRequest[]) => {
            const match = reqs.find((r) => r.cr02FormId === formId);
            if (match) setCemeteryRequest(match);
          })
          .catch(console.error);
      }
    }
  }, [formId, currentRole, currentNicNo, router]);

  // When Cemetery or Date changes, fetch slots!
  useEffect(() => {
    setSelectedTimeSlot("");
    if (!selectedCemetery || !requestedDate) {
      setMasterSlots([]);
      setBookedSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const [masters, booked] = await Promise.all([
          fetchCemeterySchedules(selectedCemetery),
          fetchBookedSlots(selectedCemetery, requestedDate)
        ]);
        setMasterSlots(masters);
        setBookedSlots(booked);
      } catch(err) {
        console.error("Failed to fetch scheduling slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selectedCemetery, requestedDate]);

  const handleCemeteryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cr02 || !currentNicNo || !selectedCemetery || !requestedDate || !selectedTimeSlot) return;

    setSubmittingReq(true);
    setReqError(null);
    try {
      const data = {
        familyNicNo: currentNicNo,
        cr02FormId: formId,
        deceasedName: cr02.deceasedName,
        cemeteryUsername: selectedCemetery,
        requestedDate: requestedDate,
        timeSlot: selectedTimeSlot
      };
      const res = await submitCemeteryRequest(data);
      setCemeteryRequest(res);
    } catch (err: any) {
      setReqError(err.message || "Failed to submit request.");
    } finally {
      setSubmittingReq(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    );
  }

  if (error && !cr02) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="text-blue-600 underline hover:text-blue-800">
            Go back to dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!cr02) return null;

  const formatDate = (year: number, month: number, day: number) => {
    if (!year || !month || !day) return "—";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const sections = [
    {
      title: "Deceased Information",
      fields: [
        { label: "Full Name", value: cr02.deceasedName },
        { label: "Family Member NIC", value: cr02.cr02FamilyNicNo },
        { label: "Date of Death", value: formatDate(cr02.deathYear, cr02.deathMonth, cr02.deathDay) },
        { label: "Time of Death", value: cr02.timeOfDeath },
        { label: "Type of Death", value: cr02.typeOfDeath },
        { label: "Death Location", value: cr02.deathLocation },
      ]
    },
    {
      title: "Location Details",
      fields: [
        { label: "District", value: cr02.district },
        { label: "DS Division", value: cr02.dsDivision },
        { label: "Registrar Division", value: cr02.regDivision },
        { label: "Place (Sinhala/Tamil)", value: cr02.placeInSinhalaOrTamil },
        { label: "Place (English)", value: cr02.placeInEnglish },
        { label: "Burial Place", value: cr02.burialPlace },
      ]
    },
    {
      title: "Medical Information",
      fields: [
        { label: "Cause Established By", value: cr02.causeEstablished },
        { label: "Cause of Death", value: cr02.causeOfDeath },
        { label: "ICD Code", value: cr02.icdCode },
      ]
    },
    {
      title: "Informant Details",
      fields: [
        { label: "Name", value: cr02.informantName },
        { label: "Capacity", value: cr02.informantCapacity },
        { label: "ID / NIC", value: cr02.informantId },
        { label: "Address", value: cr02.informantAddress },
        { label: "Phone", value: cr02.informantPhone },
        { label: "Email", value: cr02.informantEmail },
      ]
    },
    {
      title: "Processing Details",
      fields: [
        { label: "Submitted By", value: cr02.submittedByUsername },
        { label: "Current Stage", value: cr02.currentStage?.replace(/_/g, " ") },
        { label: "Submitted At", value: cr02.submissionTimestamp ? new Date(cr02.submissionTimestamp).toLocaleString("en-LK") : "—" },
      ]
    }
  ];

  const availableSlots = masterSlots.filter(s => !bookedSlots.includes(s.timeSlot));

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">View CR02 Declaration</h1>
            <p className="text-sm text-gray-500">Form #{cr02.id} &bull; {cr02.deceasedName}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </header>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50/50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-md font-semibold text-gray-800">{section.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 px-6 py-5">
                {section.fields.map((f, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{f.label}</span>
                    <span className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                      {f.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {currentRole === "FAMILY" && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
              <h2 className="text-md font-semibold text-purple-900">Cemetery Booking</h2>
              {cemeteryRequest ? (
                  <p className="text-sm text-purple-700 mt-1">You have already submitted a request for this declaration.</p>
              ) : (
                  <p className="text-sm text-purple-700 mt-1">Book an available spot in a verified cemetery.</p>
              )}
            </div>
            <div className="px-6 py-6">
              {cemeteryRequest ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Your Booking Request</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cemetery</p>
                      <p className="font-medium text-gray-900">{cemeteries.find(c => c.username === cemeteryRequest.cemeteryUsername)?.fullName || cemeteryRequest.cemeteryUsername}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Requested Date</p>
                      <p className="font-medium text-gray-900">{cemeteryRequest.requestedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time Slot</p>
                      <p className="font-medium text-gray-900">{cemeteryRequest.timeSlot || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                        cemeteryRequest.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        cemeteryRequest.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cemeteryRequest.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCemeteryRequest} className="space-y-6 max-w-2xl">
                  {reqError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{reqError}</div>}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Cemetery</label>
                      <select 
                        required
                        value={selectedCemetery}
                        onChange={(e) => setSelectedCemetery(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                      >
                        <option value="">-- Choose Cemetery --</option>
                        {cemeteries.map(c => (
                          <option key={c.username} value={c.username}>{c.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Needed</label>
                      <input 
                        required
                        type="date"
                        value={requestedDate}
                        onChange={(e) => setRequestedDate(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                      />
                    </div>
                  </div>

                  {/* Time slot availability section */}
                  {selectedCemetery && requestedDate && (
                     <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Available Time Slots for {requestedDate}</h4>
                        {loadingSlots ? (
                          <p className="text-sm text-gray-500 italic">Checking availability...</p>
                        ) : masterSlots.length === 0 ? (
                          <p className="text-sm text-red-600">The selected cemetery does not have any bookable time slots configured.</p>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-sm text-red-600">All slots for this date have been booked. Please select another date.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot.timeSlot)}
                                className={`py-2 px-3 text-sm text-center font-medium rounded-md border transition-all ${
                                  selectedTimeSlot === slot.timeSlot 
                                    ? "bg-purple-100 border-purple-600 text-purple-800 shadow-sm ring-1 ring-purple-600" 
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {slot.timeSlot}
                              </button>
                            ))}
                          </div>
                        )}
                        {!selectedTimeSlot && availableSlots.length > 0 && (
                          <p className="text-xs text-gray-500 mt-3">Select one of the highlighted options above.</p>
                        )}
                     </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReq || !selectedCemetery || !requestedDate || !selectedTimeSlot}
                    className="mt-4 px-6 py-2.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {submittingReq ? "Submitting..." : "Send Booking Request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-[#4a7c9f] text-white rounded-md text-sm font-bold hover:bg-[#3b6787] transition-colors shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Form
          </button>
        </div>
      </div>
    </main>
  );
}
