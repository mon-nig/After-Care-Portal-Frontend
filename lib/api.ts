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

export async function fetchCemeteries() {
  const response = await fetch(`${BASE_URL}/users/cemeteries`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cemeteries: ${response.statusText}`);
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

export async function submitCr2Family(caseId: number, data: any, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/cr2/family`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cr2FormData: JSON.stringify(data) })
  }, token);
}

export async function issueCr2(caseId: number, token: string | null) {
  return authFetch(`${CASES_URL}/${caseId}/cr2`, {
    method: "POST"
  }, token);
}

export async function fetchCr02ById(id: number) {
  const response = await fetch(`${BASE_URL}/cr02/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch CR02 form: ${response.statusText}`);
  }
  return response.json();
}

export async function submitCemeteryRequest(data: Record<string, any>) {
  const response = await fetch(`${BASE_URL}/cemetery-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to submit cemetery request");
  return response.json();
}

export async function fetchFamilyCemeteryRequests(nicNo: string) {
  const response = await fetch(`${BASE_URL}/cemetery-requests/family/${nicNo}`);
  if (!response.ok) throw new Error("Failed to fetch family cemetery requests");
  return response.json();
}

export async function fetchCemeteryDashboardRequests(username: string) {
  const response = await fetch(`${BASE_URL}/cemetery-requests/cemetery/${username}`);
  if (!response.ok) throw new Error("Failed to fetch cemetery dashboard requests");
  return response.json();
}
export async function fetchCemeterySchedules(username: string) {
  const response = await fetch(`${BASE_URL}/cemetery-schedules/${username}`);
  if (!response.ok) throw new Error("Failed to fetch schedules");
  return response.json();
}

export async function addCemeterySchedule(username: string, timeSlot: string) {
  const response = await fetch(`${BASE_URL}/cemetery-schedules/${username}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeSlot })
  });
  if (!response.ok) throw new Error("Failed to add schedule");
  return response.json();
}

export async function deleteCemeterySchedule(id: number) {
  const response = await fetch(`${BASE_URL}/cemetery-schedules/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete schedule");
}

export async function fetchBookedSlots(username: string, date: string) {
  const response = await fetch(`${BASE_URL}/cemetery-requests/cemetery/${username}/booked-slots?date=${date}`);
  if (!response.ok) throw new Error("Failed to fetch booked slots");
  return response.json();
}
export async function updateCemeteryRequestStatus(id: number, status: string) {
  const url = new URL(`${BASE_URL}/cemetery-requests/${id}/status`);
  url.searchParams.append("status", status);

  const response = await fetch(url.toString(), {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Failed to update status");
  return response.json();
}


