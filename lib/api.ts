export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function submitB24Form(data: Record<string, string>) {
  const response = await fetch(`${BASE_URL}/b24`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit B24 form: ${response.statusText}`);
  }

  return response.json();
}

export async function submitCr02Form(data: Record<string, string>) {
  const response = await fetch(`${BASE_URL}/cr02`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit CR02 form: ${response.statusText}`);
  }

  return response.json();
}

export async function getUnreadNotifications(username: string, nicNo: string, role: string) {
  const params = new URLSearchParams({ role });
  if (username) params.append("username", username);
  if (nicNo) params.append("nicNo", nicNo);
  const response = await fetch(`${BASE_URL}/notifications/unread?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }
  return response.json();
}

export async function getTrackingInfo(familyNicNo: string) {
  const response = await fetch(`${BASE_URL}/tracking/nic/${familyNicNo}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tracking info: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRegistrars() {
  const response = await fetch(`${BASE_URL}/users/registrars`);
  if (!response.ok) {
    throw new Error(`Failed to fetch registrars: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchB24ById(id: number) {
  const response = await fetch(`${BASE_URL}/b24/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch B24 form: ${response.statusText}`);
  }
  return response.json();
}

// ==========================================
// DEATH CASE WORKFLOW API CALLS
// ==========================================
const CASES_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('/v1', '/cases') 
  : "http://localhost:8080/api/cases";

async function authFetch(url: string, options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `API Error: ${res.statusText}`);
  }
  return res.json();
}

export async function createCase(data: any, token: string | null) {
  return authFetch(CASES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, token);
}

export async function getMyCases(token: string | null) {
  return authFetch(CASES_URL, { method: "GET" }, token);
}

export async function getCaseDetail(caseId: number, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}`, { method: "GET" }, token);
}

export async function issueB12(caseId: number, data: any, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/b12`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, token);
}

export async function issueB24(caseId: number, data: any, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/b24`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, token);
}

export async function assignDoctor(caseId: number, doctorId: number, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/assign-doctor`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doctorId })
  }, token);
}

export async function gnAction(caseId: number, action: "APPROVE" | "REQUEST_MEDICAL", token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/gn-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  }, token);
}

export async function issueCr2(caseId: number, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/cr2`, {
    method: "POST"
  }, token);
}

// ==========================================
// CEMETERY WORKFLOW API CALLS
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('/v1', '') 
  : "http://localhost:8080/api";

export async function getCemeteries(caseId: number, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemeteries?caseId=${caseId}`, { method: "GET" }, token);
}

export async function getCemeterySchedule(cemeteryId: number, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemeteries/${cemeteryId}/schedule`, { method: "GET" }, token);
}

export async function getBookedTimes(cemeteryId: number, date: string, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemeteries/${cemeteryId}/booked-times?date=${date}`, { method: "GET" }, token);
}

export async function createBooking(cemeteryId: number, data: any, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemeteries/${cemeteryId}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, token);
}

export async function getCaseCemeteryBooking(caseId: number, token: string | null) {
  return authFetch(`${API_BASE_URL}/cases/${caseId}/cemetery-booking`, { method: "GET" }, token);
}

export async function getOwnerBookings(token: string | null) {
  return authFetch(`${API_BASE_URL}/cemetery-owner/bookings`, { method: "GET" }, token);
}

export async function getOwnerSchedules(token: string | null) {
  return authFetch(`${API_BASE_URL}/cemetery-owner/schedule`, { method: "GET" }, token);
}

export async function addOwnerSchedule(data: any, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemetery-owner/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, token);
}

export async function updateBookingStatus(bookingId: number, status: string, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemetery-owner/bookings/${bookingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }, token);
}

export async function deleteOwnerSchedule(id: number, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemetery-owner/schedule/${id}`, {
    method: "DELETE"
  }, token);
}
