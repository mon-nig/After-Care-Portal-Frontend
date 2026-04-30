"use client";

import React, { useState, useEffect } from "react";
import { getCemeteries, getCemeterySchedule, getBookedTimes, createBooking } from "../../lib/api";
import { useToast } from "../ui/use-toast";

interface CemeteryBookingModalProps {
  token: string | null;
  caseId: number;
  deceasedName: string;
  onClose: () => void;
}

export function CemeteryBookingModal({ token, caseId, deceasedName, onClose }: CemeteryBookingModalProps) {
  const { toast } = useToast();
  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [selectedCemetery, setSelectedCemetery] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookedTimes, setBookedTimes] = useState<any[]>([]);

  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: ""
  });

  useEffect(() => {
    async function fetchCems() {
      try {
        const data = await getCemeteries(caseId, token);
        setCemeteries(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCems();
  }, [caseId, token]);

  const handleSelectCemetery = async (cemId: number) => {
    setSelectedCemetery(cemId);
    try {
      const data = await getCemeterySchedule(cemId, token);
      setSchedules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = async (date: string) => {
    setBookingData({ ...bookingData, date, startTime: "", endTime: "" });
    if (!date || !selectedCemetery) return;
    try {
      const data = await getBookedTimes(selectedCemetery, date, token);
      setBookedTimes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const isSlotBooked = (start: string, end: string) => {
    return bookedTimes.some(b => {
      // Very basic collision logic: if bounds overlap
      return (start < b.endTime && end > b.startTime);
    });
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCemetery || !bookingData.startTime || !bookingData.endTime) {
      toast({
        title: "Missing Information",
        description: "Please specify a valid time slot from the schedule.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createBooking(selectedCemetery, {
        deathCaseId: caseId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        notes: bookingData.notes
      }, token);
      toast({
        title: "Success",
        description: "Booking request submitted successfully!",
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to submit booking",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Book Cemetery for {deceasedName}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold p-2 text-xl">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!selectedCemetery ? (
            <div>
              <h3 className="text-lg font-medium mb-4">1. Select a Cemetery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cemeteries.map(c => (
                  <div key={c.id}
                    className="border p-4 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                    onClick={() => handleSelectCemetery(c.id)}>
                    <h4 className="font-bold">{c.name}</h4>
                    <p className="text-sm text-gray-600">Tel: {c.phone}</p>
                    <p className="text-sm text-gray-600">{c.email}</p>
                  </div>
                ))}
                {cemeteries.length === 0 && <p className="text-gray-500">No cemeteries available.</p>}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setSelectedCemetery(null); setBookingData({ date: "", startTime: "", endTime: "", notes: "" }); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline mb-4 inline-block"
              >
                &larr; Back to Cemetery List
              </button>

              <h3 className="text-lg font-medium mb-4">2. Select Date & Slot</h3>
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required className="border p-2 w-full rounded"
                    value={bookingData.date} onChange={e => handleDateChange(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>

                {bookingData.date && schedules.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slots (Common Schedule for any day)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {schedules.map(s => {
                        const booked = isSlotBooked(s.startTime, s.endTime);
                        const selected = (bookingData.startTime === s.startTime && bookingData.endTime === s.endTime);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={booked}
                            onClick={() => setBookingData({ ...bookingData, startTime: s.startTime, endTime: s.endTime })}
                            className={`p-2 border rounded text-sm text-center transition ${booked ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed" : selected ? "bg-blue-600 text-white border-blue-600" : "hover:border-blue-500 hover:bg-blue-50 bg-white"}`}
                          >
                            {s.startTime.substring(0, 5)} - {s.endTime.substring(0, 5)}
                            {booked && <span className="block text-xs mt-1 text-red-500 font-semibold uppercase">Already Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {bookingData.date && schedules.length === 0 && (
                  <p className="text-sm text-gray-500 p-2 bg-gray-50 border rounded text-center">No schedule defined by this cemetery owner yet.</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea className="border p-2 w-full rounded focus:ring focus:ring-blue-200" rows={3}
                    value={bookingData.notes} onChange={e => setBookingData({ ...bookingData, notes: e.target.value })} placeholder="Any special requests or details for the cemetery..."></textarea>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 w-full py-3 disabled:opacity-50 transition" disabled={!bookingData.startTime || !bookingData.endTime}>
                  Submit Booking Request
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
