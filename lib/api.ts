import type { CanonicalFamilyReport } from "./death-report-schema";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface CaseListItem {
  caseId: number;
  status: string;
  deceasedFullName: string;
  deceasedNic?: string | null;
  applicantFullName?: string | null;
  causeOfDeath?: string | null;
  b12DoctorName?: string | null;
  b12DoctorId?: string | null;
  b12Icd10Code?: string | null;
  sectorName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CasePageResponse {
  content: CaseListItem[];
}

export interface CaseDetailResponse {
  caseId: number;
  status: string;
  applicantName: string;
  applicantNic: string;
  deceasedFullName: string;
  deceasedOfficialName?: string | null;
  deceasedNic?: string | null;
  dateOfBirth?: string | null;
  dateOfDeath: string;
  gender: string;
  address?: string | null;
  sectorCode: string;
  sectorName: string;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  familyReport?: Record<string, unknown>;
  b12HeaderPrefill?: Record<string, unknown>;
  b24Prefill?: Record<string, unknown>;
  cr2Prefill?: Record<string, unknown>;
  formB12?: Record<string, any> | null;
  formB24?: Record<string, any> | null;
  formCr2Family?: Record<string, any> | null;
  formCr2?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCasePayload {
  familyReport: CanonicalFamilyReport;
  submissionOtp: string;
}

export interface IssueB12Payload {
  naturalDeath: boolean;
  icd10Code: string;
  immediateCause: string;
  antecedentCauses: string[];
  contributoryCauses: string[];
  doctorViewedBodyAt: string;
  doctorDesignation: string;
  slmcRegistrationNo: string;
}

export interface IssueB24Payload {
  b24GramaDivision: string;
  b24RegistrarDivision: string;
  b24SerialNo?: string | null;
  deathDate: string;
  b24PlaceOfDeath: string;
  b24FullName: string;
  b24Sex: string;
  b24Race?: string | null;
  b24Age: string;
  b24Profession?: string | null;
  b24CauseOfDeath: string;
  b24InformantName: string;
  b24InformantAddress: string;
  b24RegistrarName?: string | null;
  b24SignedAt?: string | null;
  b24SignDate: string;
  b24GNSignature: string;
  b24Confirmed: boolean;
}

export function buildIssueB24Payload(formData: Record<string, string>): IssueB24Payload {
  const year = Number(formData.b24DeathYear);
  const month = Number(formData.b24DeathMonth);
  const day = Number(formData.b24DeathDay);
  const deathDate = new Date(year, Math.max(month - 1, 0), day || 1);

  return {
    b24GramaDivision: formData.b24GramaDivision || "",
    b24RegistrarDivision: formData.b24RegistrarDivision || "",
    b24SerialNo: formData.b24SerialNo || null,
    deathDate: deathDate.toISOString().slice(0, 10),
    b24PlaceOfDeath: formData.b24PlaceOfDeath || "",
    b24FullName: formData.b24FullName || "",
    b24Sex: formData.b24Sex || "",
    b24Race: formData.b24Race || null,
    b24Age: formData.b24Age || "",
    b24Profession: formData.b24Profession || null,
    b24CauseOfDeath: formData.b24CauseOfDeath || "",
    b24InformantName: formData.b24InformantName || "",
    b24InformantAddress: formData.b24InformantAddress || "",
    b24RegistrarName: formData.b24RegistrarName || null,
    b24SignedAt: formData.b24SignedAt || null,
    b24SignDate: formData.b24SignDate || "",
    b24GNSignature: formData.b24GNSignature || "",
    b24Confirmed: formData.b24Confirmed === "true",
  };
}

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

const CASES_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/v1", "/cases")
  : "http://localhost:8080/api/cases";

async function authFetch<T = any>(url: string, options: RequestInit, token: string | null): Promise<T> {
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

export async function createCase(data: CreateCasePayload, token: string | null) {
  return authFetch<CaseDetailResponse>(
    CASES_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getMyCases(token: string | null) {
  return authFetch<CasePageResponse>(CASES_URL, { method: "GET" }, token);
}

export async function getCaseDetail(caseId: number, token: string | null) {
  return authFetch<CaseDetailResponse>(`${CASES_URL}/${caseId}`, { method: "GET" }, token);
}

export async function issueB12(caseId: number, data: IssueB12Payload, token: string | null) {
  return authFetch<CaseDetailResponse>(
    `${CASES_URL}/${caseId}/b12`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function issueB24(caseId: number, data: IssueB24Payload, token: string | null) {
  return authFetch<CaseDetailResponse>(
    `${CASES_URL}/${caseId}/b24`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function assignDoctor(caseId: number, doctorId: string, token: string | null) {
  return authFetch<CaseDetailResponse>(
    `${CASES_URL}/${caseId}/assign-doctor`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId }),
    },
    token,
  );
}

export async function gnAction(caseId: number, action: "APPROVE" | "REQUEST_MEDICAL", token: string | null) {
  return authFetch<CaseDetailResponse>(
    `${CASES_URL}/${caseId}/gn-action`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
    token,
  );
}

export async function issueCr2(caseId: number, token: string | null) {
  return authFetch<CaseDetailResponse>(`${CASES_URL}/${caseId}/cr2`, { method: "POST" }, token);
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/v1", "")
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
  return authFetch(
    `${API_BASE_URL}/cemeteries/${cemeteryId}/bookings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
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
  return authFetch(
    `${API_BASE_URL}/cemetery-owner/schedule`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateBookingStatus(bookingId: number, status: string, token: string | null) {
  return authFetch(
    `${API_BASE_URL}/cemetery-owner/bookings/${bookingId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    token,
  );
}

export async function deleteOwnerSchedule(id: number, token: string | null) {
  return authFetch(`${API_BASE_URL}/cemetery-owner/schedule/${id}`, { method: "DELETE" }, token);
}
