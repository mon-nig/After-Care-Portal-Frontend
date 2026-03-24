"use client";

import React, { useState, useEffect } from "react";
import { getCemeteries, getCemeterySchedule, createBooking } from "../../lib/api";

interface CemeteryBookingModalProps {
  token: string | null;
  caseId: number;
  deceasedName: string;
  onClose: () => void;
}

export function CemeteryBookingModal({ token, caseId, deceasedName, onClose }: CemeteryBookingModalProps) {
  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [selectedCemetery, setSelectedCemetery] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: ""
  });

  useEffect(() => {
    async function fetchCems() {
      try {
        const data = await getCemeteries(token);
        setCemeteries(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCems();
  }, [token]);

  const handleSelectCemetery = async (cemId: number) => {
    setSelectedCemetery(cemId);
    try {
      const data = await getCemeterySchedule(cemId, token);
      setSchedules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCemetery) return;
    try {
      await createBooking(selectedCemetery, {
        deathCaseId: caseId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        notes: bookingData.notes
      }, token);
      alert("Booking request submitted successfully!");
      onClose();
    } catch (err) {
      alert("Failed to submit booking");
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
                onClick={() => setSelectedCemetery(null)}
                className="text-sm text-gray-500 hover:text-gray-700 underline mb-4 inline-block"
              >
                &larr; Back to Cemetery List
              </button>
              
              <h3 className="text-lg font-medium mb-4">2. Master Schedule</h3>
              <div className="bg-gray-50 p-4 rounded mb-6 border">
                {schedules.length === 0 ? (
                  <p className="text-gray-500 text-sm">No specific schedule blocks defined by owner.</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {schedules.map(s => (
                      <li key={s.id}>{s.date} : {s.startTime} - {s.endTime}</li>
                    ))}
                  </ul>
                )}
              </div>

              <h3 className="text-lg font-medium mb-4">3. Request Booking</h3>
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required className="border p-2 w-full rounded"
                    value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" required className="border p-2 w-full rounded"
                      value={bookingData.startTime} onChange={e => setBookingData({...bookingData, startTime: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time (Optional consecutive slots)</label>
                    <input type="time" required className="border p-2 w-full rounded"
                      value={bookingData.endTime} onChange={e => setBookingData({...bookingData, endTime: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea className="border p-2 w-full rounded" rows={3}
                    value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})}></textarea>
                </div>
                
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 w-full py-3">
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
