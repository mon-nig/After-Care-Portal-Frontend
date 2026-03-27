"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getOwnerBookings, getOwnerSchedules, addOwnerSchedule, updateBookingStatus, deleteOwnerSchedule } from "../../lib/api";
import { useAuth } from "../../contexts/auth-context";

export function CemeteryDashboard() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  const [newSchedule, setNewSchedule] = useState({ startTime: "", endTime: "" });

  const fetchData = async () => {
    try {
      if (!token) return;
      const bData = await getOwnerBookings(token);
      setBookings(bData);
      const sData = await getOwnerSchedules(token);
      setSchedules(sData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addOwnerSchedule(newSchedule, token);
      alert("Schedule added");
      setNewSchedule({ startTime: "", endTime: "" });
      fetchData();
    } catch (err) {
      alert("Failed to add schedule");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateBookingStatus(id, status, token);
      alert("Status updated");
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule block?")) return;
    try {
      await deleteOwnerSchedule(id, token);
      fetchData();
    } catch (err) {
      alert("Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cemetery Management Dashboard</h2>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="w-full mb-6 flex h-auto gap-1 p-1 bg-gray-100/80">
          <TabsTrigger value="requests" className="flex-1">Booking Requests</TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1">Master Schedule</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">Booked Timeslots</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Incoming Booking Requests</h3>
            {bookings.filter(b => b.status === "PENDING").length === 0 ? (
              <p className="text-gray-500">No pending booking requests.</p>
            ) : (
              <div className="space-y-4">
                {bookings.filter(b => b.status === "PENDING").map(b => (
                  <div key={b.id} className="border p-4 rounded flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{b.deceasedName}</p>
                      <p className="text-sm text-gray-600">Date: {b.date} | {b.startTime} - {b.endTime}</p>
                      <p className="text-sm text-gray-500">Notes: {b.notes}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleUpdateStatus(b.id, "APPROVED")} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                      <button onClick={() => handleUpdateStatus(b.id, "REJECTED")} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Master Schedule Management</h3>
            
            <form onSubmit={handleCreateSchedule} className="mb-6 space-y-4 max-w-sm">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Start Time</label>
                  <input type="time" className="border p-2 w-full rounded" required
                    value={newSchedule.startTime} onChange={e => setNewSchedule({...newSchedule, startTime: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">End Time</label>
                  <input type="time" className="border p-2 w-full rounded" required
                    value={newSchedule.endTime} onChange={e => setNewSchedule({...newSchedule, endTime: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Daily Schedule Block</button>
            </form>

            <h4 className="font-semibold mb-2">Common Daily Schedule Blocks</h4>
            <ul className="space-y-2 max-w-sm">
              {schedules.map((s, idx) => (
                <li key={s.id || idx} className="flex justify-between items-center bg-gray-50 border p-3 rounded shadow-sm">
                  <span>{s.startTime} - {s.endTime}</span>
                  <button onClick={() => handleDeleteSchedule(s.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booked Timeslots</h3>
            {bookings.filter(b => b.status === "APPROVED").length === 0 ? (
              <p className="text-gray-500">No approved bookings.</p>
            ) : (
              <div className="space-y-4">
                {bookings.filter(b => b.status === "APPROVED").map(b => (
                  <div key={b.id} className="border p-4 rounded bg-green-50 border-green-200">
                    <p className="font-semibold">{b.deceasedName}</p>
                    <p className="text-sm text-gray-600">Date: {b.date} | {b.startTime} - {b.endTime}</p>
                    <p className="text-sm text-gray-500">Notes: {b.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
