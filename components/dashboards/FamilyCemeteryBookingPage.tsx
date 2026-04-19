"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";
import { createBooking, getBookedTimes, getCemeteries, getCemeterySchedule, getCaseCemeteryBooking, getMyCases } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

export function FamilyCemeteryBookingPage() {
  const { currentRole, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [attachedCr02Files, setAttachedCr02Files] = useState<Record<number, File | null>>({});
  const [caseBookings, setCaseBookings] = useState<Record<number, any | null>>({});
  const [bookingLoadingByCaseId, setBookingLoadingByCaseId] = useState<Record<number, boolean>>({});

  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [cemeteriesLoading, setCemeteriesLoading] = useState(false);
  const [selectedCemetery, setSelectedCemetery] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookedTimes, setBookedTimes] = useState<any[]>([]);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const completedCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "CR2_ISSUED_CLOSED"),
    [cases]
  );

  const selectedCase = completedCases.find((caseItem) => caseItem.caseId === selectedCaseId) || null;
  const selectedCaseBooking = selectedCaseId ? caseBookings[selectedCaseId] : null;
  const selectedCr02File = selectedCaseId ? attachedCr02Files[selectedCaseId] : null;
  const isBookingLoading = selectedCaseId ? !!bookingLoadingByCaseId[selectedCaseId] : false;
  const hasActiveBooking = !!selectedCaseBooking && selectedCaseBooking.status !== "REJECTED";
  const canOpenBookingFlow = !!selectedCr02File && !isBookingLoading && !hasActiveBooking;

  const fetchBookingStatus = async (caseId: number) => {
    setBookingLoadingByCaseId((prev) => ({ ...prev, [caseId]: true }));

    try {
      const booking = await getCaseCemeteryBooking(caseId, token);
      setCaseBookings((prev) => ({ ...prev, [caseId]: booking }));
    } catch {
      setCaseBookings((prev) => ({ ...prev, [caseId]: null }));
    } finally {
      setBookingLoadingByCaseId((prev) => ({ ...prev, [caseId]: false }));
    }
  };

  useEffect(() => {
    if (currentRole === "GUEST") {
      router.push("/login");
      return;
    }

    if (currentRole !== "FAMILY") {
      router.push("/");
      return;
    }

    async function loadCases() {
      try {
        setLoading(true);
        const data = await getMyCases(token);
        const caseList = data.content || [];
        const closedCases = caseList.filter((caseItem: any) => caseItem.status === "CR2_ISSUED_CLOSED");

        setCases(caseList);
        closedCases.forEach((caseItem: any) => {
          void fetchBookingStatus(caseItem.caseId);
        });

        const requestedCaseId = Number(searchParams.get("caseId"));
        if (requestedCaseId && closedCases.some((caseItem: any) => caseItem.caseId === requestedCaseId)) {
          setSelectedCaseId(requestedCaseId);
        } else if (closedCases.length > 0) {
          setSelectedCaseId(closedCases[0].caseId);
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to load cemetery booking data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      void loadCases();
    }
  }, [currentRole, router, searchParams, toast, token]);

  useEffect(() => {
    if (!selectedCaseId || !canOpenBookingFlow) {
      setCemeteries([]);
      setSelectedCemetery(null);
      setSchedules([]);
      setBookedTimes([]);
      setBookingData({ date: "", startTime: "", endTime: "", notes: "" });
      return;
    }

    async function loadCemeteries() {
      try {
        setCemeteriesLoading(true);
        const data = await getCemeteries(selectedCaseId, token);
        setCemeteries(data);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to load cemeteries.",
          variant: "destructive",
        });
      } finally {
        setCemeteriesLoading(false);
      }
    }

    void loadCemeteries();
  }, [canOpenBookingFlow, selectedCaseId, toast, token]);

  const handleSelectCase = (caseId: number) => {
    setSelectedCaseId(caseId);
    setSelectedCemetery(null);
    setSchedules([]);
    setBookedTimes([]);
    setBookingData({ date: "", startTime: "", endTime: "", notes: "" });
    router.replace(`/family/cemetery-booking?caseId=${caseId}`);
  };

  const handleAttachCr02 = (fileList: FileList | null) => {
    if (!selectedCaseId) return;

    setAttachedCr02Files((prev) => ({
      ...prev,
      [selectedCaseId]: fileList && fileList.length > 0 ? fileList[0] : null,
    }));
  };

  const handleSelectCemetery = async (cemeteryId: number) => {
    setSelectedCemetery(cemeteryId);
    setBookedTimes([]);
    setBookingData((prev) => ({ ...prev, date: "", startTime: "", endTime: "" }));

    try {
      const data = await getCemeterySchedule(cemeteryId, token);
      setSchedules(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load cemetery schedule.",
        variant: "destructive",
      });
    }
  };

  const handleDateChange = async (date: string) => {
    setBookingData((prev) => ({ ...prev, date, startTime: "", endTime: "" }));

    if (!date || !selectedCemetery) return;

    try {
      const data = await getBookedTimes(selectedCemetery, date, token);
      setBookedTimes(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load booked time slots.",
        variant: "destructive",
      });
    }
  };

  const isSlotBooked = (start: string, end: string) => {
    return bookedTimes.some((booking) => start < booking.endTime && end > booking.startTime);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCaseId || !selectedCase || !selectedCemetery || !bookingData.startTime || !bookingData.endTime) {
      toast({
        title: "Missing Information",
        description: "Please complete the cemetery, date, and time slot before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBooking(true);

    try {
      await createBooking(
        selectedCemetery,
        {
          deathCaseId: selectedCaseId,
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          notes: bookingData.notes,
        },
        token
      );

      toast({
        title: "Booking Submitted",
        description: `Your cemetery booking request for ${selectedCase.deceasedFullName} has been submitted successfully.`,
      });

      await fetchBookingStatus(selectedCaseId);
      setSelectedCemetery(null);
      setSchedules([]);
      setBookedTimes([]);
      setBookingData({ date: "", startTime: "", endTime: "", notes: "" });
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description: err.message || "Failed to submit cemetery booking.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Loading cemetery booking page...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              onClick={() => router.push("/")}
              className="mb-3 text-sm text-gray-500 underline hover:text-gray-700"
            >
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Cemetery Booking</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Select a completed case, attach the downloaded CR02 PDF, and complete the cemetery booking in one guided flow.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
            <p className="font-semibold">Completed CR02 Cases</p>
            <p className="mt-1 text-2xl font-bold">{completedCases.length}</p>
          </div>
        </div>

        {completedCases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
            No completed CR02 cases are available for cemetery booking yet.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Select a Case</h2>
                <p className="mt-1 text-sm text-gray-500">Choose the finalized CR02 case you want to use for burial booking.</p>
              </div>

              {completedCases.map((caseItem) => {
                const booking = caseBookings[caseItem.caseId];
                const selected = caseItem.caseId === selectedCaseId;

                return (
                  <button
                    key={caseItem.caseId}
                    onClick={() => handleSelectCase(caseItem.caseId)}
                    className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{caseItem.deceasedFullName}</h3>
                        <p className="mt-1 text-xs text-gray-500">Case #{caseItem.caseId}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                        CR02 Ready
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-gray-600">
                      {booking?.status === "APPROVED" && "Booking already approved"}
                      {booking?.status === "PENDING" && "Booking awaiting approval"}
                      {booking?.status === "REJECTED" && "Previous booking rejected"}
                      {!booking && "No booking submitted yet"}
                    </p>
                  </button>
                );
              })}
            </aside>

            <section className="space-y-5">
              {selectedCase ? (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Selected case</p>
                        <h2 className="mt-1 text-2xl font-bold text-gray-900">{selectedCase.deceasedFullName}</h2>
                        <p className="mt-1 text-sm text-gray-500">Case #{selectedCase.caseId}</p>
                      </div>
                      <button
                        onClick={() => router.push("/")}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        Open dashboard to view CR02
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Attach CR02 PDF</h3>
                          <p className="text-sm text-gray-500">Upload the downloaded CR02 file before continuing.</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleAttachCr02(e.target.files)}
                          className="block w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm"
                        />
                        {selectedCr02File && (
                          <p className="text-xs text-gray-500">
                            Attached file: <span className="font-medium text-gray-700">{selectedCr02File.name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">2</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Booking Status Check</h3>
                          <p className="text-sm text-gray-500">The system verifies whether this CR02 has already been used.</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                        {isBookingLoading && <p className="text-gray-500">Checking existing cemetery booking for this CR02...</p>}
                        {!isBookingLoading && !selectedCaseBooking && (
                          <p className="text-gray-700">No cemetery booking has been created for this CR02 form yet.</p>
                        )}
                        {!isBookingLoading && selectedCaseBooking?.status === "PENDING" && (
                          <p className="text-amber-800">
                            A cemetery booking request has already been submitted for this CR02 form and is awaiting approval.
                          </p>
                        )}
                        {!isBookingLoading && selectedCaseBooking?.status === "APPROVED" && (
                          <p className="text-green-800">
                            This CR02 form already has an approved cemetery booking at {selectedCaseBooking.cemeteryName} on {selectedCaseBooking.date} from {selectedCaseBooking.startTime} to {selectedCaseBooking.endTime}.
                          </p>
                        )}
                        {!isBookingLoading && selectedCaseBooking?.status === "REJECTED" && (
                          <p className="text-red-700">
                            The previous booking for this CR02 form was rejected. You may continue with a new booking request.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Complete Cemetery Booking</h3>
                        <p className="text-sm text-gray-500">Choose a cemetery owner in the same sector, then reserve an available time slot.</p>
                      </div>
                    </div>

                    {!canOpenBookingFlow ? (
                      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                        {!selectedCr02File
                          ? "Attach the CR02 PDF to unlock the cemetery selection flow."
                          : "This case cannot proceed to a new booking while an active booking already exists."}
                      </div>
                    ) : (
                      <div className="mt-5 space-y-6">
                        {!selectedCemetery ? (
                          <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Select a Cemetery</h4>
                            {cemeteriesLoading ? (
                              <p className="mt-4 text-sm text-gray-500">Loading cemeteries...</p>
                            ) : (
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {cemeteries.map((cemetery) => (
                                  <button
                                    key={cemetery.id}
                                    onClick={() => void handleSelectCemetery(cemetery.id)}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                  >
                                    <h5 className="font-semibold text-gray-900">{cemetery.name}</h5>
                                    <p className="mt-2 text-sm text-gray-600">Tel: {cemetery.phone}</p>
                                    <p className="text-sm text-gray-600">{cemetery.email}</p>
                                  </button>
                                ))}
                                {cemeteries.length === 0 && (
                                  <p className="text-sm text-gray-500">No cemeteries are available for this case&apos;s sector yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <button
                              onClick={() => {
                                setSelectedCemetery(null);
                                setSchedules([]);
                                setBookedTimes([]);
                                setBookingData({ date: "", startTime: "", endTime: "", notes: "" });
                              }}
                              className="text-sm text-gray-500 underline hover:text-gray-700"
                            >
                              Back to Cemetery List
                            </button>

                            <form onSubmit={handleSubmitBooking} className="mt-4 space-y-5">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
                                <input
                                  type="date"
                                  required
                                  className="w-full rounded-xl border border-gray-300 p-3"
                                  value={bookingData.date}
                                  onChange={(e) => void handleDateChange(e.target.value)}
                                  min={new Date().toISOString().split("T")[0]}
                                />
                              </div>

                              {bookingData.date && schedules.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {schedules.map((schedule) => {
                                      const booked = isSlotBooked(schedule.startTime, schedule.endTime);
                                      const selected = bookingData.startTime === schedule.startTime && bookingData.endTime === schedule.endTime;

                                      return (
                                        <button
                                          key={schedule.id}
                                          type="button"
                                          disabled={booked}
                                          onClick={() => setBookingData((prev) => ({ ...prev, startTime: schedule.startTime, endTime: schedule.endTime }))}
                                          className={`rounded-xl border p-3 text-sm transition ${
                                            booked
                                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                              : selected
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                                          }`}
                                        >
                                          <div>{schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}</div>
                                          {booked && <div className="mt-1 text-[11px] uppercase">Already booked</div>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {bookingData.date && schedules.length === 0 && (
                                <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                  No schedule has been defined by this cemetery owner yet.
                                </p>
                              )}

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                <textarea
                                  rows={4}
                                  className="w-full rounded-xl border border-gray-300 p-3"
                                  value={bookingData.notes}
                                  onChange={(e) => setBookingData((prev) => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Add any burial-related note for the cemetery owner..."
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={!bookingData.startTime || !bookingData.endTime || isSubmittingBooking}
                                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isSubmittingBooking ? "Submitting Booking..." : "Submit Cemetery Booking"}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
                  Select a completed case to start the cemetery booking process.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
