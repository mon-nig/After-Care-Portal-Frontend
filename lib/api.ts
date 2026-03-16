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
    let msg = `B24 submission failed (${response.status})`;
    try { const body = await response.json(); msg = body.message || body.error || msg; } catch {}
    throw new Error(msg);
  }

  return response.json();
}

export async function submitCr02Form(data: Record<string, string>) {
  console.log("[api.ts] submitCr02Form -> POST", `${BASE_URL}/cr02`);
  const response = await fetch(`${BASE_URL}/cr02`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  console.log("[api.ts] submitCr02Form response status:", response.status);
  if (!response.ok) {
    let msg = `CR02 submission failed (${response.status})`;
    try { const body = await response.json(); console.error("[api.ts] CR02 error body:", body); msg = body.message || body.error || msg; } catch {}
    throw new Error(msg);
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
  const url = `${BASE_URL}/tracking/nic/${familyNicNo}`;
  console.log("[api.ts] getTrackingInfo -> GET", url);
  const response = await fetch(url);
  console.log("[api.ts] getTrackingInfo response status:", response.status);
  if (!response.ok) {
    const text = await response.text();
    console.error("[api.ts] getTrackingInfo error body:", text);
    throw new Error(`Failed to fetch tracking info: ${response.status} ${response.statusText}`);
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

export async function fetchCr02ById(id: number) {
  const response = await fetch(`${BASE_URL}/cr02/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch CR02 form: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGnHistory(username: string) {
  const url = `${BASE_URL}/history/gn/${username}`;
  console.log("[api.ts] fetchGnHistory -> GET", url);
  const response = await fetch(url);
  console.log("[api.ts] fetchGnHistory response status:", response.status);
  if (!response.ok) {
    const text = await response.text();
    console.error("[api.ts] fetchGnHistory error body:", text);
    throw new Error(`Failed to fetch GN history: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRegistrarHistory(username: string) {
  const url = `${BASE_URL}/history/registrar/${username}`;
  console.log("[api.ts] fetchRegistrarHistory -> GET", url);
  const response = await fetch(url);
  console.log("[api.ts] fetchRegistrarHistory response status:", response.status);
  if (!response.ok) {
    const text = await response.text();
    console.error("[api.ts] fetchRegistrarHistory error body:", text);
    throw new Error(`Failed to fetch registrar history: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
