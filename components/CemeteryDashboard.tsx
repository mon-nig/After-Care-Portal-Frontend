"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { 
  fetchCemeteryDashboardRequests, 
  updateCemeteryRequestStatus, 
  fetchCemeterySchedules, 
  addCemeterySchedule, 
  deleteCemeterySchedule 
} from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface CemeteryRequest {
  id: number;
  cr02FormId: number;
  familyNicNo: string;
  deceasedName: string;
  requestedDate: string;
  status: string;
  timeSlot?: string;
  createdAt: string;
}

interface ScheduleSlot {
  id: number;
  timeSlot: string;
}

export function CemeteryDashboard() {
  const { currentUsername } = useAuth();
  
  // Requests state
  const [requests, setRequests] = useState<CemeteryRequest[]>([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [reqError, setReqError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Schedules state
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loadingSched, setLoadingSched] = useState(true);
  const [newSlot, setNewSlot] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);

  useEffect(() => {
    if (!currentUsername) {
      setLoadingReq(false);
      setLoadingSched(false);
      return;
    }

    const loadData = async () => {
      try {
        const reqData = await fetchCemeteryDashboardRequests(currentUsername);
        setRequests(reqData);
      } catch (err) {
        setReqError("Failed to load operations from server.");
      } finally {
        setLoadingReq(false);
      }
    };
    
    const loadSchedules = async () => {
      try {
        const schedData = await fetchCemeterySchedules(currentUsername);
        setSchedules(schedData);
      } catch (err) {
        console.error("Failed to load schedules", err);
      } finally {
        setLoadingSched(false);
      }
    };

    loadData();
    loadSchedules();
    const inv = setInterval(loadData, 30000);
    return () => clearInterval(inv);
  }, [currentUsername]);

  // Request handlers
  const handleUpdateStatus = async (id: number, status: string) => {
    setProcessingId(id);
    try {
      const updated = await updateCemeteryRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  // Schedule handlers
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUsername || !newSlot.trim()) return;
    setAddingSlot(true);
    try {
      const added = await addCemeterySchedule(currentUsername, newSlot.trim());
      setSchedules([...schedules, added]);
      setNewSlot("");
    } catch(err: any) {
      alert(err.message || "Failed to add schedule");
    } finally {
      setAddingSlot(false);
    }
  }

  const handleDeleteSchedule = async (id: number) => {
    if(!confirm("Are you sure you want to delete this time slot? It won't affect past bookings but will prevent future ones.")) return;
    try {
      await deleteCemeterySchedule(id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch(err: any) {
      alert(err.message || "Failed to delete schedule");
    }
  }

  if (loadingReq || loadingSched) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cemetery Management</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your incoming booking requests and your recurring master schedule available slots.
        </p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="w-full sm:w-auto mb-6 flex-wrap h-auto gap-1 p-1 inline-flex bg-gray-100 rounded-lg">
          <TabsTrigger value="requests" className="flex-1 sm:flex-none text-xs sm:text-sm px-6">
            Booking Requests
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 sm:flex-none text-xs sm:text-sm px-6">
            Master Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="focus:outline-none">
          {reqError ? (
             <div className="text-center py-12 text-red-600">{reqError}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">No booking requests found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{req.deceasedName}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 font-mono mb-2">CR02 Form #{req.cr02FormId} &bull; Family NIC: {req.familyNicNo}</div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                         <div className="text-sm text-gray-700">
                           <span className="font-medium text-gray-500">Requested Date: </span> 
                           <span className="font-medium">{req.requestedDate}</span>
                         </div>
                         <div className="text-sm text-gray-700">
                           <span className="font-medium text-gray-500">Requested Time: </span> 
                           <span className="font-medium">{req.timeSlot || "Not specified"}</span>
                         </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        Submitted: {new Date(req.createdAt).toLocaleString("en-LK")}
                      </div>
                    </div>

                    {req.status === "PENDING" && (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex gap-2">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="focus:outline-none">
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Manage Available Time Slots</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-2xl">
                Define the recurring time slots (e.g., &quot;09:00 AM - 10:00 AM&quot;) that will be available by default for every day. Once a slot is booked by a family for a specific date, it will automatically become unavailable for others on that same date.
              </p>

              <form onSubmit={handleAddSchedule} className="flex flex-wrap gap-3 items-end mb-8">
                <div className="flex-1 min-w-[250px] max-w-sm">
                   <label className="block text-sm font-medium text-gray-700 mb-1">New Time Slot</label>
                   <input
                      type="text"
                      required
                      placeholder="e.g. 10:00 AM - 11:30 AM"
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                   />
                </div>
                <button
                  type="submit"
                  disabled={!newSlot.trim() || addingSlot}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 shadow-sm disabled:opacity-50 transition-colors"
                >
                  {addingSlot ? "Adding..." : "Add Slot"}
                </button>
              </form>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Current Master Slots</h4>
                {schedules.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-md border border-gray-100">
                    No time slots defined yet. Families will not be able to book your cemetery until you define available slots.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {schedules.map((slot) => (
                      <div key={slot.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
                        <span className="font-medium text-gray-900 text-sm">{slot.timeSlot}</span>
                        <button
                          onClick={() => handleDeleteSchedule(slot.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete slot"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
